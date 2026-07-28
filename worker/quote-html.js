/**
 * The order confirmation document, rendered to PDF by worker/pdf.js.
 *
 * This is a server-side port of the browser print stage, so a customer's PDF
 * looks the same whether they downloaded it themselves or received it by email.
 * It is a standalone HTML document: no external stylesheet, absolute asset URLs
 * only, because the renderer loads it in a blank browser context.
 */
import { escapeHtml, fmtInr } from './http.js';

const SITE = 'https://woodenmax.in';
const COMPANY = {
  name: 'WoodenMax Architectural Elements',
  address: '5-6-411/413, Aaghapura, Nampally, Hyderabad 500001',
  phone: '+91 78953 28080',
  email: 'info@woodenmax.com',
  web: 'www.woodenmax.in',
  gstin: '36ARWPA9740L1Z3',
  pan: 'ARWPA9740L',
  bankName: 'HDFC Bank',
  bankAccount: '50200092938110',
  bankIfsc: 'HDFC0001996',
  bankBranch: 'Nampally, Hyderabad',
  upi: 'finilexnaseem-3@okicici',
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits (n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

export function numToIndianWords (num) {
  let n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = Math.floor(n / 100); n %= 100;
  if (crore) parts.push(twoDigits(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(ONES[hundred] + ' Hundred');
  if (n) parts.push(twoDigits(n));
  return parts.join(' ') + ' Rupees Only';
}

function fmtDate (ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function itemAmount (item) {
  if (typeof item.exactAmount === 'number' && item.exactAmount > 0) return Math.round(item.exactAmount);
  const digits = String(item.amount || '').replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

function itemQty (item) {
  const rows = item.details || [];
  for (const row of rows) {
    if (row && /^(quantity|qty|nos)$/i.test(String(row.label))) {
      const m = String(row.value).match(/(\d+)/);
      if (m) return m[1];
    }
  }
  return '1';
}

/**
 * Every saved spec row is printed. The calculators already label dimensions,
 * glass, hardware, finish and colour, so nothing is dropped or re-derived here
 * — the document shows exactly what was stored against the item.
 */
function specRows (item) {
  const rows = (item.details || []).filter(
    (d) => d && d.label && d.value !== '' && d.value !== null && d.value !== undefined &&
      !/^(product|category)$/i.test(String(d.label))
  );
  if (!rows.length && item.area) {
    return '<div class="spec"><span class="sk">Size / area</span><span class="sv">' + escapeHtml(item.area) + '</span></div>';
  }
  return rows
    .map((d) => '<div class="spec"><span class="sk">' + escapeHtml(d.label) + '</span><span class="sv">' + escapeHtml(String(d.value)) + '</span></div>')
    .join('');
}

/**
 * Prefer structured location fields from the lead form / pincode widget.
 * Autocomplete often stores a composite label in `city` (e.g. "Mansarovar,
 * Jaipur (302020)") while also filling area/district/pincode — use the
 * structured parts so the PDF prints a clear, complete party address.
 */
function locationParts (customer) {
  const c = customer || {};
  const address = String(c.address || c.site_address || c.street || '').trim();
  const area = String(c.area || '').trim();
  const district = String(c.district || '').trim();
  const state = String(c.state || '').trim();
  const pincode = String(c.pincode || '').trim();
  let city = String(c.city || '').trim();

  const looksComposite = Boolean(
    city && (
      /\(\d{6}\)\s*$/.test(city) ||
      (area && city.toLowerCase().indexOf(area.toLowerCase()) === 0) ||
      (pincode && city.indexOf(pincode) !== -1) ||
      (district && area && new RegExp('^' + area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',\\s*' + district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(city))
    )
  );
  if (looksComposite && (area || district || pincode)) city = '';

  const cityDisplay = city || district || '';
  const districtDisplay = district && cityDisplay &&
    district.toLowerCase() !== cityDisplay.toLowerCase() ? district : '';

  return { address, area, city: cityDisplay, district: districtDisplay, state, pincode };
}

function locationRowsHtml (customer) {
  const loc = locationParts(customer);
  const rows = [];
  const push = (label, value) => {
    if (value) {
      rows.push(
        '<div class="r"><span class="k">' + label + ':</span> <span class="v">' +
          escapeHtml(value) + '</span></div>'
      );
    }
  };
  push('Address', loc.address);
  push('Area', loc.area);
  push('City', loc.city);
  push('District', loc.district);
  push('State', loc.state);
  push('PIN', loc.pincode);
  if (!rows.length) {
    return '<div class="r"><span class="k">Address:</span> <span class="v">—</span></div>';
  }
  return rows.join('');
}

function itemHasSizeSpec (item) {
  return (item.details || []).some(
    (d) => d && /^(size|area|dimensions?|footprint|run length)$/i.test(String(d.label || ''))
  );
}

function itemRowsHtml (items) {
  return (items || [])
    .map((item, i) => {
      const amount = itemAmount(item);
      const qty = itemQty(item);
      const unit = Number(qty) > 0 ? Math.round(amount / Number(qty)) : amount;
      const areaLine = item.area && !itemHasSizeSpec(item)
        ? '<div class="iarea"><strong>Size / area:</strong> ' + escapeHtml(item.area) + '</div>'
        : '';
      return (
        '<tr>' +
          '<td class="c">' + (i + 1) + '</td>' +
          '<td class="idesc">' +
            '<div class="iname">' + escapeHtml(item.productName || item.name || 'Configuration') + '</div>' +
            (item.category ? '<div class="icat">' + escapeHtml(item.category) + '</div>' : '') +
            areaLine +
            '<div class="specs">' + specRows(item) + '</div>' +
          '</td>' +
          '<td class="c">' + escapeHtml(qty) + '</td>' +
          '<td class="n">' + fmtInr(unit) + '</td>' +
          '<td class="n"><strong>' + fmtInr(amount) + '</strong></td>' +
        '</tr>'
      );
    })
    .join('');
}

/** Public Worker origin used in QR codes and shareable order links. */
export function workerPublicOrigin (env) {
  const raw = (env && (env.WORKER_ORIGIN || env.PAYMENTS_ORIGIN)) ||
    'https://jolly-field-be49.finilexnaseem.workers.dev';
  return String(raw).replace(/\/$/, '');
}

/**
 * Stable public URL for this order's confirmation page (HTML). Scanning the
 * PDF QR opens this page — never the marketing homepage.
 * Pattern: {WORKER_ORIGIN}/order/{orderNo}
 */
export function orderConfirmUrl (orderNo, env) {
  return workerPublicOrigin(env) + '/order/' + encodeURIComponent(orderNo);
}

/**
 * QR payload: absolute Worker confirmation URL for this order_no. Rendered by
 * an image service at PDF build time and rasterised into the file.
 */
function qrBlock (order, env) {
  const payload = orderConfirmUrl(order.orderNo, env);
  const src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=' + encodeURIComponent(payload);
  return (
    '<div class="qr">' +
      '<img src="' + escapeHtml(src) + '" alt="" width="90" height="90" onerror="this.style.display=\'none\'">' +
      '<span>Scan to verify order<br>' + escapeHtml(order.orderNo) + '</span>' +
    '</div>'
  );
}

const STYLES = `
  /* Side margins come from worker/pdf.js pdfOptions (~15mm L/R).
     Keep @page at 0 so Chromium does not double-apply CSS + pdfOptions. */
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; max-width: 100%;
    overflow-x: hidden;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 9pt; line-height: 1.4; color: #0F172A;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc {
    width: 100%; max-width: 100%;
    overflow-x: hidden;
    padding: 0;
    box-sizing: border-box;
  }
  .hdr {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 12pt; border-bottom: 2pt solid #0F172A; padding-bottom: 8pt;
  }
  .brand { flex: 1 1 auto; min-width: 0; max-width: 58%; }
  .brand img { height: 30pt; width: auto; max-width: 140pt; display: block; margin-bottom: 4pt; }
  .brand strong { display: block; font-size: 12pt; letter-spacing: -0.2pt; }
  .tag { display: block; color: #475569; font-size: 7.2pt; margin: 1pt 0 3pt; word-break: break-word; }
  .addr { display: block; color: #64748B; font-size: 7pt; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere; }
  .meta { flex: 0 0 168pt; width: 168pt; max-width: 42%; min-width: 0; }
  .doctype {
    background: #0F172A; color: #fff; font-size: 9pt; font-weight: 700;
    padding: 4pt 6pt; text-align: center; letter-spacing: 0.35pt;
  }
  .meta .row {
    display: flex; justify-content: space-between; gap: 6pt;
    border-bottom: 0.5pt solid #E2E8F0; padding: 2.4pt 1pt; font-size: 7.6pt;
  }
  .meta .label { color: #64748B; flex: 0 0 auto; }
  .meta .value { font-weight: 700; text-align: right; min-width: 0; word-break: break-all; overflow-wrap: anywhere; }
  .paidflag {
    margin-top: 5pt; text-align: center; font-weight: 800; font-size: 8.2pt;
    padding: 3pt 4pt; border-radius: 2pt; background: #DCFCE7; color: #065F46;
    border: 0.7pt solid #86EFAC; word-break: break-word;
  }
  .parties { display: flex; gap: 8pt; margin-top: 9pt; align-items: stretch; }
  .party {
    flex: 1 1 0; min-width: 0; max-width: 50%;
    border: 0.7pt solid #CBD5E1; border-radius: 2pt; padding: 6pt 7pt;
    background: #F8FAFC;
  }
  .party h2 {
    margin: 0 0 4pt; font-size: 8pt; text-transform: uppercase;
    letter-spacing: 0.45pt; color: #B45309; border-bottom: 0.5pt solid #E2E8F0; padding-bottom: 2pt;
  }
  .party .r {
    font-size: 7.8pt; padding: 1.2pt 0; line-height: 1.35;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .party .k { color: #64748B; font-weight: 500; }
  .party .v { color: #0F172A; font-weight: 600; }
  h3.sec {
    margin: 10pt 0 4pt; font-size: 9pt; text-transform: uppercase;
    letter-spacing: 0.4pt; border-left: 2.5pt solid #B45309; padding-left: 5pt;
  }
  table.items {
    width: 100%; max-width: 100%; border-collapse: collapse;
    table-layout: fixed;
  }
  table.items th {
    background: #0F172A; color: #fff; font-size: 7.4pt; text-transform: uppercase;
    letter-spacing: 0.25pt; padding: 4pt 4pt; text-align: left;
  }
  table.items td {
    border-bottom: 0.55pt solid #E2E8F0; padding: 4pt;
    vertical-align: top; font-size: 7.8pt;
    word-break: break-word; overflow-wrap: anywhere;
  }
  table.items tr { page-break-inside: avoid; }
  td.c, th.c { text-align: center; }
  td.n, th.n { text-align: right; white-space: nowrap; }
  td.idesc { width: auto; }
  .iname { font-weight: 700; font-size: 8.2pt; word-break: break-word; overflow-wrap: anywhere; }
  .icat { color: #B45309; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.25pt; }
  .iarea { font-size: 7.2pt; color: #334155; margin: 2pt 0; word-break: break-word; }
  .specs { margin-top: 3pt; display: block; width: 100%; }
  .spec {
    font-size: 7pt; display: grid; grid-template-columns: 72pt 1fr;
    gap: 2pt 4pt; padding: 0.6pt 0; width: 100%; max-width: 100%;
  }
  .sk { color: #64748B; min-width: 0; }
  .sk::after { content: ":"; }
  .sv { color: #0F172A; font-weight: 600; min-width: 0; word-break: break-word; overflow-wrap: anywhere; }
  .totwrap {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 10pt; margin-top: 8pt; page-break-inside: avoid;
  }
  .qr { flex: 0 0 auto; text-align: center; font-size: 6.5pt; color: #64748B; max-width: 100pt; }
  .qr img { display: block; margin: 0 auto 2pt; width: 72pt; height: 72pt; }
  table.tot { flex: 0 1 240pt; width: 240pt; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.tot td {
    padding: 2.8pt 5pt; font-size: 8pt; border-bottom: 0.5pt solid #E2E8F0;
    word-break: break-word; overflow-wrap: anywhere;
  }
  table.tot td.value { text-align: right; font-weight: 700; white-space: nowrap; width: 38%; }
  table.tot tr.grand td { background: #0F172A; color: #fff; font-size: 9pt; font-weight: 800; border: none; }
  table.tot tr.paid td { color: #065F46; }
  table.tot tr.bal td { color: #B45309; }
  .words {
    margin-top: 6pt; font-size: 7.6pt; background: #F8FAFC;
    border-left: 2.5pt solid #B45309; padding: 4pt 6pt;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .notice {
    margin-top: 6pt; font-size: 7.2pt; border: 0.7pt dashed #FCD34D;
    background: #FFFBEB; padding: 5pt 6pt; border-radius: 2pt;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .notice p { margin: 0 0 2pt; }
  .grid2 { display: flex; gap: 8pt; margin-top: 9pt; page-break-inside: avoid; }
  .card {
    flex: 1 1 0; min-width: 0; max-width: 50%;
    border: 0.7pt solid #CBD5E1; border-radius: 2pt; padding: 6pt 7pt;
  }
  .card h3 {
    margin: 0 0 4pt; font-size: 8pt; text-transform: uppercase;
    letter-spacing: 0.35pt; color: #B45309;
  }
  .card ol { margin: 0; padding-left: 11pt; }
  .card li {
    font-size: 7pt; margin-bottom: 2pt; line-height: 1.35;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .bank {
    display: flex; justify-content: space-between; gap: 6pt;
    font-size: 7.2pt; border-bottom: 0.4pt dotted #E2E8F0; padding: 1.4pt 0;
  }
  .bank .k { color: #64748B; flex: 0 0 auto; }
  .bank .v { font-weight: 700; text-align: right; min-width: 0; word-break: break-word; overflow-wrap: anywhere; }
  .signs { display: flex; justify-content: space-between; gap: 12pt; margin-top: 18pt; page-break-inside: avoid; }
  .sign {
    width: 42%; max-width: 46%; min-width: 0;
    border-top: 0.7pt solid #94A3B8; padding-top: 3pt; font-size: 7.2pt; color: #64748B;
  }
  .sign strong { display: block; color: #0F172A; font-size: 7.8pt; }
  .foot {
    margin-top: 8pt; border-top: 0.7pt solid #E2E8F0; padding-top: 4pt;
    text-align: center; font-size: 6.5pt; color: #94A3B8;
    word-break: break-word; overflow-wrap: anywhere;
  }
`;

export function buildOrderDocumentHtml (order, env) {
  const items = order.items || [];
  const totals = order.totals || { subtotal_inr: 0, gst_inr: 0, total_inr: 0 };
  const customer = order.customer || {};
  const paid = Math.round(order.paidInr || 0);
  const balance = Math.round(order.balanceInr || 0);
  const isBooking = order.purpose === 'order_booking';
  const logo = (env && env.SITE_ORIGIN ? env.SITE_ORIGIN : SITE) + '/images/woodenmax-logo.webp';
  const freeTransport = totals.subtotal_inr >= 1500000;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(order.orderNo)} — WoodenMax Order Confirmation</title>
<style>${STYLES}</style></head>
<body><div class="doc">

  <div class="hdr">
    <div class="brand">
      <img src="${escapeHtml(logo)}" alt="WoodenMax">
      <strong>WoodenMax</strong>
      <span class="tag">Premium Aluminium Windows &middot; Facade &middot; Shower Partitions &middot; Pergolas</span>
      <span class="addr">${escapeHtml(COMPANY.name)}<br>${escapeHtml(COMPANY.address)}<br>${escapeHtml(COMPANY.phone)} &middot; ${escapeHtml(COMPANY.email)} &middot; ${escapeHtml(COMPANY.web)}</span>
    </div>
    <div class="meta">
      <div class="doctype">ORDER CONFIRMATION</div>
      <div class="row"><span class="label">Order No.</span><span class="value">${escapeHtml(order.orderNo)}</span></div>
      <div class="row"><span class="label">Quotation No.</span><span class="value">${escapeHtml(order.quoteNo || '—')}${order.quoteVersion ? ' v' + escapeHtml(String(order.quoteVersion)) : ''}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(fmtDate(order.createdAt))}</span></div>
      <div class="row"><span class="label">Payment ID</span><span class="value">${escapeHtml(order.paymentId || '—')}</span></div>
      <div class="row"><span class="label">GSTIN</span><span class="value">${escapeHtml(COMPANY.gstin)}</span></div>
      <div class="paidflag">PAYMENT RECEIVED &middot; ${fmtInr(paid)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Bill To / Customer</h2>
      <div class="r"><strong>${escapeHtml(customer.name || '—')}</strong></div>
      <div class="r"><span class="k">Mobile:</span> <span class="v">${escapeHtml(customer.mobile || '—')}</span></div>
      <div class="r"><span class="k">Email:</span> <span class="v">${escapeHtml(customer.email || '—')}</span></div>
      <div class="r"><span class="k">Profile:</span> <span class="v">${escapeHtml(customer.role || '—')}</span></div>
    </div>
    <div class="party">
      <h2>Project / Site Address</h2>
      ${locationRowsHtml(customer)}
      <div class="r"><span class="k">Items:</span> <span class="v">${items.length} configuration${items.length === 1 ? '' : 's'}</span></div>
      <div class="r"><span class="k">Status:</span> <span class="v">${isBooking ? 'Site visit slot booked' : 'Order confirmed'}</span></div>
      <div class="r"><span class="k">Lead time:</span> <span class="v">3&ndash;4 weeks from final measurement</span></div>
    </div>
  </div>

  <h3 class="sec">Ordered Configurations</h3>
  <table class="items">
    <colgroup>
      <col style="width:5%"><col style="width:51%"><col style="width:8%"><col style="width:18%"><col style="width:18%">
    </colgroup>
    <thead><tr>
      <th class="c">#</th>
      <th>Item &amp; Specifications</th>
      <th class="c">Qty</th>
      <th class="n">Unit Price</th>
      <th class="n">Amount</th>
    </tr></thead>
    <tbody>${itemRowsHtml(items)}</tbody>
  </table>

  <div class="totwrap">
    ${qrBlock(order, env)}
    <table class="tot">
      <tr><td>Subtotal (basic value)</td><td class="value">${fmtInr(totals.subtotal_inr)}</td></tr>
      <tr><td>GST @ 18% <span style="color:#B45309">(always extra)</span></td><td class="value">${fmtInr(totals.gst_inr)}</td></tr>
      <tr><td>Transportation</td><td class="value">${freeTransport ? '<span style="color:#047857">FREE *</span>' : 'At actuals'}</td></tr>
      <tr class="grand"><td>Grand Total (incl. GST)</td><td class="value">${fmtInr(totals.total_inr)}</td></tr>
      <tr class="paid"><td>${isBooking ? 'Booking advance paid' : 'Amount paid'}</td><td class="value">- ${fmtInr(paid)}</td></tr>
      <tr class="bal"><td><strong>Balance due</strong></td><td class="value">${fmtInr(balance)}</td></tr>
    </table>
  </div>

  <div class="words"><strong>Amount in words:</strong> ${escapeHtml(numToIndianWords(totals.total_inr))} (inclusive of GST).</div>

  <div class="notice">
    <p><strong>Payment status:</strong> ${fmtInr(paid)} received on ${escapeHtml(fmtDate(order.createdAt))} via Razorpay${order.paymentId ? ' (ref ' + escapeHtml(order.paymentId) + ')' : ''}. Balance of ${fmtInr(balance)} is payable as per the schedule in the terms below.</p>
    <p><strong>GST:</strong> 18% is always extra on the basic value. <strong>Transportation:</strong> ${freeTransport
      ? 'FREE for this order (value above &#8377;15 Lakh), provided the site is within 1,000 km by road from the Hyderabad branch.'
      : 'charged at actuals from the Hyderabad branch; free above &#8377;15 Lakh within 1,000 km by road.'}</p>
    ${isBooking ? '<p><strong>Site visit booking:</strong> this &#8377;1,000 advance holds your slot and is adjusted against the final order value. Refundable before production starts.</p>' : ''}
  </div>

  <div class="grid2">
    <div class="card">
      <h3>Terms &amp; Conditions</h3>
      <ol>
        <li>Supply is for the <strong>exact sizes</strong> recorded above. If actual site openings differ, WoodenMax is not responsible for resizing, rework or extra cost; revised sizes are re-quoted.</li>
        <li>Final measurements are confirmed on site by our technical team before production begins.</li>
        <li><strong>GST @ 18% is always extra</strong> on the basic value; all prices above are pre-tax unless marked otherwise.</li>
        <li>Payment terms: <strong>50% advance</strong> with order confirmation, <strong>40%</strong> before dispatch, <strong>10%</strong> on installation completion. Any advance already paid is adjusted.</li>
        <li>Transportation is <strong>FREE</strong> only when order value &#8805; &#8377;15 Lakh (basic) and the site is within 1,000 km by road from Hyderabad; otherwise at actuals.</li>
        <li>Standard lead time is <strong>3&ndash;4 weeks</strong> from final measurement and advance receipt.</li>
        <li>Installation, hardware (handles, locks, rollers), EPDM gaskets and silicone sealant are included unless noted otherwise.</li>
        <li>Civil work, high-rise scaffolding, electrical points and motorisation power supply are <strong>not included</strong>.</li>
        <li><strong>Warranty:</strong> 10 years on aluminium profile against manufacturing defects, 5 years on hardware, 2 years on rubber gaskets. Glass breakage in transit or after installation is not covered.</li>
        <li>All disputes are subject to <strong>Hyderabad jurisdiction</strong> only.</li>
      </ol>
    </div>
    <div class="card">
      <h3>Payment Details</h3>
      <div class="bank"><span class="k">Account Name</span><span class="v">${escapeHtml(COMPANY.name)}</span></div>
      <div class="bank"><span class="k">Bank</span><span class="v">${escapeHtml(COMPANY.bankName)}</span></div>
      <div class="bank"><span class="k">Account No.</span><span class="v">${escapeHtml(COMPANY.bankAccount)}</span></div>
      <div class="bank"><span class="k">IFSC</span><span class="v">${escapeHtml(COMPANY.bankIfsc)}</span></div>
      <div class="bank"><span class="k">Branch</span><span class="v">${escapeHtml(COMPANY.bankBranch)}</span></div>
      <div class="bank"><span class="k">UPI</span><span class="v">${escapeHtml(COMPANY.upi)}</span></div>
      <div class="bank"><span class="k">GSTIN</span><span class="v">${escapeHtml(COMPANY.gstin)}</span></div>
      <div class="bank"><span class="k">PAN</span><span class="v">${escapeHtml(COMPANY.pan)}</span></div>
      <h3 style="margin-top:8pt">Contact</h3>
      <div class="bank"><span class="k">Phone</span><span class="v">${escapeHtml(COMPANY.phone)}</span></div>
      <div class="bank"><span class="k">Email</span><span class="v">${escapeHtml(COMPANY.email)}</span></div>
      <div class="bank"><span class="k">Web</span><span class="v">${escapeHtml(COMPANY.web)}</span></div>
    </div>
  </div>

  <div class="signs">
    <div class="sign"><strong>Customer Acceptance</strong>Signature, Name &amp; Date</div>
    <div class="sign" style="text-align:right"><strong>For ${escapeHtml(COMPANY.name)}</strong>Authorised Signatory</div>
  </div>

  <div class="foot">
    This is a computer-generated order confirmation for ${escapeHtml(order.orderNo)} and is valid without a physical signature.<br>
    ${escapeHtml(COMPANY.name)} &middot; GSTIN ${escapeHtml(COMPANY.gstin)} &middot; ${escapeHtml(COMPANY.phone)} &middot; ${escapeHtml(COMPANY.web)}
  </div>

</div></body></html>`;
}
