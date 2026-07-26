/**
 * Quote + order persistence and the single fulfilment pipeline.
 *
 * Everything that must happen after a successful payment happens in
 * `fulfilOrder`, and it is keyed on `payment_id`, so the browser callback and
 * the Razorpay webhook can both call it and exactly one of them does the work.
 * That is what makes a paid order survive the customer closing the tab.
 */
import { workerErr } from './http.js';
import { renderQuotePdf } from './pdf.js';
import { buildOrderDocumentHtml } from './quote-html.js';
import { queueOrderEmails, drainEmailQueue } from './email.js';

const GST_RATE = 0.18;
export const BOOKING_AMOUNT_INR = 1000;

function now () { return Date.now(); }

function uuid () { return crypto.randomUUID(); }

function db (env) {
  if (!env.DB) throw workerErr('D1 binding "DB" is missing. Add it in wrangler.toml and deploy.', 'CONFIG');
  return env.DB;
}

// ---------- running numbers ----------

/**
 * WM-Q-2026-0007 style numbers. The UPDATE...RETURNING is atomic in SQLite, so
 * two concurrent orders cannot be handed the same number.
 */
async function nextNumber (env, counterName, prefix) {
  const d = db(env);
  await d.prepare('INSERT OR IGNORE INTO counters (name, value) VALUES (?, 0)').bind(counterName).run();
  const row = await d
    .prepare('UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value')
    .bind(counterName)
    .first();
  const n = (row && row.value) || 1;
  const year = new Date().getUTCFullYear();
  return prefix + '-' + year + '-' + String(n).padStart(4, '0');
}

// ---------- pricing ----------

export function itemAmountInr (item) {
  if (!item) return 0;
  if (typeof item.exactAmount === 'number' && item.exactAmount > 0) return Math.round(item.exactAmount);
  if (item.amount) {
    const digits = String(item.amount).replace(/[^0-9]/g, '');
    return parseInt(digits, 10) || 0;
  }
  return 0;
}

export function computeTotals (items) {
  const subtotal = (items || []).reduce((sum, it) => sum + itemAmountInr(it), 0);
  const gst = Math.round(subtotal * GST_RATE);
  return { subtotal_inr: subtotal, gst_inr: gst, total_inr: subtotal + gst };
}

// ---------- audit log ----------

