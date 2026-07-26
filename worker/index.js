/**
 * WoodenMax Worker — quotes, payments, order fulfilment, PDFs and email.
 *
 * Deploy with `npx wrangler deploy` (not by pasting into the dashboard) — the
 * D1 binding, cron trigger and module imports all come from wrangler.toml.
 *
 * Routes
 *   POST /api/quote                 save/version a quote, returns quote_id
 *   POST /api/create-order          Razorpay order; amount recomputed from D1
 *   POST /api/verify-payment        browser callback -> fulfilOrder
 *   POST /api/razorpay-webhook      Razorpay callback -> fulfilOrder
 *   GET  /api/order/:orderNo        order status
 *   GET  /api/order/:orderNo/pdf    the order confirmation PDF
 *   POST /                          enquiry form (multipart) -> email
 *   GET  /health                    configuration probe
 */
import { corsHeaders, jsonResponse, errCode } from './http.js';
import {
  getRazorpayCredentials,
  razorpayMode,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyWebhookSignature,
} from './razorpay.js';
import {
  saveQuote,
  getQuote,
  resolveAmountPaise,
  recordPendingOrder,
  fulfilOrder,
  getOrderByNo,
  getOrderPdf,
  regenerateOrderPdf,
  logEvent,
  BOOKING_AMOUNT_INR,
} from './orders.js';
import { drainEmailQueue, sendPlainEmail } from './email.js';

function normalizeApiPath (pathname) {
  return String(pathname || '/').replace(/\/+$/, '') || '/';
}

function isJsonRequest (request) {
  return (request.headers.get('Content-Type') || '').toLowerCase().includes('application/json');
}

function htmlToPlainText (html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- quotes ----------

async function handleSaveQuote (request, env) {
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400, request);
  }
  const saved = await saveQuote(env, {
    quoteId: body.quote_id || body.quoteId,
    items: body.items,
    customer: body.customer,
    sourceUrl: body.source_url || body.sourceUrl,
  });
  return jsonResponse({
    success: true,
    quote_id: saved.quoteId,
    quote_no: saved.quoteNo,
    version: saved.version,
    subtotal_inr: saved.subtotal_inr,
    gst_inr: saved.gst_inr,
    total_inr: saved.total_inr,
  }, 200, request);
}

/**
 * Read a quote back. This is the cross-domain handoff: woodenmax.in and
 * window.woodenmax.in cannot share localStorage (different origins), so a
 * `?quote_id=` link plus this endpoint is how a cart moves between them.
 */
async function handleGetQuote (request, env, quoteId) {
  const quote = await getQuote(env, quoteId);
  if (!quote) return jsonResponse({ success: false, error: 'Quote not found' }, 404, request);
  return jsonResponse({
    success: true,
    quote_id: quote.id,
    quote_no: quote.quoteNo,
    version: quote.version,
    customer: quote.customer,
    items: quote.items,
    subtotal_inr: quote.subtotal_inr,
    gst_inr: quote.gst_inr,
    total_inr: quote.total_inr,
  }, 200, request);
}

// ---------- payments ----------

async function handleCreateOrder (request, env) {
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400, request);
  }

  const purpose = body.purpose || 'order_full_pay';
  const quoteId = String(body.quote_id || body.quoteId || '').trim();

  let amountPaise;
  let quote = null;

  if (quoteId) {
    quote = await getQuote(env, quoteId);
    if (!quote) return jsonResponse({ success: false, error: 'Quote not found. Please rebuild your estimate.' }, 400, request);
    amountPaise = resolveAmountPaise(quote, purpose);
  } else if (purpose === 'order_booking') {
    // The booking fee is a server-side constant, so it is safe without a quote.
    amountPaise = BOOKING_AMOUNT_INR * 100;
  } else {
    // Refusing the client-supplied amount is the price-tampering fix: a full
    // payment must be backed by a quote this server stored and priced itself.
    return jsonResponse({
      success: false,
      error: 'This checkout needs a saved quote. Please refresh the page and try again.',
      code: 'QUOTE_REQUIRED',
    }, 400, request);
  }

  const creds = getRazorpayCredentials(env);
  const order = await createRazorpayOrder(creds, {
    amount: amountPaise,
    currency: body.currency || 'INR',
    receipt: body.receipt,
    notes: { ...(body.notes || {}), quote_id: quoteId || '', purpose },
  });

  if (quoteId) {
    await recordPendingOrder(env, {
      quoteId,
      quoteVersion: quote.version,
      razorpayOrderId: order.order_id,
      amountPaise,
      purpose,
    });
  }

  return jsonResponse({
    success: true,
    razorpay_mode: razorpayMode(creds.keyId),
    quote_id: quoteId || null,
    ...order,
  }, 200, request);
}

