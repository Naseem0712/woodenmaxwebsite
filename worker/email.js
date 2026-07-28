/**
 * Transactional email via Resend, with a D1-backed queue.
 *
 * Mail is queued first and sent second. If Resend is down, the row stays
 * pending and the cron trigger retries with exponential backoff, so a paid
 * order can no longer end with nobody being told about it.
 *
 * `from` must be an address on a domain verified in Resend
 * (Dashboard → Domains). Prefer woodenmax.in (orders@…). info@woodenmax.com
 * only works after woodenmax.com is verified — otherwise Resend 403s and
 * customer Gmail never arrives.
 */
import { bytesToBase64, fmtInr, workerErr } from './http.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 6;
const BACKOFF_MS = [0, 60000, 300000, 900000, 3600000, 21600000];
const SANDBOX_FROM = 'WoodenMax <onboarding@resend.dev>';
const DOMAIN_FROM_FALLBACKS = [
  'WoodenMax <orders@woodenmax.in>',
  'WoodenMax <noreply@woodenmax.in>',
];

function now () { return Date.now(); }

function cfg (env) {
  return {
    apiKey: String(env.RESEND_API_KEY || '').trim(),
    // Prefer a verified woodenmax.in mailbox. Override via ORDER_FROM_EMAIL
    // only when that exact address/domain is verified in Resend.
    from: String(env.ORDER_FROM_EMAIL || 'WoodenMax <orders@woodenmax.in>').trim(),
    admin: String(env.ADMIN_EMAIL || 'info@woodenmax.com').trim(),
    replyTo: String(env.REPLY_TO_EMAIL || 'info@woodenmax.com').trim(),
  };
}

async function readResendError (res) {
  const bits = [
    'HTTP ' + res.status + (res.statusText ? ' ' + res.statusText : ''),
  ];
  const raw = await res.text().catch(() => '');
  if (raw) {
    try {
      const j = JSON.parse(raw);
      bits.push((j && (j.message || j.error || JSON.stringify(j))) || raw.slice(0, 400));
    } catch (e) {
      bits.push(raw.slice(0, 400));
    }
  } else {
    bits.push('empty body');
  }
  try {
    const ct = res.headers && res.headers.get('content-type');
    if (ct) bits.push('ct=' + ct);
  } catch (e) { /* ignore */ }
  return bits.join(' | ');
}

async function postResend (apiKey, payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw workerErr('Resend ' + (await readResendError(res)) + ' (from=' + payload.from + ', to=' + (payload.to && payload.to[0]) + ')', 'EMAIL');
  }
  return true;
}

function isResendDomainBlock (msg) {
  return /HTTP 403|HTTP 422|only send testing emails|verify a domain|domain is not verified|not verified/i.test(String(msg || ''));
}

function customerRedirectText (originalTo, body) {
  return [
    'ORIGINAL TO: ' + originalTo,
    '',
    'Resend blocked delivery to the customer because the sending domain is not verified',
    '(or the account is still in testing mode).',
    '',
    'Fix (required for Gmail / any customer inbox):',
    '  1. Open https://resend.com/domains',
    '  2. Add and verify woodenmax.in (recommended) OR woodenmax.com',
    '  3. Add the DNS records Resend shows (SPF / DKIM)',
    '  4. Set Worker var ORDER_FROM_EMAIL to an address on that domain',
    '     e.g. WoodenMax <orders@woodenmax.in>',
    '  5. Redeploy / wait for cron — pending email_queue rows will retry',
    '',
    '——— customer copy below ———',
    '',
    body,
  ].join('\n');
}

// ---------- message bodies ----------

