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
  if (!rows.length && item.area) return '<div class="spec"><em>' + escapeHtml(item.area) + '</em></div>';
  return rows
    .map((d) => '<div class="spec"><span class="sk">' + escapeHtml(d.label) + '</span><span class="sv">' + escapeHtml(d.value) + '</span></div>')
    .join('');
}

function itemRowsHtml (items) {
  return (items || [])
    .map((item, i) => {
      const amount = itemAmount(item);
      const qty = itemQty(item);
      const unit = Number(qty) > 0 ? Math.round(amount / Number(qty)) : amount;
      return (
        '<tr>' +
          '<td class="c">' + (i + 1) + '</td>' +
          '<td>' +
            '<div class="iname">' + escapeHtml(item.productName || item.name || 'Configuration') + '</div>' +
            (item.category ? '<div class="icat">' + escapeHtml(item.category) + '</div>' : '') +
            (item.area ? '<div class="iarea"><strong>Size / area:</strong> ' + escapeHtml(item.area) + '</div>' : '') +
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

/**
 * QR payload: the order verification page. Rendered by an image service at PDF
 * build time and rasterised into the file, so the finished PDF has no runtime
 * dependency. If the service is unreachable the block is simply omitted.
 */
function qrBlock (order) {
  const payload = SITE + '/order-status?o=' + encodeURIComponent(order.orderNo);
  const src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=' + encodeURIComponent(payload);
  return (
    '<div class="qr">' +
      '<img src="' + escapeHtml(src) + '" alt="" width="90" height="90" onerror="this.style.display=\'none\'">' +
      '<span>Scan to verify<br>' + escapeHtml(order.orderNo) + '</span>' +
    '</div>'
  );
}

const STYLES = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 9.2pt; line-height: 1.45; color: #0F172A;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc { padding: 0; }
  .hdr { display: flex; justify-content: space-between; gap: 16pt; border-bottom: 2.5pt solid #0F172A; padding-bottom: 8pt; }
  .brand img { height: 34pt; width: auto; display: block; margin-bottom: 5pt; }
  .brand strong { display: block; font-size: 13pt; letter-spacing: -0.2pt; }
  .tag { display: block; color: #475569; font-size: 7.8pt; margin-bottom: 3pt; }
  .addr { display: block; color: #64748B; font-size: 7.4pt; line-height: 1.4; }
  .meta { min-width: 175pt; }
  .doctype { background: #0F172A; color: #fff; font-size: 10pt; font-weight: 700; padding: 4pt 8pt; text-align: center; letter-spacing: 0.4pt; }
  .meta .row { display: flex; justify-content: space-between; border-bottom: 0.5pt solid #E2E8F0; padding: 2.6pt 2pt; font-size: 8pt; }
  .meta .label { color: #64748B; }
  .meta .value { font-weight: 700; }
  .paidflag { margin-top: 5pt; text-align: center; font-weight: 800; font-size: 9pt; padding: 3.5pt; border-radius: 3pt; background: #DCFCE7; color: #065F46; border: 0.8pt solid #86EFAC; }
  .parties { display: flex; gap: 10pt; margin-top: 10pt; }
  .party { flex: 1; border: 0.8pt solid #E2E8F0; border-radius: 3pt; padding: 6pt 8pt; }
  .party h2 { margin: 0 0 4pt; font-size: 8.4pt; text-transform: uppercase; letter-spacing: 0.5pt; color: #B45309; }
  .party .r { font-size: 8.2pt; padding: 1pt 0; }
  .party .k { color: #64748B; }
  h3.sec { margin: 12pt 0 5pt; font-size: 9.6pt; text-transform: uppercase; letter-spacing: 0.5pt; border-left: 3pt solid #B45309; padding-left: 5pt; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { background: #0F172A; color: #fff; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3pt; padding: 4.5pt 5pt; text-align: left; }
  table.items td { border-bottom: 0.6pt solid #E2E8F0; padding: 5pt; vertical-align: top; font-size: 8.4pt; }
  table.items tr { page-break-inside: avoid; }
  td.c, th.c { text-align: center; }
  td.n, th.n { text-align: right; white-space: nowrap; }
  .iname { font-weight: 700; font-size: 8.8pt; }
  .icat { color: #B45309; font-size: 7.4pt; text-transform: uppercase; letter-spacing: 0.3pt; }
  .iarea { font-size: 7.8pt; color: #334155; margin: 2pt 0; }
  .specs { display: flex; flex-wrap: wrap; gap: 1pt 10pt; margin-top: 2pt; }
  .spec { font-size: 7.4pt; width: 47%; display: flex; gap: 3pt; }
  .sk { color: #64748B; } .sk::after { content: ":"; }
  .sv { color: #0F172A; font-weight: 600; }
  .totwrap { display: flex; justify-content: space-between; gap: 12pt; margin-top: 8pt; page-break-inside: avoid; }
  .qr { text-align: center; font-size: 7pt; color: #64748B; }
  .qr img { display: block; margin-bottom: 2pt; }
  table.tot { min-width: 250pt; border-collapse: collapse; }
  table.tot td { padding: 3.2pt 6pt; font-size: 8.6pt; border-bottom: 0.5pt solid #E2E8F0; }
  table.tot td.value { text-align: right; font-weight: 700; white-space: nowrap; }
  table.tot tr.grand td { background: #0F172A; color: #fff; font-size: 10pt; font-weight: 800; border: none; }
  table.tot tr.paid td { color: #065F46; }
  table.tot tr.bal td { color: #B45309; }
  .words { margin-top: 6pt; font-size: 8pt; background: #F8FAFC; border-left: 2.5pt solid #B45309; padding: 4pt 7pt; }
  .notice { margin-top: 7pt; font-size: 7.8pt; border: 0.8pt dashed #FCD34D; background: #FFFBEB; padding: 5pt 7pt; border-radius: 3pt; }
  .notice p { margin: 0 0 2.5pt; }
  .grid2 { display: flex; gap: 10pt; margin-top: 10pt; page-break-inside: avoid; }
  .card { flex: 1; border: 0.8pt solid #E2E8F0; border-radius: 3pt; padding: 6pt 8pt; }
  .card h3 { margin: 0 0 4pt; font-size: 8.4pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #B45309; }
  .card ol { margin: 0; padding-left: 11pt; }
  .card li { font-size: 7.4pt; margin-bottom: 2.4pt; line-height: 1.4; }
  .bank { display: flex; justify-content: space-between; font-size: 7.8pt; border-bottom: 0.4pt dotted #E2E8F0; padding: 1.6pt 0; }
  .bank .k { color: #64748B; }
  .bank .v { font-weight: 700; }
  .signs { display: flex; justify-content: space-between; margin-top: 22pt; page-break-inside: avoid; }
  .sign { width: 42%; border-top: 0.8pt solid #94A3B8; padding-top: 3pt; font-size: 7.6pt; color: #64748B; }
  .sign strong { display: block; color: #0F172A; font-size: 8.2pt; }
  .foot { margin-top: 10pt; border-top: 0.8pt solid #E2E8F0; padding-top: 5pt; text-align: center; font-size: 7pt; color: #94A3B8; }
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

  const projectAddress = [customer.address, customer.city,
    customer.district && customer.district !== customer.city ? customer.district : '',
    customer.state, customer.pincode].filter(Boolean).join(', ');

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
      <div class="row"><span class="label">Quotation No.</span><span class="value">${escapeHtml(order.quoteNo || '—')}${order.quoteVersion ? ' v' + escapeHtml(order.quoteVersion) : ''}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(fmtDate(order.createdAt))}</span></div>
      <div class="row"><span class="label">Payment ID</span><span class="value">${escapeHtml(order.paymentId || '—')}</span></div>
      <div class="row"><span class="label">GSTIN</span><span class="value">${escapeHtml(COMPANY.gstin)}</span></div>
      <div class="paidflag">PAYMENT RECEIVED &middot; ${fmtInr(paid)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Customer</h2>
      <div class="r"><strong>${escapeHtml(customer.name || '—')}</strong></div>
      <div class="r"><span class="k">Mobile:</span> ${escapeHtml(customer.mobile || '—')}</div>
      <div class="r"><span class="k">Email:</span> ${escapeHtml(customer.email || '—')}</div>
      <div class="r"><span class="k">Profile:</span> ${escapeHtml(customer.role || '—')}</div>
    </div>
    <div class="party">
      <h2>Project / Site</h2>
      <div class="r"><span class="k">Address:</span> ${escapeHtml(projectAddress || '—')}</div>
      <div class="r"><span class="k">Items:</span> ${items.length} configuration${items.length === 1 ? '' : 's'}</div>
      <div class="r"><span class="k">Status:</span> ${isBooking ? 'Site visit slot booked' : 'Order confirmed'}</div>
      <div class="r"><span class="k">Lead time:</span> 3&ndash;4 weeks from final measurement</div>
    </div>
  </div>

  <h3 class="sec">Ordered Configurations</h3>
  <table class="items">
    <thead><tr>
      <th class="c" style="width:4%">#</th>
      <th style="width:56%">Item &amp; Specifications</th>
      <th class="c" style="width:8%">Qty</th>
      <th class="n" style="width:16%">Unit Price</th>
      <th class="n" style="width:16%">Amount</th>
    </tr></thead>
    <tbody>${itemRowsHtml(items)}</tbody>
  </table>

  <div class="totwrap">
    ${qrBlock(order)}
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
