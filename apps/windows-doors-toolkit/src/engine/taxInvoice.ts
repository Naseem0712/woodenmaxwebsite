/**
 * Tax Invoice (Bill) — PDF + Excel export with GST breakup.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import type { AppState, BillingInvoice, BillingInvoiceLine } from '../types';
import { formatInr } from './calcs';
import {
  placeOfSupplyCode,
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
    inv.placeOfSupply ||
    placeOfSupplyCode(sellerGstin, inv.customerGstin);
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

export function invoicePrintModel(state: AppState, inv: BillingInvoice) {
  const b = ensureBusinessBillSeries(state.business);
  const computed = recomputeInvoiceTaxes(inv, b.gstin);
  return {
    companyName: b.companyName,
    companyAddress: b.address,
    companyPhone: b.phone,
    companyEmail: b.email,
    companyGstin: b.gstin,
    customerName: computed.customer,
    customerPhone: computed.phone,
    customerGstin: computed.customerGstin || '',
    billingAddress: computed.billingAddress || '',
    shippingAddress: computed.shippingAddress || '',
    placeOfSupply: computed.placeOfSupply || '—',
    eWayBillNo: computed.eWayBillNo || '',
    vehicleNo: computed.vehicleNo || '',
    transportName: computed.transportName || '',
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
  };
}

export async function buildTaxInvoicePdfBytes(
  state: AppState,
  inv: BillingInvoice,
): Promise<Uint8Array> {
  const m = invoicePrintModel(state, inv);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 40;
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const ensure = (need: number) => {
    if (y - need < margin) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  };
  const text = (s: string, opts: { bold?: boolean; size?: number; x?: number } = {}) => {
    const size = opts.size ?? 10;
    ensure(size + 4);
    page.drawText(pdfText(s), {
      x: opts.x ?? margin,
      y: y - size,
      size,
      font: opts.bold ? fontBold : font,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= size + 3;
  };
  const pair = (label: string, value: string) => {
    ensure(14);
    page.drawText(pdfText(label), {
      x: margin,
      y: y - 10,
      size: 9,
      font,
      color: rgb(0.35, 0.4, 0.48),
    });
    page.drawText(pdfText(value || '-'), {
      x: margin + 110,
      y: y - 10,
      size: 10,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 14;
  };

  text('TAX INVOICE', { bold: true, size: 16 });
  text(m.companyName, { bold: true, size: 12 });
  if (m.companyAddress) text(m.companyAddress, { size: 9 });
  pair('Company GST', m.companyGstin || '—');
  pair('Bill no', m.invoiceNo);
  pair('Date', m.date);
  if (m.quoteNo) pair('Quote no', m.quoteNo);
  y -= 4;
  pair('Customer', m.customerName || '—');
  pair('Customer GST', m.customerGstin || '—');
  pair('Billing address', m.billingAddress || '—');
  pair('Shipping address', m.shippingAddress || '—');
  pair('Place of supply', m.placeOfSupply);
  if (m.eWayBillNo) pair('E-way bill', m.eWayBillNo);
  if (m.vehicleNo) pair('Vehicle no', m.vehicleNo);
  if (m.transportName) pair('Transport', m.transportName);
  y -= 6;

  // Table header
  ensure(18);
  const cols = [
    { x: margin, w: 22, label: '#' },
    { x: margin + 22, w: 180, label: 'Description' },
    { x: margin + 202, w: 40, label: 'HSN' },
    { x: margin + 242, w: 28, label: 'Qty' },
    { x: margin + 270, w: 50, label: 'Rate' },
    { x: margin + 320, w: 55, label: 'Taxable' },
    { x: margin + 375, w: 36, label: 'GST%' },
    { x: margin + 411, w: 70, label: 'Tax' },
    { x: margin + 481, w: 70, label: 'Total' },
  ];
  for (const c of cols) {
    page.drawText(c.label, {
      x: c.x,
      y: y - 9,
      size: 8,
      font: fontBold,
      color: rgb(0.04, 0.23, 0.36),
    });
  }
  y -= 14;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageW - margin, y },
    thickness: 1,
    color: rgb(0.04, 0.23, 0.36),
  });
  y -= 8;

  m.lines.forEach((line, i) => {
    ensure(28);
    const tax = money(line.cgst + line.sgst + line.igst);
    const vals = [
      String(i + 1),
      line.description.slice(0, 42),
      line.hsn || '',
      String(line.qty),
      formatInr(line.rate),
      formatInr(line.amount),
      `${line.gstPercent}%`,
      formatInr(tax),
      formatInr(line.total),
    ];
    vals.forEach((v, idx) => {
      page.drawText(pdfText(v), {
        x: cols[idx].x,
        y: y - 9,
        size: 8,
        font,
        color: rgb(0.06, 0.09, 0.16),
      });
    });
    y -= 16;
  });

  y -= 8;
  text('Taxable value', { bold: true });
  pair('Taxable', formatInr(m.taxable));
  if (m.taxMode === 'cgst_sgst') {
    pair('CGST', formatInr(m.cgst));
    pair('SGST', formatInr(m.sgst));
  } else {
    pair('IGST', formatInr(m.igst));
  }
  pair('Total tax', formatInr(m.gst));
  pair('Grand total', formatInr(m.total));
  if (m.note) {
    y -= 4;
    text('Notes', { bold: true, size: 9 });
    text(m.note, { size: 9 });
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
  put('Bill no', m.invoiceNo);
  put('Date', m.date);
  put('Quote no', m.quoteNo);
  put('Customer', m.customerName);
  put('Customer GST', m.customerGstin);
  put('Billing address', m.billingAddress);
  put('Shipping address', m.shippingAddress);
  put('Place of supply', m.placeOfSupply);
  put('E-way bill', m.eWayBillNo);
  put('Vehicle no', m.vehicleNo);
  put('Transport', m.transportName);
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
  put('Tax mode', m.taxMode === 'cgst_sgst' ? 'CGST+SGST' : 'IGST');

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