function itemLines (items) {
  return (items || [])
    .map((it, i) => {
      const amount = typeof it.exactAmount === 'number'
        ? it.exactAmount
        : parseInt(String(it.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
      const specs = (it.details || [])
        .filter((d) => d && d.label && !/^(product|category)$/i.test(String(d.label)))
        .map((d) => '      ' + d.label + ': ' + d.value)
        .join('\n');
      return [
        '  ' + (i + 1) + '. ' + (it.productName || 'Configuration') + (it.category ? '  [' + it.category + ']' : ''),
        it.area ? '      Size / area: ' + it.area : '',
        specs,
        '      Amount: ' + fmtInr(amount),
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

function adminBody (order) {
  const c = order.customer || {};
  const t = order.totals || {};
  return [
    'PAID ORDER — ' + order.orderNo,
    '',
    'Quotation : ' + (order.quoteNo || '—') + (order.quoteVersion ? ' v' + order.quoteVersion : ''),
    'Payment ID: ' + (order.paymentId || '—'),
    'Razorpay  : ' + (order.razorpayOrderId || '—'),
    'Type      : ' + (order.purpose === 'order_booking' ? 'Site visit booking advance' : 'Order payment'),
    '',
    'CUSTOMER',
    '  Name   : ' + (c.name || '—'),
    '  Mobile : ' + (c.mobile || '—'),
    '  Email  : ' + (c.email || '—'),
    '  City   : ' + [c.city, c.state, c.pincode].filter(Boolean).join(', ') || '—',
    '  Address: ' + (c.address || '—'),
    '',
    'ITEMS (' + (order.items || []).length + ')',
    itemLines(order.items),
    '',
    'TOTALS',
    '  Subtotal   : ' + fmtInr(t.subtotal_inr),
    '  GST 18%    : ' + fmtInr(t.gst_inr),
    '  Grand total: ' + fmtInr(t.total_inr),
    '  Paid now   : ' + fmtInr(order.paidInr),
    '  Balance    : ' + fmtInr(order.balanceInr),
    '',
    'The order confirmation PDF is attached.',
  ].join('\n');
}

function customerBody (order) {
  const c = order.customer || {};
  const t = order.totals || {};
  const isBooking = order.purpose === 'order_booking';
  return [
    'Dear ' + (c.name || 'Customer') + ',',
    '',
    'Thank you — we have received your payment of ' + fmtInr(order.paidInr) + '.',
    '',
    'Order number    : ' + order.orderNo,
    'Quotation number: ' + (order.quoteNo || '—'),
    'Payment ID      : ' + (order.paymentId || '—'),
    '',
    'YOUR CONFIGURATIONS',
    itemLines(order.items),
    '',
    'Subtotal        : ' + fmtInr(t.subtotal_inr),
    'GST @ 18%       : ' + fmtInr(t.gst_inr),
    'Grand total     : ' + fmtInr(t.total_inr),
    'Paid            : ' + fmtInr(order.paidInr),
    'Balance due     : ' + fmtInr(order.balanceInr),
    '',
    isBooking
      ? 'Your site visit slot is held. Our technical team will contact you within one working day to confirm the visit. This advance is adjusted against your final order value.'
      : 'Our production team will contact you within one working day to confirm final measurements.',
    '',
    'The complete order confirmation, with all specifications and terms, is attached as a PDF.',
    '',
    'WoodenMax Architectural Elements',
    '5-6-411/413, Aaghapura, Nampally, Hyderabad 500001',
    '+91 78953 28080 · info@woodenmax.com · www.woodenmax.in',
  ].join('\n');
}

// ---------- queue ----------

export async function queueOrderEmails (env, order, pdfReady) {
  const c = cfg(env);
  const customerEmail = (order.customer && order.customer.email || '').trim();
  const ts = now();
  const rows = [];

  rows.push({
    kind: 'admin',
    to: c.admin,
    subject: 'PAID ' + order.orderNo + ' — ' + fmtInr(order.paidInr) + ' — ' + ((order.customer && order.customer.name) || 'Customer'),
    body: adminBody(order) + (pdfReady ? '' : '\n\n[PDF generation failed for this order — regenerate it from /api/order/' + order.orderNo + '/pdf?regenerate=1]'),
  });

  if (customerEmail && /.+@.+\..+/.test(customerEmail)) {
    rows.push({
      kind: 'customer',
      to: customerEmail,
      subject: 'WoodenMax order ' + order.orderNo + ' — payment received',
      body: customerBody(order) + (pdfReady ? '' : '\n\n(Your PDF is being prepared and will follow shortly.)'),
    });
  }

  for (const row of rows) {
    await env.DB.prepare(
      'INSERT INTO email_queue (order_no, kind, to_email, subject, body_text, attach_pdf, status, attempts, next_attempt_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)'
    )
      .bind(order.orderNo, row.kind, row.to, row.subject, row.body, pdfReady ? 1 : 0, 'pending', ts, ts, ts)
      .run();
  }

  return rows.length;
}

/**
 * Send everything that is due. Called right after fulfilment and again from the
 * cron trigger, so a transient provider failure resolves itself.
 */
export async function drainEmailQueue (env, opts = {}) {
  const limit = opts.limit || 20;
  const params = [now(), limit];
  let sql = 'SELECT * FROM email_queue WHERE status = \'pending\' AND next_attempt_at <= ?';
  if (opts.orderNo) {
    sql += ' AND order_no = ?';
    params.splice(1, 0, opts.orderNo);
  }
  sql += ' ORDER BY id LIMIT ?';

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  let sent = 0;
  let failed = 0;

  for (const row of results || []) {
    try {
      await sendQueuedEmail(env, row);
      await env.DB.prepare('UPDATE email_queue SET status = ?, attempts = attempts + 1, updated_at = ? WHERE id = ?')
        .bind('sent', now(), row.id)
        .run();
      await logEmailEvent(env, row.order_no, 'EmailSent', { kind: row.kind, to: row.to_email, attempts: row.attempts + 1 });
      sent++;
    } catch (e) {
      const attempts = (row.attempts || 0) + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      const delay = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
      await env.DB.prepare(
        'UPDATE email_queue SET status = ?, attempts = ?, last_error = ?, next_attempt_at = ?, updated_at = ? WHERE id = ?'
      )
        .bind(exhausted ? 'failed' : 'pending', attempts, String((e && e.message) || e).slice(0, 500), now() + delay, now(), row.id)
        .run();
      await logEmailEvent(env, row.order_no, exhausted ? 'EmailAbandoned' : 'EmailRetryScheduled', {
        kind: row.kind, to: row.to_email, attempts, error: String((e && e.message) || e).slice(0, 300),
        retryInMs: exhausted ? null : delay,
      });
      failed++;
    }
  }

  return { sent, failed, considered: (results || []).length };
}

async function logEmailEvent (env, orderNo, type, detail) {
  try {
    await env.DB.prepare('INSERT INTO order_events (order_no, type, detail_json, created_at) VALUES (?, ?, ?, ?)')
      .bind(orderNo || null, type, JSON.stringify(detail || {}), now())
      .run();
  } catch (e) {
    console.error('email event log failed', e && e.message);
  }
}

function clonePayload (payload) {
  const next = {
    from: payload.from,
    to: payload.to.slice(),
    subject: payload.subject,
    text: payload.text,
  };
  if (payload.reply_to) next.reply_to = payload.reply_to;
  if (payload.attachments) next.attachments = payload.attachments;
  return next;
}

/**
 * When the primary FROM domain is unverified / Resend is in testing mode:
 *  1. Try woodenmax.in FROM addresses to the original recipient
 *  2. Try Resend sandbox FROM to the original recipient (works if they are the
 *     Resend account owner — common during live testing)
 *  3. Forward the customer copy to ADMIN via sandbox so the paid lead is never lost
 */
function buildDomainFallbackCandidates (payloadFrom, kind) {
  const candidates = [];
  for (const from of DOMAIN_FROM_FALLBACKS) {
    if (from !== payloadFrom) candidates.push({ from, mode: 'keep' });
  }
  // Sandbox → original recipient first (testing-mode owner can receive).
  candidates.push({ from: SANDBOX_FROM, mode: 'keep' });
  if (kind === 'customer') {
    candidates.push({ from: SANDBOX_FROM, mode: 'admin_forward' });
  } else {
    candidates.push({ from: SANDBOX_FROM, mode: 'admin' });
  }
  return candidates;
}

async function sendQueuedEmail (env, row) {
  const c = cfg(env);
  if (!c.apiKey) throw workerErr('RESEND_API_KEY is not configured', 'CONFIG');
  if (!/^re_/i.test(c.apiKey)) {
    throw workerErr('RESEND_API_KEY does not look like a Resend key (should start with re_)', 'CONFIG');
  }

  const payload = {
    from: c.from,
    to: [row.to_email],
    reply_to: c.replyTo,
    subject: row.subject,
    text: row.body_text,
  };

  if (row.attach_pdf) {
    const pdf = await env.DB.prepare('SELECT pdf_blob, pdf_status FROM orders WHERE order_no = ?')
      .bind(row.order_no)
      .first();
    if (pdf && pdf.pdf_status === 'ready' && pdf.pdf_blob) {
      const bytes = pdf.pdf_blob instanceof Uint8Array ? pdf.pdf_blob : new Uint8Array(pdf.pdf_blob);
      payload.attachments = [{
        filename: 'WoodenMax-' + row.order_no + '.pdf',
        content: bytesToBase64(bytes),
      }];
    }
  }

  try {
    await postResend(c.apiKey, payload);
    return true;
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (!isResendDomainBlock(msg)) throw e;

    const candidates = buildDomainFallbackCandidates(payload.from, row.kind);
    let lastErr = e;
    for (const cand of candidates) {
      const alt = clonePayload(payload);
      alt.from = cand.from;
      if (/onboarding@resend\.dev/i.test(cand.from)) delete alt.reply_to;

      if (cand.mode === 'admin_forward') {
        alt.to = [c.admin];
        alt.subject = '[Customer copy — verify Resend domain] ' + row.subject + ' → ' + row.to_email;
        alt.text = customerRedirectText(row.to_email, row.body_text);
      } else if (cand.mode === 'admin') {
        alt.to = [c.admin];
      }
      // mode === 'keep' → leave original recipient

      try {
        await postResend(c.apiKey, alt);
        if (row.kind === 'customer' && alt.to[0] !== row.to_email) {
          await logEmailEvent(env, row.order_no, 'EmailCustomerRedirectedToAdmin', {
            originalTo: row.to_email,
            deliveredTo: alt.to[0],
            from: alt.from,
          });
        } else if (alt.from !== payload.from) {
          await logEmailEvent(env, row.order_no, 'EmailSentViaFallbackFrom', {
            kind: row.kind,
            to: alt.to[0],
            from: alt.from,
            primaryFrom: payload.from,
          });
        }
        return true;
      } catch (e2) {
        lastErr = e2;
      }
    }
    throw lastErr;
  }
}

/** Non-order mail (enquiry forms) — same sender identity, no queue. */
export async function sendPlainEmail (env, { to, subject, text, replyTo }) {
  const c = cfg(env);
  if (!c.apiKey) throw workerErr('RESEND_API_KEY is not configured', 'CONFIG');
  if (!/^re_/i.test(c.apiKey)) {
    throw workerErr('RESEND_API_KEY does not look like a Resend key (should start with re_)', 'CONFIG');
  }
  const recipient = String(to || c.admin || '').trim();
  if (!recipient || !/.+@.+\..+/.test(recipient)) {
    throw workerErr('No valid recipient for outbound email', 'CONFIG');
  }
  const payload = {
    from: c.from,
    to: [recipient],
    reply_to: replyTo || c.replyTo,
    subject: subject || 'WoodenMax notification',
    text: text || '(empty)',
  };
  try {
    await postResend(c.apiKey, payload);
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (!isResendDomainBlock(msg)) throw e;

    const tryFrom = [payload.from, ...DOMAIN_FROM_FALLBACKS, SANDBOX_FROM]
      .filter((v, i, a) => a.indexOf(v) === i);
    let lastErr = e;
    for (const from of tryFrom) {
      if (from === payload.from && from !== SANDBOX_FROM) continue;
      const alt = clonePayload(payload);
      alt.from = from;
      if (/onboarding@resend\.dev/i.test(from)) {
        delete alt.reply_to;
      }
      try {
        await postResend(c.apiKey, alt);
        return true;
      } catch (e2) {
        lastErr = e2;
      }
    }
    // Last resort: sandbox → admin
    try {
      const alt = clonePayload(payload);
      alt.from = SANDBOX_FROM;
      delete alt.reply_to;
      alt.to = [c.admin];
      alt.subject = '[Forwarded — verify Resend domain] ' + (payload.subject || '');
      alt.text = customerRedirectText(recipient, payload.text);
      await postResend(c.apiKey, alt);
      return true;
    } catch (e3) {
      throw lastErr;
    }
  }
  return true;
}

/** Fire-and-forget admin alert — never throws to the payment path. */
export async function alertAdmin (env, subject, text) {
  try {
    await sendPlainEmail(env, { subject, text });
  } catch (e) {
    console.error('alertAdmin failed', e && e.message);
    return false;
  }
  return true;
}
