// Cloudflare Worker — email (Web3Forms) + Razorpay API
// ONE FILE ONLY — paste/deploy this whole file in Cloudflare Dashboard OR: npm run payments:deploy
//
// Secrets (Dashboard → Workers → jolly-field-be49 → Settings → Variables):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, WEB3FORMS_ACCESS_KEY, RECIPIENT_EMAIL

// ---------- Razorpay helpers (inlined — do not import lib/ in Dashboard editor) ----------
const BOOKING_AMOUNT_PAISE = 100000;
const MIRROR_MAX_PAISE = 50000000;

/** @param {string} message @param {string} [code] */
function workerErr (message, code) {
  const e = new Error(message);
  if (code) Object.assign(e, { code });
  return e;
}

/** @param {unknown} err @returns {string|undefined} */
function errCode (err) {
  if (err && typeof err === 'object' && 'code' in err) {
    return String(/** @type {{ code: string }} */ (err).code);
  }
  return undefined;
}

function corsHeaders () {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse (body, status = 200) {
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
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex (secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getRazorpayCredentials (env) {
  const keyId = String(env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) {
    throw workerErr(
      'Razorpay keys missing on Worker. In Cloudflare: Workers → jolly-field-be49 → Settings → Variables → add Secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then Deploy.',
      'CONFIG'
    );
  }
  if (/^rzp_(test|live)_/i.test(keySecret) && !/^rzp_(test|live)_/i.test(keyId)) {
    throw workerErr(
      'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET look swapped. Key ID must start with rzp_test_ or rzp_live_; secret is a long random string (not rzp_).',
      'CONFIG'
    );
  }
  if (!/^rzp_(test|live)_/i.test(keyId)) {
    throw workerErr(
      'RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_ (copy from Razorpay Dashboard → API Keys).',
      'CONFIG'
    );
  }
  return { keyId, keySecret };
}

async function createRazorpayOrder (credentials, params) {
  const keyId = credentials.keyId;
  const keySecret = credentials.keySecret;

  const amount = Math.round(Number(params.amount));
  const currency = params.currency || 'INR';
  if (!Number.isFinite(amount) || amount < 100) {
    throw workerErr('Amount must be at least 100 paise', 'VALIDATION');
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(keyId + ':' + keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
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
    key_id: keyId,
  };
}

async function verifyRazorpayPayment (credentials, fields) {
  const keySecret = credentials.keySecret;
  if (!keySecret) {
    throw workerErr(
      'Razorpay keys missing on Worker. Add RAZORPAY_KEY_SECRET in Cloudflare Worker Variables (Secrets).',
      'CONFIG'
    );
  }

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

function resolveCheckoutAmount (body) {
  const purpose = body && body.purpose;
  if (purpose === 'order_booking') return BOOKING_AMOUNT_PAISE;
  if (purpose === 'mirror_full_pay') return Math.round(Number(body && body.amount));
  return Math.round(Number(body && body.amount));
}

async function handleCreateOrderRequest (request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  let amount = resolveCheckoutAmount(body);
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
    const creds = getRazorpayCredentials(env);
    const order = await createRazorpayOrder(
      creds,
      {
        amount,
        currency: body.currency || 'INR',
        receipt: body.receipt,
        notes: body.notes,
      }
    );
    const mode = /^rzp_live_/i.test(creds.keyId) ? 'live' : 'test';
    return jsonResponse({ success: true, razorpay_mode: mode, ...order });
  } catch (err) {
    const code = errCode(err);
    const msg = err instanceof Error ? err.message : 'Order creation failed';
    if (code === 'CONFIG') {
      return jsonResponse({
        success: false,
        error: msg,
        hint: 'Cloudflare Dashboard → Workers → jolly-field-be49 → Settings → Variables → Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET',
      }, 500);
    }
    if (code === 'AUTH') {
      let creds;
      try {
        creds = getRazorpayCredentials(env);
      } catch (e) {
        creds = null;
      }
      const keyId = creds && creds.keyId ? creds.keyId : '';
      const mode = /^rzp_live_/i.test(keyId) ? 'live' : /^rzp_test_/i.test(keyId) ? 'test' : 'unknown';
      return jsonResponse({
        success: false,
        error: 'Razorpay authentication failed',
        razorpay_detail: msg,
        key_id_prefix: keyId ? keyId.slice(0, 16) : null,
        razorpay_mode: mode,
        hint:
          'Cloudflare Worker secrets galat hain. Razorpay Dashboard → API Keys → same mode (Test ya Live) se Key ID + Key Secret dubara copy karein. Secret regenerate kiya ho to purana secret kaam nahi karega. ID/Secret swap mat karein — Deploy zaroor karein.',
      }, 401);
    }
    if (code === 'VALIDATION') return jsonResponse({ success: false, error: msg }, 400);
    return jsonResponse({ success: false, error: msg || 'Order creation failed' }, 500);
  }
}

async function handleVerifyPaymentRequest (request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  try {
    const creds = getRazorpayCredentials(env);
    const result = await verifyRazorpayPayment({ keySecret: creds.keySecret }, body);
    return jsonResponse({ success: true, verified: true, ...result });
  } catch (err) {
    const code = errCode(err);
    const msg = err instanceof Error ? err.message : 'Verification failed';
    if (code === 'SIGNATURE' || code === 'VALIDATION') {
      return jsonResponse({ success: false, error: msg }, 400);
    }
    if (code === 'CONFIG') {
      return jsonResponse({
        success: false,
        error: msg,
        hint: 'Cloudflare Dashboard → Workers → jolly-field-be49 → Settings → Variables → Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET',
      }, 500);
    }
    return jsonResponse({ success: false, error: msg || 'Verification failed' }, 500);
  }
}

// ---------- Email relay ----------
function htmlToPlainText (s) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trimStart();
  if (
    !t.startsWith('<!DOCTYPE') &&
    !t.startsWith('<html') &&
    !t.startsWith('<div') &&
    !t.startsWith('<table')
  ) {
    return s;
  }
  return s
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(tr|p|div|table|h[1-6])>/gi, '\n')
    .replace(/<t[dh][^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeApiPath (pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  if (p === '/api/create-order' || p.endsWith('/api/create-order')) return '/api/create-order';
  if (p === '/api/verify-payment' || p.endsWith('/api/verify-payment')) return '/api/verify-payment';
  return p;
}

function isJsonRequest (request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  return ct.includes('application/json');
}

function isFormRequest (request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  return ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded');
}

async function routePaymentByJsonBody (request, env) {
  const clone = request.clone();
  let body;
  try {
    body = await clone.json();
  } catch (e) {
    return null;
  }
  if (!body || typeof body !== 'object') return null;

  if (body.razorpay_order_id || body.razorpay_payment_id || body.razorpay_signature) {
    return handleVerifyPaymentRequest(
      new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env
    );
  }
  if (body.purpose || body.amount != null || body.receipt || body.notes) {
    return handleCreateOrderRequest(
      new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env
    );
  }
  return null;
}

async function handleEmailPost (request, env) {
  if (isJsonRequest(request)) {
    const paymentRoute = await routePaymentByJsonBody(request, env);
    if (paymentRoute) return paymentRoute;
    return jsonResponse(
      { success: false, error: 'JSON must go to /api/create-order or /api/verify-payment' },
      415
    );
  }

  if (!isFormRequest(request)) {
    return jsonResponse(
      { success: false, error: 'Email expects form data; payment expects JSON on /api/*' },
      415
    );
  }

  const formData = await request.formData();

  const subject =
    formData.get('_subject') || formData.get('subject') || 'New Quote Request';
  const message = formData.get('message') || formData.get('body') || '';
  const name = formData.get('Name') || formData.get('name') || '';
  const city = formData.get('City') || formData.get('city') || '';
  const mobile = formData.get('Mobile') || formData.get('mobile') || '';
  const email = formData.get('Email') || formData.get('email') || '';
  const ccEmail = (formData.get('CC') || formData.get('cc_email') || '').toString().trim();

  let emailBody = htmlToPlainText(message || '');

  if (!emailBody.trim() && (name || city || mobile || email)) {
    const lines = [];
    if (name) lines.push('Name: ' + name);
    if (city) lines.push('City: ' + city);
    if (mobile) lines.push('Mobile: ' + mobile);
    if (email) lines.push('Email: ' + email);
    emailBody = lines.join('\n');
  }

  const accessKey =
    env.WEB3FORMS_ACCESS_KEY || 'fd9946a6-03dd-4f6f-bad8-c430f7c6d351';
  const recipientEmail = env.RECIPIENT_EMAIL || 'info@woodenmax.com';

  const payload = {
    access_key: accessKey,
    subject,
    from_name: name || 'WoodenMax Website',
    from_email: email || 'noreply@woodenmax.in',
    to_email: recipientEmail,
    message: emailBody,
  };

  if (ccEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(ccEmail)) {
    payload.cc = ccEmail;
  }
  if (email) {
    payload.reply_to = email;
  }

  const web3formsResponse = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await web3formsResponse.json();

  if (result.success) {
    return jsonResponse({ success: true, message: 'Email sent successfully' });
  }
  throw new Error(result.message || 'Failed to send email');
}

// ---------- Worker entry ----------
export default {
  async fetch (request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = normalizeApiPath(url.pathname);

    try {
      if (request.method === 'POST' && path === '/api/create-order') {
        return handleCreateOrderRequest(request, env);
      }

      if (request.method === 'POST' && path === '/api/verify-payment') {
        return handleVerifyPaymentRequest(request, env);
      }

      if (request.method === 'POST') {
        return await handleEmailPost(request, env);
      }

      if (request.method === 'GET' && path === '/health') {
        const keyId = env.RAZORPAY_KEY_ID ? String(env.RAZORPAY_KEY_ID).trim() : '';
        const hasKeyId = Boolean(keyId);
        const hasSecret = Boolean(env.RAZORPAY_KEY_SECRET && String(env.RAZORPAY_KEY_SECRET).trim());
        const mode = /^rzp_live_/i.test(keyId)
          ? 'live'
          : /^rzp_test_/i.test(keyId)
            ? 'test'
            : null;
        return jsonResponse({
          ok: true,
          razorpay: hasKeyId && hasSecret,
          razorpay_mode: mode,
          has_key_id: hasKeyId,
          has_key_secret: hasSecret,
          worker: 'jolly-field-be49',
          upi_qr_real_apps: mode === 'live',
          fix: !(hasKeyId && hasSecret)
            ? 'Cloudflare → Workers → jolly-field-be49 → Settings → Variables → Add ENCRYPTED secrets RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET → Deploy'
            : mode === 'test'
              ? 'Test keys: use Netbanking in checkout. Real UPI QR needs rzp_live_ keys + KYC.'
              : null,
        });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders() });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        { success: false, message: error.message || 'Request failed' },
        500
      );
    }
  },
};
