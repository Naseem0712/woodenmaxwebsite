/**
 * Public HTML confirmation page for a paid order.
 * Served at GET /order/:orderNo — this is what the PDF QR code opens.
 */
import { escapeHtml, fmtInr } from './http.js';
import { workerPublicOrigin } from './quote-html.js';

function fmtDate (ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
}

function locationLines (customer) {
  const c = customer || {};
  const address = String(c.address || '').trim();
  const area = String(c.area || '').trim();
  const district = String(c.district || '').trim();
  const state = String(c.state || '').trim();
  const pincode = String(c.pincode || '').trim();
  let city = String(c.city || '').trim();
  if (city && (/\(\d{6}\)\s*$/.test(city) || (area && city.toLowerCase().indexOf(area.toLowerCase()) === 0))) {
    city = '';
  }
  const cityDisplay = city || district || '';
  const rows = [];
  if (address) rows.push(['Address', address]);
  if (area) rows.push(['Area', area]);
  if (cityDisplay) rows.push(['City', cityDisplay]);
  if (district && cityDisplay && district.toLowerCase() !== cityDisplay.toLowerCase()) {
    rows.push(['District', district]);
  }
  if (state) rows.push(['State', state]);
  if (pincode) rows.push(['PIN', pincode]);
  return rows;
}

function safeParse (raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

/**
 * @param {object} row  D1 orders row
 * @param {object} env
 */
export function buildOrderConfirmPageHtml (row, env) {
  const customer = safeParse(row.customer_json, {});
  const items = safeParse(row.items_json, []);
  const origin = workerPublicOrigin(env);
  const pdfUrl = origin + '/api/order/' + encodeURIComponent(row.order_no) + '/pdf';
  const site = (env && env.SITE_ORIGIN) || 'https://woodenmax.in';
  const paid = Math.round(row.amount_paid_inr || 0);
  const total = Math.round(row.order_total_inr || 0);
  const balance = Math.round(row.balance_due_inr || 0);
  const loc = locationLines(customer);

  const locHtml = loc.length
    ? loc.map(([k, v]) => '<div class="row"><span class="k">' + escapeHtml(k) + '</span><span class="v">' + escapeHtml(v) + '</span></div>').join('')
    : '<div class="row"><span class="k">Address</span><span class="v">—</span></div>';

  const itemsHtml = (items || []).slice(0, 20).map((it, i) => (
    '<li><strong>' + escapeHtml(it.productName || it.name || ('Item ' + (i + 1))) + '</strong>' +
      (it.area ? ' <span class="muted">· ' + escapeHtml(String(it.area)) + '</span>' : '') +
    '</li>'
  )).join('') || '<li class="muted">No line items recorded</li>';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(row.order_no)} — WoodenMax Order</title>
<style>
  :root { --ink:#0F172A; --muted:#64748B; --line:#E2E8F0; --accent:#B45309; --ok:#065F46; --okbg:#DCFCE7; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:var(--ink); background:#F1F5F9; line-height:1.45; }
  .wrap { max-width:560px; margin:0 auto; padding:24px 16px 40px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:20px 18px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .brand { font-size:13px; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  h1 { margin:0 0 4px; font-size:22px; }
  .orderno { font-size:15px; font-weight:700; word-break:break-all; }
  .badge { display:inline-block; margin:10px 0 14px; padding:5px 10px; border-radius:999px; background:var(--okbg); color:var(--ok); font-size:12px; font-weight:700; }
  h2 { margin:18px 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--accent); }
  .row { display:flex; justify-content:space-between; gap:12px; padding:5px 0; border-bottom:1px solid var(--line); font-size:14px; }
  .row .k { color:var(--muted); flex:0 0 auto; }
  .row .v { font-weight:600; text-align:right; word-break:break-word; }
  ul { margin:0; padding-left:18px; }
  li { margin:4px 0; font-size:14px; }
  .muted { color:var(--muted); font-weight:400; }
  .actions { display:flex; flex-direction:column; gap:10px; margin-top:18px; }
  a.btn { display:block; text-align:center; text-decoration:none; padding:12px 14px; border-radius:8px; font-weight:700; font-size:14px; }
  a.btn-primary { background:var(--ink); color:#fff; }
  a.btn-ghost { background:#fff; color:var(--ink); border:1px solid var(--line); }
  .foot { margin-top:16px; text-align:center; font-size:12px; color:var(--muted); }
  .foot a { color:var(--muted); }
</style>
</head><body>
<div class="wrap"><div class="card">
  <div class="brand">WoodenMax</div>
  <h1>Order confirmation</h1>
  <div class="orderno">${escapeHtml(row.order_no)}</div>
  <div class="badge">${row.payment_id ? 'Payment received' : escapeHtml(String(row.status || 'pending'))}</div>

  <h2>Customer</h2>
  <div class="row"><span class="k">Name</span><span class="v">${escapeHtml(customer.name || '—')}</span></div>
  <div class="row"><span class="k">Mobile</span><span class="v">${escapeHtml(customer.mobile || '—')}</span></div>
  ${customer.email ? '<div class="row"><span class="k">Email</span><span class="v">' + escapeHtml(customer.email) + '</span></div>' : ''}

  <h2>Site address</h2>
  ${locHtml}

  <h2>Payment</h2>
  <div class="row"><span class="k">Date</span><span class="v">${escapeHtml(fmtDate(row.created_at))}</span></div>
  <div class="row"><span class="k">Paid</span><span class="v">${fmtInr(paid)}</span></div>
  <div class="row"><span class="k">Order total</span><span class="v">${fmtInr(total)}</span></div>
  <div class="row"><span class="k">Balance</span><span class="v">${fmtInr(balance)}</span></div>
  ${row.payment_id ? '<div class="row"><span class="k">Payment ID</span><span class="v">' + escapeHtml(row.payment_id) + '</span></div>' : ''}

  <h2>Configurations (${items.length})</h2>
  <ul>${itemsHtml}</ul>

  <div class="actions">
    <a class="btn btn-primary" href="${escapeHtml(pdfUrl)}">Download / view order PDF</a>
    <a class="btn btn-ghost" href="${escapeHtml(site)}">Visit woodenmax.in</a>
  </div>
</div>
<p class="foot">WoodenMax Architectural Elements · <a href="tel:+917895328080">+91 78953 28080</a></p>
</div>
</body></html>`;
}
