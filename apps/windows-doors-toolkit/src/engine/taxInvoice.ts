/**
 * Tax Invoice (Bill) — BusyWin-style PDF + Excel.
 * Layout mirrors sample tax invoice (Original + Duplicate copies):
 * boxed letterhead, meta/party columns, HSN table, GST breakup, bank, terms.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import ExcelJS from 'exceljs';
import type { AppState, BillingInvoice, BillingInvoiceLine, BusinessInfo } from '../types';
import {
  formatPlaceOfSupplyLabel,
  gstinStateCode,
  gstStateName,
  placeOfSupplyCode,
  placeOfSupplyLabel,
  resolveTaxSplit,
  splitLineTax,
  sumLineTaxes,
  type TaxSplitMode,
} from './gstTax';
import { ensureBusinessBillSeries } from './billSeries';

/** Helvetica/WinAnsi cannot encode ₹ — normalize for PDF text. */
function pdfText(s: string): string {
  return String(s ?? '')
    .replace(/\u20b9/g, 'Rs.')
    .replace(/[^\x00-\x7E]/g, '?');
}

function downloadBlob(filename: string, bytes: Uint8Array, mime: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** en-IN amount with 2 decimals, no currency symbol (Busy uses Rs./₹ in header only). */
function fmtAmt(n: number): string {
  return money(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return '--';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDateBusy(iso: string): string {
  const raw = String(iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return raw || '';
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ''}`;
}

function chunkToWords(n: number): string {
  if (n === 0) return '';
  if (n < 100) return twoDigitWords(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${ONES[h]} Hundred${rest ? ` ${twoDigitWords(rest)}` : ''}`;
}

/** Indian numbering: Rupees … and Paisa … Only */
export function amountInWordsInr(amount: number): string {
  const total = money(Math.max(0, amount));
  let rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const crore = Math.floor(rupees / 1_00_00_000);
  rupees %= 1_00_00_000;
  const lakh = Math.floor(rupees / 1_00_000);
  rupees %= 1_00_000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  const hundredBlock = rupees;

  const parts: string[] = [];
  if (crore) parts.push(`${chunkToWords(crore)} Crore`);
  if (lakh) parts.push(`${chunkToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${chunkToWords(thousand)} Thousand`);
  if (hundredBlock) parts.push(chunkToWords(hundredBlock));
  let out = `Rupees ${parts.join(' ') || 'Zero'}`;
  if (paise > 0) out += ` and Paisa ${twoDigitWords(paise)}`;
  return `${out} Only`;
}

function splitDesc(description: string): { title: string; details: string[] } {
  const lines = String(description || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!lines.length) return { title: '', details: [] };
  return { title: lines[0], details: lines.slice(1) };
}

export function recomputeInvoiceTaxes(
  inv: BillingInvoice,
  sellerGstin: string,
): BillingInvoice {
  const mode: TaxSplitMode =
    inv.taxMode ?? resolveTaxSplit(sellerGstin, inv.customerGstin);
  const lines = (inv.lines ?? []).map((line) => {
    const split = splitLineTax(
      { taxable: line.amount, gstPercent: line.gstPercent },
      mode,
    );
    return {
      ...line,
      cgst: split.cgst,
      sgst: split.sgst,
      igst: split.igst,
      total: split.total,
    } satisfies BillingInvoiceLine;
  });
  const sums = sumLineTaxes(
    lines.map((l) => ({
      taxable: l.amount,
      gstPercent: l.gstPercent,
      cgst: l.cgst,
      sgst: l.sgst,
      igst: l.igst,
      tax: l.cgst + l.sgst + l.igst,
      total: l.total,
    })),
  );
  const place =
    inv.placeOfSupply && !/^\d{2}$/.test(inv.placeOfSupply.trim())
      ? inv.placeOfSupply
      : placeOfSupplyLabel(sellerGstin, inv.customerGstin);
  return {
    ...inv,
    taxMode: mode,
    lines,
    taxableAmount: sums.taxable,
    amount: sums.taxable,
    cgst: sums.cgst,
    sgst: sums.sgst,
    igst: sums.igst,
    gst: sums.tax,
    total: sums.total,
    placeOfSupply: place,
  };
}

export interface InvoicePrintModel {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGstin: string;
  pan: string;
  udyamNo: string;
  tagline: string;
  logoUrl: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  invoiceTerms: string[];
  jurisdictionState: string;
  customerName: string;
  customerPhone: string;
  customerGstin: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  partyState: string;
  eWayBillNo: string;
  vehicleNo: string;
  transportName: string;
  station: string;
  reverseCharge: string;
  grRrNo: string;
  invoiceNo: string;
  date: string;
  quoteNo: string;
  taxMode: TaxSplitMode;
  lines: BillingInvoiceLine[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;
  total: number;
  note: string;
  totalQty: number;
}

function defaultInvoiceTerms(jurisdiction: string): string[] {
  const j = jurisdiction || 'Telangana';
  return [
    'Goods once sold will not be taken back.',
    '100% payment in Advance Only.',
    'Delivery charges must be paid at the site.',
    'Arrangements for unloading the goods are your responsibility.',
    `Subject to '${j}' Jurisdiction only.`,
  ];
}

function parseTerms(raw: string | undefined, jurisdiction: string): string[] {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map((s) => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  return lines.length ? lines : defaultInvoiceTerms(jurisdiction);
}

export function invoicePrintModel(state: AppState, inv: BillingInvoice): InvoicePrintModel {
  const b = ensureBusinessBillSeries(state.business) as BusinessInfo;
  const computed = recomputeInvoiceTaxes(inv, b.gstin);
  const sellerCode = gstinStateCode(b.gstin) || '';
  const jurisdiction =
    (b.jurisdictionState || '').trim() || gstStateName(sellerCode) || 'Telangana';
  const place =
    computed.placeOfSupply && computed.placeOfSupply.includes('(')
      ? computed.placeOfSupply
      : placeOfSupplyLabel(b.gstin, computed.customerGstin);
  const partyCode =
    gstinStateCode(computed.customerGstin) ||
    placeOfSupplyCode(b.gstin, computed.customerGstin);
  const partyState = formatPlaceOfSupplyLabel(partyCode);
  const bankFallback = (state.quote?.bankDetails || '').trim();
  const totalQty = (computed.lines || []).reduce((s, l) => {
    const q = Number(l.qty);
    return Number.isFinite(q) && q > 0 ? s + q : s;
  }, 0);

  return {
    companyName: b.companyName,
    companyAddress: b.address,
    companyPhone: b.phone,
    companyEmail: b.email,
    companyGstin: b.gstin,
    pan: (b.pan || '').trim(),
    udyamNo: (b.udyamNo || '').trim(),
    tagline: (b.invoiceTagline || '').trim(),
    logoUrl: b.logoUrl || '',
    bankAccountName: (b.bankAccountName || '').trim() || b.companyName,
    bankAccountNo: (b.bankAccountNo || '').trim(),
    bankIfsc: (b.bankIfsc || '').trim(),
    bankName: (b.bankName || '').trim() || bankFallback,
    invoiceTerms: parseTerms(b.invoiceTerms, jurisdiction),
    jurisdictionState: jurisdiction,
    customerName: computed.customer,
    customerPhone: computed.phone,
    customerGstin: computed.customerGstin || '',
    billingAddress: computed.billingAddress || '',
    shippingAddress: computed.shippingAddress || '',
    placeOfSupply: place,
    partyState,
    eWayBillNo: computed.eWayBillNo || '',
    vehicleNo: computed.vehicleNo || '',
    transportName: computed.transportName || '',
    station: computed.station || '',
    reverseCharge: (computed.reverseCharge || 'N').trim() || 'N',
    grRrNo: computed.grRrNo || '',
    invoiceNo: computed.invoiceNo,
    date: computed.date,
    quoteNo: computed.quoteNo || '',
    taxMode: computed.taxMode || 'igst',
    lines: computed.lines || [],
    taxable: computed.taxableAmount ?? computed.amount,
    cgst: computed.cgst ?? 0,
    sgst: computed.sgst ?? 0,
    igst: computed.igst ?? 0,
    gst: computed.gst,
    total: computed.total,
    note: computed.note || '',
    totalQty,
  };
}

interface HsnRow {
  hsn: string;
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

function buildHsnSummary(lines: BillingInvoiceLine[]): HsnRow[] {
  const map = new Map<string, HsnRow>();
  for (const line of lines) {
    const hsn = (line.hsn || '').trim() || '—';
    const rate = line.gstPercent || 0;
    const key = `${hsn}|${rate}`;
    const cur = map.get(key) || {
      hsn,
      rate,
      taxable: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      tax: 0,
    };
    cur.taxable = money(cur.taxable + line.amount);
    cur.cgst = money(cur.cgst + line.cgst);
    cur.sgst = money(cur.sgst + line.sgst);
    cur.igst = money(cur.igst + line.igst);
    cur.tax = money(cur.cgst + cur.sgst + cur.igst);
    map.set(key, cur);
  }
  return [...map.values()];
}

interface TaxAddLine {
  label: string;
  rate: number;
  amount: number;
}

function buildTaxAddLines(m: InvoicePrintModel): TaxAddLine[] {
  const byRate = new Map<number, { cgst: number; sgst: number; igst: number }>();
  for (const line of m.lines) {
    const r = line.gstPercent || 0;
    const cur = byRate.get(r) || { cgst: 0, sgst: 0, igst: 0 };
    cur.cgst = money(cur.cgst + line.cgst);
    cur.sgst = money(cur.sgst + line.sgst);
    cur.igst = money(cur.igst + line.igst);
    byRate.set(r, cur);
  }
  const out: TaxAddLine[] = [];
  const rates = [...byRate.keys()].sort((a, b) => a - b);
  for (const rate of rates) {
    const t = byRate.get(rate)!;
    if (m.taxMode === 'cgst_sgst') {
      const half = money(rate / 2);
      if (t.cgst > 0) out.push({ label: 'CGST', rate: half, amount: t.cgst });
      if (t.sgst > 0) out.push({ label: 'SGST', rate: half, amount: t.sgst });
    } else if (t.igst > 0) {
      out.push({ label: 'IGST', rate, amount: t.igst });
    }
  }
  return out;
}

/* ── BusyWin geometry (A4 pt) ─────────────────────────────────────── */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const BOX_L = 25.2;
const BOX_R = 555.0;
const BOX_T = 759.5;
const BOX_B = 32.4;
const MID_X = 286.8;
const COL = {
  sn: 25.2,
  snR: 46.8,
  desc: 46.8,
  descR: 264.1,
  hsn: 264.1,
  hsnR: 306.0,
  qty: 306.0,
  qtyR: 367.0,
  unit: 367.0,
  unitR: 393.6,
  price: 393.6,
  priceR: 466.1,
  amt: 466.1,
  amtR: 555.0,
};

const ink = rgb(0, 0, 0);
const thin = 0.6;

function drawHLine(page: PDFPage, y: number, x0 = BOX_L, x1 = BOX_R) {
  page.drawLine({
    start: { x: x0, y },
    end: { x: x1, y },
    thickness: thin,
    color: ink,
  });
}

function drawVLine(page: PDFPage, x: number, y0: number, y1: number) {
  page.drawLine({
    start: { x, y: y0 },
    end: { x, y: y1 },
    thickness: thin,
    color: ink,
  });
}

function textWidth(font: PDFFont, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(pdfText(text), size);
  } catch {
    return text.length * size * 0.5;
  }
}

function drawCentered(
  page: PDFPage,
  font: PDFFont,
  text: string,
  y: number,
  size: number,
  boldFont?: PDFFont,
) {
  const f = boldFont || font;
  const t = pdfText(text);
  const w = textWidth(f, t, size);
  const x = BOX_L + (BOX_R - BOX_L - w) / 2;
  page.drawText(t, { x: Math.max(BOX_L + 2, x), y, size, font: f, color: ink });
}

function drawRight(
  page: PDFPage,
  font: PDFFont,
  text: string,
  rightX: number,
  y: number,
  size: number,
) {
  const t = pdfText(text);
  const w = textWidth(font, t, size);
  page.drawText(t, { x: rightX - w, y, size, font, color: ink });
}

function wrapLines(font: PDFFont, text: string, size: number, maxW: number): string[] {
  const raw = pdfText(text);
  if (!raw) return [];
  const words = raw.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (textWidth(font, trial, size) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [raw];
}

function addressLines(font: PDFFont, addr: string, maxW: number, size = 8): string[] {
  const parts = String(addr || '')
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  // Prefer keeping comma-joined chunks wrapped
  const joined = parts.join(', ');
  return wrapLines(font, joined, size, maxW);
}

async function tryEmbedLogo(
  doc: PDFDocument,
  logoUrl: string,
): Promise<PDFImage | null> {
  if (!logoUrl) return null;
  try {
    if (logoUrl.startsWith('data:image/')) {
      const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(logoUrl);
      if (!m) return null;
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (/png/i.test(m[1])) return await doc.embedPng(bytes);
      return await doc.embedJpg(bytes);
    }
  } catch {
    /* ignore logo failures */
  }
  return null;
}

function drawInvoiceCopy(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont },
  m: InvoicePrintModel,
  copyLabel: string,
  logo: PDFImage | null,
) {
  const { regular: font, bold: fontBold, italic: fontItalic } = fonts;

  // Outer box
  page.drawRectangle({
    x: BOX_L,
    y: BOX_B,
    width: BOX_R - BOX_L,
    height: BOX_T - BOX_B,
    borderColor: ink,
    borderWidth: thin,
  });

  // Copy label (top-right)
  drawRight(page, fontItalic, copyLabel, BOX_R - 8, BOX_T - 14, 9);

  // Logo (top-left) if present
  if (logo) {
    const maxH = 42;
    const maxW = 90;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo, {
      x: BOX_L + 6,
      y: BOX_T - 10 - h,
      width: w,
      height: h,
    });
  }

  // Title block
  let y = BOX_T - 28;
  drawCentered(page, fontBold, 'TAX INVOICE', y, 12);
  // underline title
  const tw = textWidth(fontBold, 'TAX INVOICE', 12);
  const tx = BOX_L + (BOX_R - BOX_L - tw) / 2;
  page.drawLine({
    start: { x: tx, y: y - 2 },
    end: { x: tx + tw, y: y - 2 },
    thickness: 0.8,
    color: ink,
  });

  y -= 16;
  drawCentered(page, fontBold, m.companyName || 'Company', y, 11);
  y -= 12;
  if (m.companyAddress) {
    drawCentered(page, font, m.companyAddress, y, 8);
    y -= 11;
  }
  const panUdyam = [
    m.pan ? `PAN : ${m.pan}` : '',
    m.udyamNo ? `Udyam No. : ${m.udyamNo}` : '',
  ]
    .filter(Boolean)
    .join(' ; ');
  if (panUdyam) {
    drawCentered(page, font, panUdyam, y, 8);
    y -= 11;
  }
  if (m.companyGstin) {
    drawCentered(page, fontBold, `GSTIN : ${m.companyGstin}`, y, 8);
    y -= 11;
  }
  const contact = [
    m.companyPhone ? `Tel. : ${m.companyPhone}` : '',
    m.companyEmail ? `email : ${m.companyEmail}` : '',
  ]
    .filter(Boolean)
    .join('   ');
  if (contact) {
    drawCentered(page, font, contact, y, 8);
    y -= 11;
  }
  if (m.tagline) {
    drawCentered(page, fontBold, m.tagline, y, 8);
    y -= 10;
  }

  const headerBottom = Math.min(y - 4, BOX_T - 110);
  const yMetaTop = headerBottom;
  drawHLine(page, yMetaTop);

  // Meta two-column block
  const metaRows: [string, string, string, string][] = [
    ['Invoice No.', m.invoiceNo, 'Transport', m.transportName || ''],
    ['Dated', fmtDateBusy(m.date), 'Vehicle No.', m.vehicleNo || ''],
    ['Place of Supply', m.placeOfSupply, 'Station', m.station || ''],
    ['Reverse Charge', m.reverseCharge || 'N', 'E-Way Bill No.', m.eWayBillNo || ''],
    ['GR/RR No.', m.grRrNo || '', 'Order No', m.quoteNo || ''],
  ];
  let my = yMetaTop - 12;
  for (const [lLab, lVal, rLab, rVal] of metaRows) {
    page.drawText(pdfText(lLab), { x: BOX_L + 4, y: my, size: 8, font, color: ink });
    page.drawText(pdfText(`: ${lVal}`), {
      x: BOX_L + 86,
      y: my,
      size: 8,
      font: fontBold,
      color: ink,
    });
    page.drawText(pdfText(rLab), { x: MID_X + 4, y: my, size: 8, font, color: ink });
    page.drawText(pdfText(`: ${rVal}`), {
      x: MID_X + 84,
      y: my,
      size: 8,
      font: fontBold,
      color: ink,
    });
    my -= 12;
  }
  drawVLine(page, MID_X, yMetaTop, my + 4);
  const yPartyTop = my + 2;
  drawHLine(page, yPartyTop);

  // Billed to / Shipped to
  page.drawText(pdfText('Billed to :'), {
    x: BOX_L + 4,
    y: yPartyTop - 12,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Shipped to :'), {
    x: MID_X + 4,
    y: yPartyTop - 12,
    size: 8,
    font: fontBold,
    color: ink,
  });

  const billAddr = addressLines(font, m.billingAddress, MID_X - BOX_L - 12, 8);
  const shipAddr = addressLines(
    font,
    m.shippingAddress || m.billingAddress,
    BOX_R - MID_X - 12,
    8,
  );
  let py = yPartyTop - 24;
  page.drawText(pdfText(m.customerName || ''), {
    x: BOX_L + 4,
    y: py,
    size: 9,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText(m.customerName || ''), {
    x: MID_X + 4,
    y: py,
    size: 9,
    font: fontBold,
    color: ink,
  });
  py -= 11;
  const addrRows = Math.max(billAddr.length, shipAddr.length, 2);
  for (let i = 0; i < addrRows; i++) {
    if (billAddr[i]) {
      page.drawText(pdfText(billAddr[i]), {
        x: BOX_L + 4,
        y: py,
        size: 8,
        font,
        color: ink,
      });
    }
    if (shipAddr[i]) {
      page.drawText(pdfText(shipAddr[i]), {
        x: MID_X + 4,
        y: py,
        size: 8,
        font,
        color: ink,
      });
    }
    py -= 11;
  }
  py -= 6;
  page.drawText(pdfText('State'), { x: BOX_L + 4, y: py, size: 8, font, color: ink });
  page.drawText(pdfText(`: ${m.partyState}`), {
    x: BOX_L + 86,
    y: py,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('State'), { x: MID_X + 4, y: py, size: 8, font, color: ink });
  page.drawText(pdfText(`: ${m.partyState}`), {
    x: MID_X + 84,
    y: py,
    size: 8,
    font: fontBold,
    color: ink,
  });
  py -= 12;
  page.drawText(pdfText('GSTIN / UIN'), {
    x: BOX_L + 4,
    y: py,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(pdfText(`: ${m.customerGstin || ''}`), {
    x: BOX_L + 86,
    y: py,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('GSTIN / UIN'), {
    x: MID_X + 4,
    y: py,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(pdfText(`: ${m.customerGstin || ''}`), {
    x: MID_X + 84,
    y: py,
    size: 8,
    font: fontBold,
    color: ink,
  });
  py -= 8;
  drawVLine(page, MID_X, yPartyTop, py);
  const yTableTop = py;
  drawHLine(page, yTableTop);

  // Table header
  const yHead = yTableTop - 14;
  page.drawText(pdfText('S.N.'), {
    x: COL.sn + 2,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Description of Goods'), {
    x: COL.desc + 2,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('HSN/SAC'), {
    x: COL.hsn + 2,
    y: yHead + 4,
    size: 7,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Code'), {
    x: COL.hsn + 2,
    y: yHead - 5,
    size: 7,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Qty.'), {
    x: COL.qty + 8,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Unit'), {
    x: COL.unit + 2,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Price'), {
    x: COL.price + 18,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Amount(Rs.)'), {
    x: COL.amt + 8,
    y: yHead,
    size: 8,
    font: fontBold,
    color: ink,
  });
  const yHeadBottom = yTableTop - 28;
  drawHLine(page, yHeadBottom);

  // Verticals for table (drawn after we know item bottom)
  let iy = yHeadBottom - 12;
  const itemTop = yHeadBottom;

  m.lines.forEach((line, idx) => {
    const { title, details } = splitDesc(line.description);
    const sn = `${idx + 1}.`;
    const hasQty = Number.isFinite(line.qty) && line.qty > 0 && line.rate > 0;
    page.drawText(pdfText(sn), {
      x: COL.sn + 4,
      y: iy,
      size: 8,
      font: fontBold,
      color: ink,
    });
    page.drawText(pdfText(title.slice(0, 48)), {
      x: COL.desc + 2,
      y: iy,
      size: 8,
      font: fontBold,
      color: ink,
    });
    page.drawText(pdfText(line.hsn || ''), {
      x: COL.hsn + 4,
      y: iy,
      size: 8,
      font,
      color: ink,
    });
    if (hasQty) {
      drawRight(page, font, fmtQty(line.qty), COL.qtyR - 4, iy, 8);
      page.drawText(pdfText(line.unit || ''), {
        x: COL.unit + 2,
        y: iy,
        size: 8,
        font,
        color: ink,
      });
      drawRight(page, font, fmtAmt(line.rate), COL.priceR - 4, iy, 8);
    } else {
      drawRight(page, font, '--', COL.qtyR - 4, iy, 8);
      page.drawText(pdfText('--'), {
        x: COL.unit + 2,
        y: iy,
        size: 8,
        font,
        color: ink,
      });
      drawRight(page, font, '--', COL.priceR - 4, iy, 8);
    }
    drawRight(page, font, fmtAmt(line.amount), COL.amtR - 4, iy, 8);
    iy -= 11;
    for (const d of details) {
      page.drawText(pdfText(d.slice(0, 52)), {
        x: COL.desc + 10,
        y: iy,
        size: 8,
        font: fontItalic,
        color: ink,
      });
      iy -= 11;
    }
    iy -= 2;
  });

  // Blank filler to keep tax block near bottom like Busy
  const taxBlockNeeded = 50 + buildTaxAddLines(m).length * 12;
  const hsnRows = buildHsnSummary(m.lines);
  const footerNeeded =
    18 + // words
    28 + // bank
    90 + // terms
    14 +
    hsnRows.length * 12 +
    24;
  const minItemBottom = BOX_B + footerNeeded + taxBlockNeeded + 8;
  if (iy > minItemBottom) iy = minItemBottom;

  const yItemsBottom = iy + 4;
  drawHLine(page, yItemsBottom);

  // Taxable + Add GST lines (right-aligned amounts)
  let ty = yItemsBottom - 14;
  drawRight(page, fontBold, fmtAmt(m.taxable), COL.amtR - 4, ty, 9);
  ty -= 14;
  const addLines = buildTaxAddLines(m);
  for (const a of addLines) {
    page.drawText(pdfText(`Add : ${a.label}`), {
      x: 250,
      y: ty,
      size: 8,
      font,
      color: ink,
    });
    page.drawText(pdfText(`@   ${a.rate.toFixed(2)} %`), {
      x: 390,
      y: ty,
      size: 8,
      font,
      color: ink,
    });
    drawRight(page, font, fmtAmt(a.amount), COL.amtR - 4, ty, 9);
    ty -= 12;
  }
  const yTaxBottom = ty + 4;
  drawHLine(page, yTaxBottom);
  drawVLine(page, COL.amt, yItemsBottom, yTaxBottom);

  // Grand total
  let gy = yTaxBottom - 14;
  page.drawText(pdfText('Grand Total'), {
    x: 250,
    y: gy,
    size: 9,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText(`${fmtQty(m.totalQty)} Units`), {
    x: 340,
    y: gy,
    size: 8,
    font: fontBold,
    color: ink,
  });
  drawRight(page, fontBold, fmtAmt(m.total), COL.amtR - 4, gy, 10);
  const yGrandBottom = gy - 10;
  drawHLine(page, yGrandBottom);
  drawVLine(page, COL.amt, yTaxBottom, yGrandBottom);

  // Column verticals through header+items
  for (const x of [COL.snR, COL.descR, COL.hsnR, COL.qtyR, COL.unitR, COL.priceR, COL.amt]) {
    drawVLine(page, x, yTableTop, yItemsBottom);
  }
  // Through header only extras already covered; sn through grand via amt

  // HSN summary (left)
  let hy = yGrandBottom - 14;
  const hsnHeader =
    m.taxMode === 'cgst_sgst'
      ? 'HSN/SAC  Tax Rate  Taxable Amt.  CGST Amt.  SGST Amt.  Total Tax'
      : 'HSN/SAC  Tax Rate  Taxable Amt.  IGST Amt.  Total Tax';
  page.drawText(pdfText(hsnHeader), {
    x: BOX_L + 4,
    y: hy,
    size: 7,
    font: fontBold,
    color: ink,
  });
  hy -= 11;
  for (const row of hsnRows) {
    const body =
      m.taxMode === 'cgst_sgst'
        ? `${row.hsn.padEnd(8)} ${String(row.rate).padStart(2)}%    ${fmtAmt(row.taxable).padStart(10)}  ${fmtAmt(row.cgst).padStart(9)}  ${fmtAmt(row.sgst).padStart(9)}  ${fmtAmt(row.tax).padStart(9)}`
        : `${row.hsn.padEnd(8)} ${String(row.rate).padStart(2)}%    ${fmtAmt(row.taxable).padStart(10)}  ${fmtAmt(row.igst).padStart(9)}  ${fmtAmt(row.tax).padStart(9)}`;
    page.drawText(pdfText(body), {
      x: BOX_L + 4,
      y: hy,
      size: 7,
      font,
      color: ink,
    });
    hy -= 11;
  }
  const taxTot =
    m.taxMode === 'cgst_sgst'
      ? `Total          ${fmtAmt(m.taxable).padStart(10)}  ${fmtAmt(m.cgst).padStart(9)}  ${fmtAmt(m.sgst).padStart(9)}  ${fmtAmt(m.gst).padStart(9)}`
      : `Total          ${fmtAmt(m.taxable).padStart(10)}  ${fmtAmt(m.igst).padStart(9)}  ${fmtAmt(m.gst).padStart(9)}`;
  page.drawText(pdfText(taxTot), {
    x: BOX_L + 4,
    y: hy,
    size: 7,
    font: fontBold,
    color: ink,
  });
  hy -= 14;

  // Amount in words
  const words = amountInWordsInr(m.total);
  page.drawText(pdfText(words), {
    x: BOX_L + 4,
    y: hy,
    size: 8,
    font: fontBold,
    color: ink,
  });
  hy -= 8;
  drawHLine(page, hy);
  const yBankTop = hy;

  // Bank details
  hy -= 12;
  const bankLine1 = `Bank Details: NAME ; ${m.bankAccountName || m.companyName}${
    m.bankAccountNo ? `,                        A/C No.` : ''
  }`;
  page.drawText(pdfText(bankLine1), {
    x: BOX_L + 4,
    y: hy,
    size: 8,
    font,
    color: ink,
  });
  hy -= 11;
  const bankLine2 = [
    m.bankAccountNo || '',
    m.bankIfsc ? `IFSC Code ; ${m.bankIfsc}` : '',
    m.bankName ? `BANK NAME ; ${m.bankName}` : '',
  ]
    .filter(Boolean)
    .join('   ');
  if (bankLine2) {
    page.drawText(pdfText(bankLine2), {
      x: BOX_L + 80,
      y: hy,
      size: 8,
      font,
      color: ink,
    });
  }
  hy -= 8;
  drawHLine(page, hy);
  const yTermsTop = hy;

  // Terms (left) + signature (right)
  const sigX = 260.3;
  drawVLine(page, sigX, yTermsTop, BOX_B);

  page.drawText(pdfText('Terms & Conditions'), {
    x: BOX_L + 4,
    y: yTermsTop - 12,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawLine({
    start: { x: BOX_L + 4, y: yTermsTop - 14 },
    end: { x: BOX_L + 88, y: yTermsTop - 14 },
    thickness: 0.5,
    color: ink,
  });
  page.drawText(pdfText("Receiver's Signature :"), {
    x: sigX + 4,
    y: yTermsTop - 12,
    size: 8,
    font,
    color: ink,
  });

  let ty2 = yTermsTop - 26;
  page.drawText(pdfText('E.& O.E.'), {
    x: BOX_L + 4,
    y: ty2,
    size: 8,
    font,
    color: ink,
  });
  ty2 -= 12;
  m.invoiceTerms.forEach((term, i) => {
    const label = `${i + 1}. ${term}`;
    const wrapped = wrapLines(font, label, 7, sigX - BOX_L - 10);
    for (const w of wrapped) {
      page.drawText(pdfText(w), {
        x: BOX_L + 4,
        y: ty2,
        size: 7,
        font,
        color: ink,
      });
      ty2 -= 10;
    }
  });

  page.drawText(pdfText(`For ${m.companyName}`), {
    x: sigX + 40,
    y: yTermsTop - 50,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(pdfText('Authorised Signatory'), {
    x: sigX + 80,
    y: BOX_B + 10,
    size: 8,
    font: fontBold,
    color: ink,
  });

  // Quiet unused
  void yBankTop;
  void itemTop;
}

export async function buildTaxInvoicePdfBytes(
  state: AppState,
  inv: BillingInvoice,
): Promise<Uint8Array> {
  const m = invoicePrintModel(state, inv);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const logo = await tryEmbedLogo(doc, m.logoUrl);
  const fonts = { regular: font, bold: fontBold, italic: fontItalic };

  for (const copy of ['Original Copy', 'Duplicate Copy'] as const) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawInvoiceCopy(page, fonts, m, copy, logo);
  }

  return doc.save();
}

export async function downloadTaxInvoicePdf(
  state: AppState,
  inv: BillingInvoice,
): Promise<void> {
  const bytes = await buildTaxInvoicePdfBytes(state, inv);
  downloadBlob(
    `tax-invoice-${inv.invoiceNo || 'bill'}.pdf`,
    bytes,
    'application/pdf',
  );
}

export async function buildTaxInvoiceExcelBytes(
  state: AppState,
  inv: BillingInvoice,
): Promise<Uint8Array> {
  const m = invoicePrintModel(state, inv);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Tax Invoice');
  let r = 1;
  const put = (label: string, value: string | number) => {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 2).value = value;
    r += 1;
  };
  ws.getCell(r, 1).value = 'TAX INVOICE';
  ws.getCell(r, 1).font = { bold: true, size: 14 };
  r += 2;
  put('Company', m.companyName);
  put('Company GST', m.companyGstin);
  put('PAN', m.pan);
  put('Udyam', m.udyamNo);
  put('Bill no', m.invoiceNo);
  put('Date', m.date);
  put('Quote / Order no', m.quoteNo);
  put('Customer', m.customerName);
  put('Customer GST', m.customerGstin);
  put('Billing address', m.billingAddress);
  put('Shipping address', m.shippingAddress);
  put('Place of supply', m.placeOfSupply);
  put('E-way bill', m.eWayBillNo);
  put('Vehicle no', m.vehicleNo);
  put('Transport', m.transportName);
  put('Station', m.station);
  put('Reverse charge', m.reverseCharge);
  put('GR/RR No.', m.grRrNo);
  r += 1;

  const headers = [
    '#',
    'Description',
    'HSN',
    'Qty',
    'Unit',
    'Rate',
    'Taxable',
    'GST%',
    'CGST',
    'SGST',
    'IGST',
    'Total',
  ];
  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  r += 1;
  m.lines.forEach((line, i) => {
    const row = [
      i + 1,
      line.description,
      line.hsn,
      line.qty,
      line.unit,
      line.rate,
      line.amount,
      line.gstPercent,
      line.cgst,
      line.sgst,
      line.igst,
      line.total,
    ];
    row.forEach((v, c) => {
      ws.getCell(r, c + 1).value = v;
    });
    r += 1;
  });
  r += 1;
  put('Taxable', m.taxable);
  put('CGST', m.cgst);
  put('SGST', m.sgst);
  put('IGST', m.igst);
  put('Total tax', m.gst);
  put('Grand total', m.total);
  put('Amount in words', amountInWordsInr(m.total));
  put('Tax mode', m.taxMode === 'cgst_sgst' ? 'CGST+SGST' : 'IGST');

  const hsn = buildHsnSummary(m.lines);
  r += 1;
  ws.getCell(r, 1).value = 'HSN summary';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  ['HSN', 'Rate%', 'Taxable', 'CGST', 'SGST', 'IGST', 'Tax'].forEach((h, i) => {
    ws.getCell(r, i + 1).value = h;
    ws.getCell(r, i + 1).font = { bold: true };
  });
  r += 1;
  for (const row of hsn) {
    [row.hsn, row.rate, row.taxable, row.cgst, row.sgst, row.igst, row.tax].forEach(
      (v, c) => {
        ws.getCell(r, c + 1).value = v;
      },
    );
    r += 1;
  }

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 42;
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export async function downloadTaxInvoiceExcel(
  state: AppState,
  inv: BillingInvoice,
): Promise<void> {
  const bytes = await buildTaxInvoiceExcelBytes(state, inv);
  downloadBlob(
    `tax-invoice-${inv.invoiceNo || 'bill'}.xlsx`,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}
