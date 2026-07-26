/**
 * Razorpay: order creation, payment signature verification and webhook
 * signature verification.
 *
 * Amounts are never taken from the browser — see worker/orders.js, which
 * recomputes them from the stored quote before an order is created.
 */
import { workerErr, timingSafeEqual, hmacSha256Hex } from './http.js';

export const BOOKING_AMOUNT_PAISE = 100000;
export const MAX_ORDER_PAISE = 50000000;

export function getRazorpayCredentials (env) {
  const keyId = String(env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) {
    throw workerErr(
      'Razorpay keys missing on Worker. Cloudflare -> Workers -> Settings -> Variables -> add secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then deploy.',
      'CONFIG'
    );
  }
  if (/^rzp_(test|live)_/i.test(keySecret) && !/^rzp_(test|live)_/i.test(keyId)) {
    throw workerErr(
      'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET look swapped. Key ID starts with rzp_test_ or rzp_live_; the secret is a long random string.',
      'CONFIG'
    );
  }
  if (!/^rzp_(test|live)_/i.test(keyId)) {
    throw workerErr('RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_.', 'CONFIG');
  }
  return { keyId, keySecret };
}

export function razorpayMode (keyId) {
  if (/^rzp_live_/i.test(keyId || '')) return 'live';
  if (/^rzp_test_/i.test(keyId || '')) return 'test';
  return null;
}

export async function createRazorpayOrder (credentials, params) {
  const amount = Math.round(Number(params.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    throw workerErr('Amount must be at least 100 paise', 'VALIDATION');
  }
  if (amount > MAX_ORDER_PAISE) {
    throw workerErr('Order amount exceeds the allowed limit', 'VALIDATION');
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(credentials.keyId + ':' + credentials.keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: params.currency || 'INR',
      receipt: params.receipt || 'wm_' + Date.now(),
      notes: params.notes || {},
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const desc = (data && data.error && data.error.description) || 'Razorpay order creation failed';
    throw workerErr(desc, res.status === 401 ? 'AUTH' : 'RAZORPAY');
  }

  return {
    order_id: data.id,
    amount: data.amount,
    currency: data.currency,
    key_id: credentials.keyId,
  };
}

export async function verifyRazorpayPayment (keySecret, fields) {
  const orderId = (fields.razorpay_order_id || fields.order_id || '').trim();
  const paymentId = (fields.razorpay_payment_id || fields.payment_id || '').trim();
  const signature = (fields.razorpay_signature || fields.signature || '').trim();

  if (!orderId || !paymentId || !signature) {
    throw workerErr('Missing payment verification fields', 'VALIDATION');
  }

  const expected = await hmacSha256Hex(keySecret, orderId + '|' + paymentId);
  if (!timingSafeEqual(expected, signature)) {
    throw workerErr('Payment signature mismatch', 'SIGNATURE');
  }

  return { verified: true, order_id: orderId, payment_id: paymentId };
}

/**
 * Webhook bodies are signed over the raw request text, so the caller must pass
 * the unparsed body — re-serialising the JSON would change the bytes and fail.
 */
export async function verifyWebhookSignature (env, rawBody, signature) {
  const secret = String(env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) throw workerErr('RAZORPAY_WEBHOOK_SECRET is not configured', 'CONFIG');
  if (!signature) throw workerErr('Missing webhook signature header', 'VALIDATION');
  const expected = await hmacSha256Hex(secret, rawBody);
  if (!timingSafeEqual(expected, String(signature).trim())) {
    throw workerErr('Webhook signature mismatch', 'SIGNATURE');
  }
  return true;
}