async function handleVerifyPayment (request, env, ctx) {
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400, request);
  }

  const creds = getRazorpayCredentials(env);
  const result = await verifyRazorpayPayment(creds.keySecret, body);

  const quoteId = String(body.quote_id || body.quoteId || '').trim();
  if (!quoteId) {
    // Signature is valid but we have no quote to build a document from. Record
    // it so a paid customer is never invisible, and let the webhook retry.
    await logEvent(env, 'PaymentWithoutQuote', { paymentId: result.payment_id, orderId: result.order_id }, {});
    return jsonResponse({ success: true, verified: true, ...result, order_no: null, pdf_status: 'unavailable' }, 200, request);
  }

  const fulfilled = await fulfilOrder(env, ctx, {
    paymentId: result.payment_id,
    razorpayOrderId: result.order_id,
    quoteId,
    purpose: body.purpose || 'order_full_pay',
  });

  return jsonResponse({
    success: true,
    verified: true,
    payment_id: result.payment_id,
    order_id: result.order_id,
    order_no: fulfilled.orderNo,
    quote_no: fulfilled.quoteNo,
    pdf_status: fulfilled.pdfStatus,
    pdf_url: '/api/order/' + fulfilled.orderNo + '/pdf',
    duplicate: fulfilled.duplicate,
  }, 200, request);
}

/**
 * Razorpay's own callback. This is the safety net: if the customer closes the
 * tab right after paying, this still creates the order, PDF and emails.
 */
async function handleWebhook (request, env, ctx) {
  const raw = await request.text();
  await verifyWebhookSignature(env, raw, request.headers.get('X-Razorpay-Signature'));

  let payload;
  try { payload = JSON.parse(raw); } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid webhook JSON' }, 400, request);
  }

  const event = payload.event || '';
  if (event !== 'payment.captured' && event !== 'order.paid') {
    return jsonResponse({ success: true, ignored: event }, 200, request);
  }

  const payment = (payload.payload && payload.payload.payment && payload.payload.payment.entity) || {};
  const quoteId = (payment.notes && (payment.notes.quote_id || payment.notes.quoteId)) || '';
  const purpose = (payment.notes && payment.notes.purpose) || 'order_full_pay';

  if (!quoteId) {
    await logEvent(env, 'WebhookWithoutQuote', { event, paymentId: payment.id }, {});
    return jsonResponse({ success: true, skipped: 'no quote_id in notes' }, 200, request);
  }

  const fulfilled = await fulfilOrder(env, ctx, {
    paymentId: payment.id,
    razorpayOrderId: payment.order_id,
    quoteId,
    purpose,
  });

  return jsonResponse({ success: true, order_no: fulfilled.orderNo, duplicate: fulfilled.duplicate }, 200, request);
}

// ---------- order lookup ----------

async function handleOrderPdf (request, env, orderNo) {
  const url = new URL(request.url);
  let record = await getOrderPdf(env, orderNo);
  if (!record) return jsonResponse({ success: false, error: 'Order not found' }, 404, request);

  if ((!record.blob || record.status !== 'ready') && url.searchParams.get('regenerate') === '1') {
    const bytes = await regenerateOrderPdf(env, orderNo);
    record = { blob: bytes, status: 'ready' };
  }

  if (!record.blob || record.status !== 'ready') {
    return jsonResponse({
      success: false,
      error: 'PDF is still being prepared',
      pdf_status: record.status,
      retry: '/api/order/' + orderNo + '/pdf?regenerate=1',
    }, 409, request);
  }

  const bytes = record.blob instanceof Uint8Array ? record.blob : new Uint8Array(record.blob);
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="WoodenMax-' + orderNo + '.pdf"',
      'Cache-Control': 'private, max-age=300',
      ...corsHeaders(request),
    },
  });
}

async function handleOrderStatus (request, env, orderNo) {
  const row = await getOrderByNo(env, orderNo);
  if (!row) return jsonResponse({ success: false, error: 'Order not found' }, 404, request);
  return jsonResponse({
    success: true,
    order_no: row.order_no,
    status: row.status,
    payment_id: row.payment_id,
    payment_status: row.payment_id ? 'paid' : 'pending',
    amount_paid_inr: row.amount_paid_inr,
    order_total_inr: row.order_total_inr,
    balance_due_inr: row.balance_due_inr,
    pdf_status: row.pdf_status,
    pdf_url: row.pdf_status === 'ready' ? '/api/order/' + row.order_no + '/pdf' : null,
    created_at: row.created_at,
  }, 200, request);
}

// ---------- enquiry email ----------

