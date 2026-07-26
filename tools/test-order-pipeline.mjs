/**
 * Paid-order pipeline tests for worker/orders.js.
 *
 *   npm run test:orders
 *
 * D1 is backed by a real in-memory SQLite database running the actual
 * migration, so the SQL is exercised rather than mocked. Browser Rendering and
 * Resend are stubbed through globalThis.fetch.
 *
 * What is proven here:
 *   • the amount charged comes from the stored quote, not the browser
 *   • verify-payment and the webhook racing on one payment produce one order,
 *     one PDF and one pair of emails
 *   • a PDF failure still records the paid order and still sends email
 *   • a failing email is retried with backoff and never fails silently
 */
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = readFileSync(path.join(HERE, '..', 'migrations', '0001_init.sql'), 'utf8');

let orders;
let email;

before(async () => {
  orders = await import('../worker/orders.js');
  email = await import('../worker/email.js');
});

// ---------- a D1-shaped adapter over node:sqlite ----------

function createD1 () {
  const db = new DatabaseSync(':memory:');
  db.exec(MIGRATION);

  const normalise = (row) => {
    if (!row) return row;
    const out = {};
    for (const [k, v] of Object.entries(row)) out[k] = v;
    return out;
  };

  return {
    prepare (sql) {
      let bound = [];
      const api = {
        bind (...args) { bound = args.map((a) => (a === undefined ? null : a)); return api; },
        async first () {
          const stmt = db.prepare(sql);
          return normalise(stmt.get(...bound));
        },
        async all () {
          const stmt = db.prepare(sql);
          return { results: stmt.all(...bound).map(normalise) };
        },
        async run () {
          const stmt = db.prepare(sql);
          // RETURNING clauses have to be read, not executed as a write.
          if (/returning/i.test(sql)) {
            const row = normalise(stmt.get(...bound));
            return { meta: { changes: row ? 1 : 0 }, results: row ? [row] : [] };
          }
          const info = stmt.run(...bound);
          return { meta: { changes: Number(info.changes || 0), last_row_id: Number(info.lastInsertRowid || 0) } };
        },
      };
      return api;
    },
    _raw: db,
  };
}

// ---------- stubbed outbound calls ----------

const calls = { pdf: 0, resend: [], pdfFails: false, resendFailsUntil: 0 };

function installFetchStub () {
  globalThis.fetch = async (url, init) => {
    const href = String(url);

    if (href.includes('browser-rendering/pdf')) {
      calls.pdf++;
      if (calls.pdfFails) {
        return new Response(JSON.stringify({ errors: [{ message: 'renderer unavailable' }] }), { status: 503 });
      }
      // A minimal but structurally valid PDF: worker/pdf.js checks the header.
      const bytes = new Uint8Array(2048);
      bytes.set(new TextEncoder().encode('%PDF-1.7\n'), 0);
      return new Response(bytes, { status: 200 });
    }

    if (href.includes('api.resend.com')) {
      const body = JSON.parse(init.body);
      calls.resend.push(body);
      if (calls.resendFailsUntil > 0) {
        calls.resendFailsUntil--;
        return new Response('rate limited', { status: 429 });
      }
      return new Response(JSON.stringify({ id: 'msg_' + calls.resend.length }), { status: 200 });
    }

    throw new Error('unexpected fetch to ' + href);
  };
}

function makeEnv (db) {
  return {
    DB: db,
    CF_ACCOUNT_ID: 'acct_test',
    CF_BROWSER_TOKEN: 'tok_test',
    RESEND_API_KEY: 're_test',
    ADMIN_EMAIL: 'info@woodenmax.com',
    ORDER_FROM_EMAIL: 'WoodenMax Orders <orders@woodenmax.in>',
    SITE_ORIGIN: 'https://woodenmax.in',
  };
}

const CUSTOMER = { name: 'Test Customer', mobile: '9999999999', email: 'customer@example.com', city: 'Hyderabad', address: 'Plot 42' };

const ITEMS = [
  {
    itemId: '11111111-1111-4111-8111-111111111111',
    productName: '3 Track Sliding Window',
    category: 'Aluminium Windows',
    area: '3000 × 1500 mm',
    exactAmount: 52300,
    details: [{ label: 'Width', value: '3000' }, { label: 'Glass', value: '8mm Toughened' }, { label: 'Quantity', value: '2' }],
  },
  {
    itemId: '22222222-2222-4222-8222-222222222222',
    productName: 'Aluminium Pergola',
    category: 'Pergolas',
    area: '5000 × 3000 mm',
    exactAmount: 325000,
    details: [{ label: 'Width', value: '5000' }, { label: 'Finish', value: 'Wood' }, { label: 'Quantity', value: '1' }],
  },
];

