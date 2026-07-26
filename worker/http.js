/**
 * Shared HTTP helpers for the WoodenMax Worker.
 */

/** Origins allowed to post quotes and payments. */
const ALLOWED_ORIGINS = [
  'https://woodenmax.in',
  'https://www.woodenmax.in',
  'https://window.woodenmax.in',
];

export function corsHeaders (request) {
  const origin = request && request.headers ? request.headers.get('Origin') : null;
  // Quotes carry customer contact details, so we echo known origins instead of
  // the previous blanket '*'. Unknown origins fall back to the main site.
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export function jsonResponse (body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

export function workerErr (message, code) {
  const e = new Error(message);
  if (code) Object.assign(e, { code });
  return e;
}

export function errCode (err) {
  if (err && typeof err === 'object' && 'code' in err) return String(err.code);
  return undefined;
}

export function timingSafeEqual (a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function hmacSha256Hex (secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function escapeHtml (value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Indian digit grouping: 12,34,567 */
export function fmtInr (n) {
  const x = Math.round(Number(n) || 0);
  const s = String(Math.abs(x));
  const lastThree = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',';
  return (x < 0 ? '-' : '') + '\u20B9' + rest + lastThree;
}

export function bytesToBase64 (bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
