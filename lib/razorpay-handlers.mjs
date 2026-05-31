/**
 * Shared Razorpay order + signature verification (Cloudflare Worker & Node).
 */

export const BOOKING_AMOUNT_PAISE = 100000; // ₹1,000 order confirmation (windows / mixed cart)
export const MIRROR_MAX_PAISE = 50000000; // ₹5,00,000 safety cap per checkout

export function corsHeaders () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function jsonResponse (body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function timingSafeEqual (a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var out = 0;
  for (var i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function hmacSha256Hex (secret, message) {
  var enc = new TextEncoder();
  var key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  var sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(function (b) { return b.toString(16).padStart(2, '0'); })
    .join('');
}

export async function createRazorpayOrder (credentials, params) {
  var keyId = credentials.keyId;
  var keySecret = credentials.keySecret;
  if (!keyId || !keySecret) {
    var err = new Error('Razorpay credentials not configured');
    err.code = 'CONFIG';
    throw err;
  }

  var amount = Math.round(Number(params.amount));
  var currency = params.currency || 'INR';
  if (!Number.isFinite(amount) || amount < 100) {
    var bad = new Error('Amount must be at least 100 paise');
    bad.code = 'VALIDATION';
    throw bad;
  }

  var res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(keyId + ':' + keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      currency: currency,
      receipt: params.receipt || ('wm_' + Date.now()),
      notes: params.notes || {},
    }),
  });

  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    var apiErr = new Error((data && data.error && data.error.description) || 'Razorpay order creation failed');
    apiErr.code = res.status === 401 ? 'AUTH' : 'RAZORPAY';
    apiErr.status = res.status;
    throw apiErr;
  }

  return {
    order_id: data.id,
    amount: data.amount,
    currency: data.currency,
    key_id: keyId,
  };
}

export async function verifyRazorpayPayment (credentials, fields) {
  var keySecret = credentials.keySecret;
  if (!keySecret) {
    var err = new Error('Razorpay credentials not configured');
    err.code = 'CONFIG';
    throw err;
  }

  var orderId = (fields.razorpay_order_id || fields.order_id || '').trim();
  var paymentId = (fields.razorpay_payment_id || fields.payment_id || '').trim();
  var signature = (fields.razorpay_signature || fields.signature || '').trim();

  if (!orderId || !paymentId || !signature) {
    var missing = new Error('Missing payment verification fields');
    missing.code = 'VALIDATION';
    throw missing;
  }

  var expected = await hmacSha256Hex(keySecret, orderId + '|' + paymentId);
  if (!timingSafeEqual(expected, signature)) {
    var mismatch = new Error('Payment signature mismatch');
    mismatch.code = 'SIGNATURE';
    throw mismatch;
  }

  return { verified: true, order_id: orderId, payment_id: paymentId };
}

export function resolveCheckoutAmount (body) {
  var purpose = body && body.purpose;
  if (purpose === 'order_booking') return BOOKING_AMOUNT_PAISE;
  if (purpose === 'mirror_full_pay') {
    var mirrorAmt = Math.round(Number(body && body.amount));
    return mirrorAmt;
  }
  var amount = Math.round(Number(body && body.amount));
  return amount;
}

export async function handleCreateOrderRequest (request, env) {
  try {
    var body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  var amount = resolveCheckoutAmount(body);
  if (body.purpose === 'order_booking') {
    amount = BOOKING_AMOUNT_PAISE;
  } else if (body.purpose === 'mirror_full_pay') {
    if (!Number.isFinite(amount) || amount < 100) {
      return jsonResponse({ success: false, error: 'Mirror order amount must be at least 100 paise' }, 400);
    }
    if (amount > MIRROR_MAX_PAISE) {
      return jsonResponse({ success: false, error: 'Mirror order amount exceeds allowed limit' }, 400);
    }
  } else if (!Number.isFinite(amount) || amount < 100) {
    return jsonResponse({ success: false, error: 'Amount must be at least 100 paise' }, 400);
  }

  try {
    var order = await createRazorpayOrder(
      { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET },
      {
        amount: amount,
        currency: body.currency || 'INR',
        receipt: body.receipt,
        notes: body.notes,
      }
    );
    return jsonResponse({ success: true, ...order });
  } catch (err) {
    if (err.code === 'CONFIG') return jsonResponse({ success: false, error: err.message }, 500);
    if (err.code === 'AUTH') return jsonResponse({ success: false, error: 'Razorpay authentication failed' }, 401);
    if (err.code === 'VALIDATION') return jsonResponse({ success: false, error: err.message }, 400);
    return jsonResponse({ success: false, error: err.message || 'Order creation failed' }, 500);
  }
}

export async function handleVerifyPaymentRequest (request, env) {
  try {
    var body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  try {
    var result = await verifyRazorpayPayment(
      { keySecret: env.RAZORPAY_KEY_SECRET },
      body
    );
    return jsonResponse({ success: true, verified: true, ...result });
  } catch (err) {
    if (err.code === 'SIGNATURE' || err.code === 'VALIDATION') {
      return jsonResponse({ success: false, error: err.message }, 400);
    }
    if (err.code === 'CONFIG') return jsonResponse({ success: false, error: err.message }, 500);
    return jsonResponse({ success: false, error: err.message || 'Verification failed' }, 500);
  }
}