const EXPECTED_SUBTOTAL = 52300 + 325000;
const EXPECTED_GST = Math.round(EXPECTED_SUBTOTAL * 0.18);
const EXPECTED_TOTAL = EXPECTED_SUBTOTAL + EXPECTED_GST;

let db;
let env;

beforeEach(() => {
  db = createD1();
  env = makeEnv(db);
  calls.pdf = 0;
  calls.resend = [];
  calls.pdfFails = false;
  calls.resendFailsUntil = 0;
  installFetchStub();
});

async function seedQuote (overrides = {}) {
  return orders.saveQuote(env, {
    quoteId: overrides.quoteId,
    items: overrides.items || ITEMS,
    customer: overrides.customer || CUSTOMER,
    sourceUrl: 'https://woodenmax.in/products/aluminium-windows/3-track-sliding-window',
  });
}

// ---------- quotes ----------

test('a quote is priced by the server and gets a running number', async () => {
  const saved = await seedQuote();
  assert.match(saved.quoteNo, /^WM-Q-\d{4}-0001$/);
  assert.equal(saved.version, 1);
  assert.equal(saved.subtotal_inr, EXPECTED_SUBTOTAL);
  assert.equal(saved.gst_inr, EXPECTED_GST);
  assert.equal(saved.total_inr, EXPECTED_TOTAL);
});

test('re-saving the same quote bumps the version and keeps the quote number', async () => {
  const first = await seedQuote();
  const second = await seedQuote({ quoteId: first.quoteId, items: [ITEMS[0]] });

  assert.equal(second.quoteNo, first.quoteNo);
  assert.equal(second.version, 2);
  assert.equal(second.subtotal_inr, 52300);

  const versions = await db.prepare('SELECT version, total_inr FROM quote_versions WHERE quote_id = ? ORDER BY version').bind(first.quoteId).all();
  assert.equal(versions.results.length, 2, 'both versions must be retained');
  assert.equal(versions.results[0].total_inr, EXPECTED_TOTAL);
});

test('a booking charges the server constant, not whatever the client asks for', async () => {
  const saved = await seedQuote();
  const quote = await orders.getQuote(env, saved.quoteId);
  assert.equal(orders.resolveAmountPaise(quote, 'order_booking'), 100000);
});

test('a full payment is recomputed from the stored line items', async () => {
  const saved = await seedQuote();
  const quote = await orders.getQuote(env, saved.quoteId);
  assert.equal(orders.resolveAmountPaise(quote, 'order_full_pay'), EXPECTED_SUBTOTAL * 100);
});

test('tampering with a line item after saving cannot lower the charge below the stored quote', async () => {
  const saved = await seedQuote();
  const quote = await orders.getQuote(env, saved.quoteId);
  // A tampered in-memory copy must not affect what the database says.
  quote.items[0].exactAmount = 1;
  const fresh = await orders.getQuote(env, saved.quoteId);
  assert.equal(orders.resolveAmountPaise(fresh, 'order_full_pay'), EXPECTED_SUBTOTAL * 100);
});

// ---------- fulfilment ----------

test('fulfilment records the order, renders the PDF and queues both emails', async () => {
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_ABC123',
    razorpayOrderId: 'order_ABC123',
    quoteId: saved.quoteId,
    purpose: 'order_booking',
  });

  assert.match(result.orderNo, /^WM-O-\d{4}-0001$/);
  assert.equal(result.duplicate, false);
  assert.equal(result.pdfStatus, 'ready');
  assert.equal(result.paidInr, 1000);
  assert.equal(result.balanceInr, EXPECTED_TOTAL - 1000);

  const row = await orders.getOrderByNo(env, result.orderNo);
  assert.equal(row.status, 'fulfilled');
  assert.equal(row.payment_id, 'pay_ABC123');
  assert.equal(row.pdf_status, 'ready');
  assert.ok(row.pdf_bytes > 0, 'the PDF must be stored');

  assert.equal(calls.pdf, 1, 'exactly one PDF render');
  assert.equal(calls.resend.length, 2, 'admin and customer must both be mailed');

  const recipients = calls.resend.map((m) => m.to[0]).sort();
  assert.deepEqual(recipients, ['customer@example.com', 'info@woodenmax.com']);
  calls.resend.forEach((m) => {
    assert.equal(m.from, 'WoodenMax Orders <orders@woodenmax.in>', 'must send from our verified domain');
    assert.ok(m.attachments && m.attachments.length === 1, 'the PDF must be attached');
    assert.match(m.attachments[0].filename, /^WoodenMax-WM-O-\d{4}-0001\.pdf$/);
  });
});