export async function logEvent (env, type, detail, ids) {
  try {
    await db(env)
      .prepare('INSERT INTO order_events (order_no, quote_id, type, detail_json, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind((ids && ids.orderNo) || null, (ids && ids.quoteId) || null, type, JSON.stringify(detail || {}), now())
      .run();
  } catch (e) {
    // The audit log must never be the reason a paid order fails.
    console.error('order_events insert failed', type, e && e.message);
  }
}

// ---------- quotes ----------

export async function saveQuote (env, payload) {
  const d = db(env);
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw workerErr('A quote needs at least one item', 'VALIDATION');

  const customer = payload.customer || {};
  const totals = computeTotals(items);
  const ts = now();
  const quoteId = String(payload.quoteId || '').trim() || uuid();

  const existing = await d.prepare('SELECT id, quote_no, version FROM quotes WHERE id = ?').bind(quoteId).first();

  let quoteNo;
  let version;
  if (existing) {
    quoteNo = existing.quote_no;
    version = (existing.version || 1) + 1;
    await d
      .prepare(
        'UPDATE quotes SET version = ?, customer_json = ?, items_json = ?, subtotal_inr = ?, gst_inr = ?, total_inr = ?, source_url = ?, updated_at = ? WHERE id = ?'
      )
      .bind(version, JSON.stringify(customer), JSON.stringify(items), totals.subtotal_inr, totals.gst_inr, totals.total_inr, payload.sourceUrl || null, ts, quoteId)
      .run();
  } else {
    quoteNo = await nextNumber(env, 'quote', 'WM-Q');
    version = 1;
    await d
      .prepare(
        'INSERT INTO quotes (id, quote_no, version, customer_json, items_json, subtotal_inr, gst_inr, total_inr, source_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(quoteId, quoteNo, version, JSON.stringify(customer), JSON.stringify(items), totals.subtotal_inr, totals.gst_inr, totals.total_inr, payload.sourceUrl || null, ts, ts)
      .run();
  }

  await d
    .prepare('INSERT OR REPLACE INTO quote_versions (quote_id, version, customer_json, items_json, total_inr, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(quoteId, version, JSON.stringify(customer), JSON.stringify(items), totals.total_inr, ts)
    .run();

  await logEvent(env, 'QuoteSaved', { version, items: items.length, total_inr: totals.total_inr }, { quoteId });

  return { quoteId, quoteNo, version, ...totals };
}

export async function getQuote (env, quoteId) {
  const row = await db(env).prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteId).first();
  if (!row) return null;
  return {
    id: row.id,
    quoteNo: row.quote_no,
    version: row.version,
    customer: safeParse(row.customer_json, {}),
    items: safeParse(row.items_json, []),
    subtotal_inr: row.subtotal_inr,
    gst_inr: row.gst_inr,
    total_inr: row.total_inr,
    sourceUrl: row.source_url,
  };
}

function safeParse (raw, fallback) {
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

/**
 * The amount to charge, derived from the stored quote — never from the browser.
 * A booking is a fixed server-side constant; a full payment is the quote's own
 * pre-GST subtotal, recomputed from the saved line items.
 */
export function resolveAmountPaise (quote, purpose) {
  if (purpose === 'order_booking') return BOOKING_AMOUNT_INR * 100;
  const recomputed = computeTotals(quote.items).subtotal_inr;
  if (recomputed < 1) throw workerErr('Quote total is too low to charge', 'VALIDATION');
  return recomputed * 100;
}

// ---------- orders ----------

export async function getOrderByNo (env, orderNo) {
  const row = await db(env).prepare('SELECT * FROM orders WHERE order_no = ?').bind(orderNo).first();
  return row || null;
}

export async function getOrderByPaymentId (env, paymentId) {
  const row = await db(env).prepare('SELECT * FROM orders WHERE payment_id = ?').bind(paymentId).first();
  return row || null;
}

export async function recordPendingOrder (env, { quoteId, quoteVersion, razorpayOrderId, amountPaise, purpose }) {
  const d = db(env);
  const ts = now();
  const id = uuid();
  const orderNo = await nextNumber(env, 'order', 'WM-O');
  await d
    .prepare(
      'INSERT INTO orders (id, order_no, quote_id, quote_version, razorpay_order_id, payment_mode, amount_paid_inr, order_total_inr, balance_due_inr, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)'
    )
    .bind(id, orderNo, quoteId, quoteVersion || 1, razorpayOrderId, purpose, 'created', ts, ts)
    .run();
  await logEvent(env, 'OrderCreated', { razorpayOrderId, amountPaise, purpose }, { orderNo, quoteId });
  return { id, orderNo };
}

/**
 * Idempotent post-payment pipeline.
 *
 * Claiming the payment_id is a single INSERT with a UNIQUE conflict, so if the
 * browser and the webhook arrive together only one caller proceeds and the
 * other gets the already-fulfilled order back.
 */
export async function fulfilOrder (env, ctx, { paymentId, razorpayOrderId, quoteId, purpose }) {
  const d = db(env);

  const existing = await getOrderByPaymentId(env, paymentId);
  if (existing && existing.status === 'fulfilled') {
    await logEvent(env, 'FulfilSkippedDuplicate', { paymentId }, { orderNo: existing.order_no, quoteId });
    return { orderNo: existing.order_no, duplicate: true, pdfStatus: existing.pdf_status };
  }

  const quote = await getQuote(env, quoteId);
  if (!quote) throw workerErr('Quote not found for this payment: ' + quoteId, 'VALIDATION');

  const totals = computeTotals(quote.items);
  const paidInr = purpose === 'order_booking' ? BOOKING_AMOUNT_INR : totals.subtotal_inr;
  const balance = Math.max(0, totals.total_inr - paidInr);
  const ts = now();

  // Attach the payment to the order row that create-order made, or create one.
  let orderNo;
  const pending = await d
    .prepare('SELECT order_no FROM orders WHERE razorpay_order_id = ? AND payment_id IS NULL')
    .bind(razorpayOrderId || '')
    .first();

  if (pending) {
    orderNo = pending.order_no;
    const res = await d
      .prepare(
        'UPDATE orders SET payment_id = ?, payment_mode = ?, amount_paid_inr = ?, order_total_inr = ?, balance_due_inr = ?, status = ?, customer_json = ?, items_json = ?, quote_version = ?, updated_at = ? WHERE order_no = ? AND payment_id IS NULL'
      )
      .bind(paymentId, purpose, paidInr, totals.total_inr, balance, 'paid', JSON.stringify(quote.customer), JSON.stringify(quote.items), quote.version, ts, orderNo)
      .run();
    if (!res.meta || res.meta.changes === 0) {
      const winner = await getOrderByPaymentId(env, paymentId);
      return { orderNo: winner ? winner.order_no : orderNo, duplicate: true, pdfStatus: winner && winner.pdf_status };
    }
  } else {
    orderNo = await nextNumber(env, 'order', 'WM-O');
    try {
      await d
        .prepare(
          'INSERT INTO orders (id, order_no, quote_id, quote_version, razorpay_order_id, payment_id, payment_mode, amount_paid_inr, order_total_inr, balance_due_inr, status, customer_json, items_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(uuid(), orderNo, quoteId, quote.version, razorpayOrderId || null, paymentId, purpose, paidInr, totals.total_inr, balance, 'paid', JSON.stringify(quote.customer), JSON.stringify(quote.items), ts, ts)
        .run();
    } catch (e) {
      const winner = await getOrderByPaymentId(env, paymentId);
      if (winner) return { orderNo: winner.order_no, duplicate: true, pdfStatus: winner.pdf_status };
      throw e;
    }
  }

  await logEvent(env, 'PaymentCaptured', { paymentId, razorpayOrderId, paidInr, purpose }, { orderNo, quoteId });

  const order = {
    orderNo,
    quoteNo: quote.quoteNo,
    quoteVersion: quote.version,
    paymentId,
    razorpayOrderId,
    purpose,
    paidInr,
    balanceInr: balance,
    createdAt: ts,
    customer: quote.customer,
    items: quote.items,
    totals,
  };

  // A PDF failure must not lose the order — it is logged, the row stays 'paid'
  // with pdf_status 'failed', and the emails still go out.
  let pdfStatus = 'failed';
  try {
    const html = buildOrderDocumentHtml(order, env);
    const pdf = await renderQuotePdf(env, html);
    await d
      .prepare('UPDATE orders SET pdf_blob = ?, pdf_bytes = ?, pdf_status = ?, updated_at = ? WHERE order_no = ?')
      .bind(pdf, pdf.length, 'ready', now(), orderNo)
      .run();
    pdfStatus = 'ready';
    await logEvent(env, 'PDFGenerated', { bytes: pdf.length }, { orderNo, quoteId });
  } catch (e) {
    await d
      .prepare('UPDATE orders SET pdf_status = ?, updated_at = ? WHERE order_no = ?')
      .bind('failed', now(), orderNo)
      .run();
    await logEvent(env, 'PDFFailed', { error: String((e && e.message) || e) }, { orderNo, quoteId });
  }

  await queueOrderEmails(env, order, pdfStatus === 'ready');

  await d
    .prepare('UPDATE orders SET status = ?, updated_at = ? WHERE order_no = ?')
    .bind('fulfilled', now(), orderNo)
    .run();

  // Deliver now; anything that fails stays queued for the cron retry.
  const deliver = drainEmailQueue(env, { orderNo });
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(deliver);
  else await deliver;

  return { orderNo, quoteNo: quote.quoteNo, duplicate: false, pdfStatus, paidInr, balanceInr: balance };
}

export async function getOrderPdf (env, orderNo) {
  const row = await db(env)
    .prepare('SELECT pdf_blob, pdf_status FROM orders WHERE order_no = ?')
    .bind(orderNo)
    .first();
  if (!row) return null;
  return { blob: row.pdf_blob, status: row.pdf_status };
}

/** Rebuild a PDF for an order whose first render failed. */
export async function regenerateOrderPdf (env, orderNo) {
  const d = db(env);
  const row = await getOrderByNo(env, orderNo);
  if (!row) throw workerErr('Order not found: ' + orderNo, 'VALIDATION');
  const quote = await getQuote(env, row.quote_id);
  const items = safeParse(row.items_json, (quote && quote.items) || []);
  const customer = safeParse(row.customer_json, (quote && quote.customer) || {});
  const totals = computeTotals(items);

  const html = buildOrderDocumentHtml({
    orderNo: row.order_no,
    quoteNo: quote ? quote.quoteNo : null,
    quoteVersion: row.quote_version,
    paymentId: row.payment_id,
    razorpayOrderId: row.razorpay_order_id,
    purpose: row.payment_mode,
    paidInr: row.amount_paid_inr,
    balanceInr: row.balance_due_inr,
    createdAt: row.created_at,
    customer,
    items,
    totals,
  }, env);

  const pdf = await renderQuotePdf(env, html);
  await d
    .prepare('UPDATE orders SET pdf_blob = ?, pdf_bytes = ?, pdf_status = ?, updated_at = ? WHERE order_no = ?')
    .bind(pdf, pdf.length, 'ready', now(), orderNo)
    .run();
  await logEvent(env, 'PDFRegenerated', { bytes: pdf.length }, { orderNo, quoteId: row.quote_id });
  return pdf;
}