async function handleEnquiryForm (request, env) {
  const formData = await request.formData();
  const get = (...keys) => {
    for (const k of keys) {
      const v = formData.get(k);
      if (v) return String(v);
    }
    return '';
  };

  const subject = get('_subject', 'subject') || 'New Quote Request';
  const name = get('Name', 'name');
  const city = get('City', 'city');
  const mobile = get('Mobile', 'mobile');
  const email = get('Email', 'email');
  const ccEmail = get('CC', 'cc_email').trim();

  let bodyText = htmlToPlainText(get('message', 'body'));
  if (!bodyText) {
    bodyText = [
      name ? 'Name: ' + name : '',
      city ? 'City: ' + city : '',
      mobile ? 'Mobile: ' + mobile : '',
      email ? 'Email: ' + email : '',
    ].filter(Boolean).join('\n');
  }
  if (!bodyText) return jsonResponse({ success: false, error: 'Empty enquiry' }, 400, request);

  await sendPlainEmail(env, {
    to: env.ADMIN_EMAIL || 'info@woodenmax.com',
    subject,
    text: bodyText,
    replyTo: email || undefined,
  });

  // The customer copy is a separate send so a bad customer address can never
  // stop the admin notification.
  if (ccEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
    try {
      await sendPlainEmail(env, { to: ccEmail, subject: 'Your WoodenMax enquiry', text: bodyText });
    } catch (e) {
      console.error('customer copy failed', e && e.message);
    }
  }

  return jsonResponse({ success: true, message: 'Email sent successfully' }, 200, request);
}

// ---------- health ----------

function handleHealth (request, env) {
  const keyId = String(env.RAZORPAY_KEY_ID || '').trim();
  const mode = razorpayMode(keyId);
  const checks = {
    razorpay: Boolean(keyId && env.RAZORPAY_KEY_SECRET),
    razorpay_webhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
    database: Boolean(env.DB),
    pdf: Boolean(env.CF_ACCOUNT_ID && env.CF_BROWSER_TOKEN),
    email: Boolean(env.RESEND_API_KEY),
  };
  const missing = Object.keys(checks).filter((k) => !checks[k]);
  return jsonResponse({
    ok: missing.length === 0,
    razorpay_mode: mode,
    checks,
    missing,
    fix: missing.length
      ? 'Set these as Worker secrets, then `npx wrangler deploy`: ' + missing.map((m) => ({
        razorpay: 'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET',
        razorpay_webhook: 'RAZORPAY_WEBHOOK_SECRET',
        database: 'D1 binding DB in wrangler.toml',
        pdf: 'CF_ACCOUNT_ID + CF_BROWSER_TOKEN',
        email: 'RESEND_API_KEY',
      }[m])).join('; ')
      : null,
  }, 200, request);
}

// ---------- entry ----------

export default {
  async fetch (request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = normalizeApiPath(url.pathname);

    try {
      if (request.method === 'POST') {
        if (path === '/api/quote') return await handleSaveQuote(request, env);
        if (path === '/api/create-order') return await handleCreateOrder(request, env);
        if (path === '/api/verify-payment') return await handleVerifyPayment(request, env, ctx);
        if (path === '/api/razorpay-webhook') return await handleWebhook(request, env, ctx);
        if (isJsonRequest(request)) {
          return jsonResponse({ success: false, error: 'Unknown JSON endpoint: ' + path }, 404, request);
        }
        return await handleEnquiryForm(request, env);
      }

      if (request.method === 'GET') {
        if (path === '/health') return handleHealth(request, env);
        const pdfMatch = path.match(/^\/api\/order\/([A-Za-z0-9-]+)\/pdf$/);
        if (pdfMatch) return await handleOrderPdf(request, env, pdfMatch[1]);
        const orderMatch = path.match(/^\/api\/order\/([A-Za-z0-9-]+)$/);
        if (orderMatch) return await handleOrderStatus(request, env, orderMatch[1]);
        const quoteMatch = path.match(/^\/api\/quote\/([A-Za-z0-9-]+)$/);
        if (quoteMatch) return await handleGetQuote(request, env, quoteMatch[1]);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders(request) });
    } catch (err) {
      const code = errCode(err);
      const message = (err && err.message) || 'Request failed';
      const status = code === 'VALIDATION' ? 400
        : code === 'SIGNATURE' ? 400
          : code === 'AUTH' ? 401
            : code === 'CONFIG' ? 500
              : 500;
      if (status >= 500) console.error(path, code || '', message);
      return jsonResponse({ success: false, error: message, code: code || null }, status, request);
    }
  },

  /** Cron: retry anything the queue still owes. */
  async scheduled (event, env, ctx) {
    ctx.waitUntil(
      drainEmailQueue(env, { limit: 50 }).catch((e) => console.error('email drain failed', e && e.message))
    );
  },
};