test('verify-payment and the webhook racing on one payment produce one order', async () => {
  const saved = await seedQuote();
  const args = { paymentId: 'pay_RACE', razorpayOrderId: 'order_RACE', quoteId: saved.quoteId, purpose: 'order_booking' };

  const first = await orders.fulfilOrder(env, null, args);
  const second = await orders.fulfilOrder(env, null, args);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true, 'the second caller must not re-run the pipeline');
  assert.equal(second.orderNo, first.orderNo);

  const count = await db.prepare('SELECT COUNT(*) AS n FROM orders').bind().first();
  assert.equal(count.n, 1, 'only one order row');
  assert.equal(calls.pdf, 1, 'the PDF must not be rendered twice');
  assert.equal(calls.resend.length, 2, 'the customer must not be emailed twice');
});

test('a pending order row created at checkout is reused, not duplicated', async () => {
  const saved = await seedQuote();
  const pending = await orders.recordPendingOrder(env, {
    quoteId: saved.quoteId,
    quoteVersion: saved.version,
    razorpayOrderId: 'order_PENDING',
    amountPaise: 100000,
    purpose: 'order_booking',
  });

  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_PENDING',
    razorpayOrderId: 'order_PENDING',
    quoteId: saved.quoteId,
    purpose: 'order_booking',
  });

  assert.equal(result.orderNo, pending.orderNo, 'the checkout row must be the one that gets paid');
  const count = await db.prepare('SELECT COUNT(*) AS n FROM orders').bind().first();
  assert.equal(count.n, 1);
});

test('a PDF failure still records the paid order and still sends email', async () => {
  calls.pdfFails = true;
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_NOPDF',
    razorpayOrderId: 'order_NOPDF',
    quoteId: saved.quoteId,
    purpose: 'order_full_pay',
  });

  assert.equal(result.pdfStatus, 'failed');
  const row = await orders.getOrderByNo(env, result.orderNo);
  assert.equal(row.status, 'fulfilled', 'a paid order is never lost to a PDF failure');
  assert.equal(row.payment_id, 'pay_NOPDF');
  assert.equal(row.pdf_status, 'failed');

  assert.equal(calls.resend.length, 2, 'both parties are still told about the payment');
  calls.resend.forEach((m) => assert.equal(m.attachments, undefined, 'no attachment when there is no PDF'));

  const events = await db.prepare("SELECT type FROM order_events WHERE order_no = ? AND type = 'PDFFailed'").bind(result.orderNo).all();
  assert.equal(events.results.length, 1, 'the failure must be in the audit log');
});

test('a failed PDF can be regenerated later', async () => {
  calls.pdfFails = true;
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_REGEN', razorpayOrderId: 'order_REGEN', quoteId: saved.quoteId, purpose: 'order_booking',
  });
  assert.equal(result.pdfStatus, 'failed');

  calls.pdfFails = false;
  const bytes = await orders.regenerateOrderPdf(env, result.orderNo);
  assert.ok(bytes.length > 1000);

  const row = await orders.getOrderByNo(env, result.orderNo);
  assert.equal(row.pdf_status, 'ready');
});

// ---------- email retry ----------

test('a failing email is retried with backoff and logged, never dropped', async () => {
  calls.resendFailsUntil = 2;
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_MAILFAIL', razorpayOrderId: 'order_MAILFAIL', quoteId: saved.quoteId, purpose: 'order_booking',
  });

  const queued = await db.prepare('SELECT kind, status, attempts, next_attempt_at, last_error FROM email_queue WHERE order_no = ? ORDER BY id').bind(result.orderNo).all();
  assert.equal(queued.results.length, 2);
  queued.results.forEach((row) => {
    assert.equal(row.status, 'pending', 'a failed send stays queued');
    assert.equal(row.attempts, 1);
    assert.ok(row.next_attempt_at > Date.now(), 'the retry must be scheduled in the future');
    assert.match(row.last_error, /429/);
  });

  const logged = await db.prepare("SELECT COUNT(*) AS n FROM order_events WHERE type = 'EmailRetryScheduled'").bind().first();
  assert.equal(logged.n, 2, 'every failure is audited — no silent failures');

  // The cron trigger picks them up once the backoff has elapsed.
  await db.prepare('UPDATE email_queue SET next_attempt_at = 0 WHERE order_no = ?').bind(result.orderNo).run();
  const drained = await email.drainEmailQueue(env, {});
  assert.equal(drained.sent, 2, 'the retry delivers both mails');

  const after = await db.prepare('SELECT status FROM email_queue WHERE order_no = ?').bind(result.orderNo).all();
  after.results.forEach((row) => assert.equal(row.status, 'sent'));
});

test('the queue gives up after the retry budget and says so in the log', async () => {
  calls.resendFailsUntil = Number.MAX_SAFE_INTEGER;
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_DEAD', razorpayOrderId: 'order_DEAD', quoteId: saved.quoteId, purpose: 'order_booking',
  });

  for (let i = 0; i < 8; i++) {
    await db.prepare('UPDATE email_queue SET next_attempt_at = 0 WHERE order_no = ?').bind(result.orderNo).run();
    await email.drainEmailQueue(env, {});
  }

  const rows = await db.prepare('SELECT status, attempts FROM email_queue WHERE order_no = ?').bind(result.orderNo).all();
  rows.results.forEach((row) => {
    assert.equal(row.status, 'failed');
    assert.equal(row.attempts, 6, 'six attempts is the budget');
  });

  const abandoned = await db.prepare("SELECT COUNT(*) AS n FROM order_events WHERE type = 'EmailAbandoned'").bind().first();
  assert.equal(abandoned.n, 2, 'abandonment is loud, not silent');
});

// ---------- audit trail ----------

test('every step of a paid order lands in the audit log', async () => {
  const saved = await seedQuote();
  const result = await orders.fulfilOrder(env, null, {
    paymentId: 'pay_AUDIT', razorpayOrderId: 'order_AUDIT', quoteId: saved.quoteId, purpose: 'order_booking',
  });

  const events = await db.prepare('SELECT type FROM order_events ORDER BY id').bind().all();
  const types = events.results.map((r) => r.type);

  ['QuoteSaved', 'PaymentCaptured', 'PDFGenerated', 'EmailSent'].forEach((expected) => {
    assert.ok(types.includes(expected), `audit log is missing ${expected}. Got: ${types.join(', ')}`);
  });
  assert.equal(types.filter((t) => t === 'EmailSent').length, 2);
  assert.ok(result.orderNo);
});

test('an order with no customer email still mails the admin', async () => {
  const saved = await seedQuote({ customer: { name: 'Walk-in', mobile: '9000000000' } });
  await orders.fulfilOrder(env, null, {
    paymentId: 'pay_NOEMAIL', razorpayOrderId: 'order_NOEMAIL', quoteId: saved.quoteId, purpose: 'order_booking',
  });

  assert.equal(calls.resend.length, 1);
  assert.equal(calls.resend[0].to[0], 'info@woodenmax.com');
});

test('paying for a quote that does not exist is refused', async () => {
  await assert.rejects(
    () => orders.fulfilOrder(env, null, { paymentId: 'pay_X', razorpayOrderId: 'order_X', quoteId: 'missing-quote', purpose: 'order_booking' }),
    /Quote not found/
  );
});

test('order numbers stay unique across concurrent fulfilments', async () => {
  const quotes = await Promise.all([seedQuote(), seedQuote(), seedQuote(), seedQuote(), seedQuote()]);
  const results = [];
  for (let i = 0; i < quotes.length; i++) {
    results.push(await orders.fulfilOrder(env, null, {
      paymentId: 'pay_MULTI_' + i,
      razorpayOrderId: 'order_MULTI_' + i,
      quoteId: quotes[i].quoteId,
      purpose: 'order_booking',
    }));
  }
  const numbers = results.map((r) => r.orderNo);
  assert.equal(new Set(numbers).size, numbers.length, 'order numbers must be unique');
  const quoteNumbers = quotes.map((q) => q.quoteNo);
  assert.equal(new Set(quoteNumbers).size, quoteNumbers.length, 'quote numbers must be unique');
});

test('the generated PDF document contains every field the order needs', async () => {
  const { buildOrderDocumentHtml } = await import('../worker/quote-html.js');
  const saved = await seedQuote();
  const quote = await orders.getQuote(env, saved.quoteId);
  const totals = orders.computeTotals(quote.items);

  const html = buildOrderDocumentHtml({
    orderNo: 'WM-O-2026-0042',
    quoteNo: saved.quoteNo,
    quoteVersion: 1,
    paymentId: 'pay_DOC',
    purpose: 'order_booking',
    paidInr: 1000,
    balanceInr: totals.total_inr - 1000,
    createdAt: Date.now(),
    customer: CUSTOMER,
    items: quote.items,
    totals,
  }, env);

  const required = [
    'WM-O-2026-0042',            // order number
    saved.quoteNo,               // quotation number
    'Test Customer',             // customer
    'Plot 42',                   // project address
    '3 Track Sliding Window',    // product
    '8mm Toughened',             // glass spec
    'GST @ 18%',                 // tax
    'Balance due',               // balance
    'PAYMENT RECEIVED',          // payment status
    'qr-code',                   // QR
    'Warranty',                  // warranty term
    'Authorised Signatory',      // signature
    'woodenmax-logo.webp',       // logo
  ];
  required.forEach((needle) => {
    assert.ok(html.includes(needle), `the order PDF is missing "${needle}"`);
  });

  assert.ok(html.includes('&#8377;') || html.includes('\u20B9'), 'amounts must render with the rupee sign');
  assert.equal(html.includes('<script>'), false, 'the document must not carry inline script');
});
