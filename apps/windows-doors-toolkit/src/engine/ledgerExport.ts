import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type {
  AppState,
  ClientAccount,
  VendorLabourMember,
  VendorLabourPayout,
  VendorLabourTeam,
} from '../types';
import { formatInr } from './calcs';
import {
  labourBudgetLeft,
  labourEarned,
  labourPayable,
  summarizeClientAccount,
  summarizeVendorTeam,
} from './ledgers';

const MARGIN = 48;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY = 10;
const SMALL = 9;

function pdfSafe(text: string): string {
  return String(text ?? '')
    .replace(/\u20b9/g, 'Rs.')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
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

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const raw = pdfSafe(text).replace(/\r/g, '');
  if (!raw) return [''];
  const words = raw.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const out: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const trial = `${line} ${words[i]}`;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) line = trial;
    else {
      out.push(line);
      line = words[i];
    }
  }
  out.push(line);
  return out;
}

type DrawCtx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  y: number;
};

function newPage(ctx: DrawCtx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function ensureSpace(ctx: DrawCtx, need: number): void {
  if (ctx.y - need < MARGIN) newPage(ctx);
}

function drawText(
  ctx: DrawCtx,
  text: string,
  opts: { size?: number; bold?: boolean } = {},
): void {
  const size = opts.size ?? BODY;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const lines = wrapText(font, text, size, CONTENT_W);
  for (const line of lines) {
    ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - size,
      size,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
    ctx.y -= size + 3;
  }
}

function drawRule(ctx: DrawCtx): void {
  ensureSpace(ctx, 10);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: rgb(0.04, 0.23, 0.36),
  });
  ctx.y -= 10;
}

async function makePdfCtx(): Promise<DrawCtx> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  return { doc, page, font, fontBold, y: PAGE_H - MARGIN };
}

function companyHeader(ctx: DrawCtx, state: AppState, title: string): void {
  drawText(ctx, state.business.companyName || 'Windows & Doors', { size: 14, bold: true });
  if (state.business.address) drawText(ctx, state.business.address, { size: SMALL });
  const contact = [state.business.phone, state.business.email].filter(Boolean).join(' · ');
  if (contact) drawText(ctx, contact, { size: SMALL });
  if (state.business.gstin) drawText(ctx, `GST ${state.business.gstin}`, { size: SMALL, bold: true });
  ctx.y -= 4;
  drawText(ctx, title, { size: 12, bold: true });
  drawRule(ctx);
}

export async function buildVendorLedgerPdfBytes(
  state: AppState,
  team: VendorLabourTeam,
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
): Promise<Uint8Array> {
  const ctx = await makePdfCtx();
  const sum = summarizeVendorTeam(team, members, payouts);
  companyHeader(ctx, state, 'Vendor / Labour Team Ledger');
  drawText(ctx, `Vendor: ${team.vendorName}  (handle: ${team.handle})`, { bold: true });
  drawText(ctx, `Team leader: ${team.teamLeaderName || '—'} · Phone: ${team.phone || '—'}`);
  if (team.note) drawText(ctx, `Note: ${team.note}`, { size: SMALL });
  ctx.y -= 4;
  drawText(
    ctx,
    `Members ${sum.memberCount} · Advances ${formatInr(sum.advances)} · Quote area ${formatInr(sum.quoteArea)} · Earned ${formatInr(sum.earned)} · Paid ${formatInr(sum.paidOut)} · Payable ${formatInr(sum.payable)}`,
    { size: SMALL },
  );
  drawRule(ctx);
  for (const m of sum.members) {
    drawText(
      ctx,
      `${m.name || 'Labour'} (${m.role}) · ${m.workSet || '—'} · rate ${formatInr(m.rate)}/${m.rateUnit} × ${m.units}`,
      { bold: true },
    );
    drawText(
      ctx,
      `Advance ${formatInr(m.advance)} · Extra ${formatInr(m.extraPayout)} · Budget ${formatInr(m.budget)} · Quote area ${formatInr(m.quoteAreaAmount)} · Earned ${formatInr(labourEarned(m))} · Payable ${formatInr(labourPayable(m, sum.payouts))} · Budget left ${formatInr(labourBudgetLeft(m))}`,
      { size: SMALL },
    );
    if (m.note) drawText(ctx, m.note, { size: SMALL });
    ctx.y -= 4;
  }
  if (sum.payouts.length) {
    drawRule(ctx);
    drawText(ctx, 'Payout lines', { bold: true });
    for (const p of sum.payouts) {
      const lab = sum.members.find((m) => m.id === p.labourId)?.name || p.labourId;
      drawText(
        ctx,
        `${p.date} · ${lab} · ${p.kind} · ${formatInr(p.amount)}${p.note ? ` · ${p.note}` : ''}`,
        { size: SMALL },
      );
    }
  }
  return ctx.doc.save();
}

export async function buildVendorLedgerExcelBytes(
  state: AppState,
  team: VendorLabourTeam,
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
): Promise<Uint8Array> {
  const sum = summarizeVendorTeam(team, members, payouts);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Windows & Doors Toolkit';
  const ws = wb.addWorksheet('Labour ledger');
  let r = 1;
  ws.getCell(r, 1).value = state.business.companyName || 'Windows & Doors';
  ws.getCell(r, 1).font = { bold: true, size: 14 };
  r += 1;
  ws.getCell(r, 1).value = 'Vendor / Labour Team Ledger';
  ws.getCell(r, 1).font = { bold: true };
  r += 2;
  const meta = [
    ['Vendor', team.vendorName],
    ['Handle', team.handle],
    ['Team leader', team.teamLeaderName],
    ['Phone', team.phone],
    ['Advances', sum.advances],
    ['Quote area', sum.quoteArea],
    ['Earned', sum.earned],
    ['Paid out', sum.paidOut],
    ['Payable', sum.payable],
  ];
  for (const [k, v] of meta) {
    ws.getCell(r, 1).value = k;
    ws.getCell(r, 2).value = v;
    r += 1;
  }
  r += 1;
  const headers = [
    'Name',
    'Role',
    'Work set',
    'Rate',
    'Unit',
    'Units',
    'Advance',
    'Extra',
    'Budget',
    'Quote area',
    'Earned',
    'Payable',
    'Note',
  ];
  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  r += 1;
  for (const m of sum.members) {
    const row = [
      m.name,
      m.role,
      m.workSet,
      m.rate,
      m.rateUnit,
      m.units,
      m.advance,
      m.extraPayout,
      m.budget,
      m.quoteAreaAmount,
      labourEarned(m),
      labourPayable(m, sum.payouts),
      m.note,
    ];
    row.forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  r += 1;
  ws.getCell(r, 1).value = 'Payouts';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  ['Date', 'Labour', 'Kind', 'Amount', 'Note'].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  r += 1;
  for (const p of sum.payouts) {
    const lab = sum.members.find((m) => m.id === p.labourId)?.name || p.labourId;
    [p.date, lab, p.kind, p.amount, p.note].forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  ws.getColumn(1).width = 18;
  ws.getColumn(3).width = 28;
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export async function downloadVendorLedgerPdf(
  state: AppState,
  team: VendorLabourTeam,
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
): Promise<void> {
  const bytes = await buildVendorLedgerPdfBytes(state, team, members, payouts);
  downloadBlob(`vendor-labour-${team.handle || team.id}.pdf`, bytes, 'application/pdf');
}

export async function downloadVendorLedgerExcel(
  state: AppState,
  team: VendorLabourTeam,
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
): Promise<void> {
  const bytes = await buildVendorLedgerExcelBytes(state, team, members, payouts);
  downloadBlob(
    `vendor-labour-${team.handle || team.id}.xlsx`,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

function paymentDetail(p: ClientAccount['payments'][number]): string {
  if (p.type === 'cash') return `Cash · ${p.cashName || '—'}`;
  if (p.type === 'bank')
    return `Bank · ${p.bankAccountName || '—'} / ${p.bankAccountNo || '—'}`;
  if (p.type === 'upi') return `UPI · ${p.upiId || '—'}`;
  return p.type;
}

export async function buildClientStatementPdfBytes(
  state: AppState,
  account: ClientAccount,
): Promise<Uint8Array> {
  const ctx = await makePdfCtx();
  const sum = summarizeClientAccount(account);
  companyHeader(ctx, state, 'Client Account Statement');
  drawText(ctx, `${account.customerName}  (handle: ${account.handle})`, { bold: true });
  drawText(
    ctx,
    `Phone: ${account.phone || '—'} · Email: ${account.email || '—'} · GSTIN: ${account.gstin || '—'}`,
  );
  if (account.siteAddress) drawText(ctx, `Site: ${account.siteAddress}`, { size: SMALL });
  ctx.y -= 4;
  drawText(
    ctx,
    `Works ${formatInr(sum.worksTotal)} · Charges ${formatInr(sum.chargesTotal)} · Discounts ${formatInr(sum.discountTotal)} · Payments ${formatInr(sum.paymentsTotal)} · Advance left ${formatInr(sum.advanceRemaining)} · Balance ${formatInr(sum.balance)}`,
    { size: SMALL },
  );
  drawRule(ctx);
  drawText(ctx, 'Works / quotes', { bold: true });
  for (const w of account.works) {
    drawText(
      ctx,
      `${w.finalizedAt.slice(0, 10)} · ${w.quoteNo} · ${w.projectName || '—'} · ${w.material} · ${formatInr(w.quoteAmount)} (taxable ${formatInr(w.taxableAmount)} + GST ${formatInr(w.gstAmount)}) · advance ${formatInr(w.advanceRecorded)} left ${formatInr(w.advanceRemaining)}`,
      { size: SMALL },
    );
  }
  if (account.charges.length) {
    ctx.y -= 4;
    drawText(ctx, 'Extra charges', { bold: true });
    for (const c of account.charges) {
      drawText(ctx, `${c.date} · ${c.description} · ${formatInr(c.amount)}`, { size: SMALL });
    }
  }
  if (account.discounts.length) {
    ctx.y -= 4;
    drawText(ctx, 'Final discounts', { bold: true });
    for (const d of account.discounts) {
      const label =
        d.kind === 'percent'
          ? `${d.value}%`
          : d.kind === 'gst_off'
            ? 'GST off'
            : formatInr(d.value);
      drawText(ctx, `${d.appliedAt.slice(0, 10)} · ${d.kind} · ${label}${d.note ? ` · ${d.note}` : ''}`, {
        size: SMALL,
      });
    }
  }
  if (account.payments.length) {
    ctx.y -= 4;
    drawText(ctx, 'Payments', { bold: true });
    for (const p of account.payments) {
      drawText(
        ctx,
        `${p.date} · ${formatInr(p.amount)} · ${paymentDetail(p)}${p.note ? ` · ${p.note}` : ''}`,
        { size: SMALL },
      );
    }
  }
  drawRule(ctx);
  drawText(ctx, `Net due ${formatInr(sum.netDue)} · Balance due ${formatInr(sum.balance)}`, {
    bold: true,
  });
  return ctx.doc.save();
}

export async function buildClientStatementExcelBytes(
  state: AppState,
  account: ClientAccount,
): Promise<Uint8Array> {
  const sum = summarizeClientAccount(account);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Windows & Doors Toolkit';
  const ws = wb.addWorksheet('Client statement');
  let r = 1;
  ws.getCell(r, 1).value = state.business.companyName || 'Windows & Doors';
  ws.getCell(r, 1).font = { bold: true, size: 14 };
  r += 1;
  ws.getCell(r, 1).value = 'Client Account Statement';
  ws.getCell(r, 1).font = { bold: true };
  r += 2;
  const meta: [string, string | number][] = [
    ['Customer', account.customerName],
    ['Handle', account.handle],
    ['Phone', account.phone],
    ['Email', account.email],
    ['GSTIN', account.gstin],
    ['Site', account.siteAddress],
    ['Works', sum.worksTotal],
    ['Charges', sum.chargesTotal],
    ['Discounts', sum.discountTotal],
    ['Payments', sum.paymentsTotal],
    ['Advance remaining', sum.advanceRemaining],
    ['Balance', sum.balance],
  ];
  for (const [k, v] of meta) {
    ws.getCell(r, 1).value = k;
    ws.getCell(r, 2).value = v;
    r += 1;
  }
  r += 1;
  ws.getCell(r, 1).value = 'Works';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  ['Date', 'Quote', 'Project', 'Material', 'Amount', 'Taxable', 'GST', 'Advance', 'Advance left'].forEach(
    (h, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = h;
      cell.font = { bold: true };
    },
  );
  r += 1;
  for (const w of account.works) {
    [
      w.finalizedAt.slice(0, 10),
      w.quoteNo,
      w.projectName,
      w.material,
      w.quoteAmount,
      w.taxableAmount,
      w.gstAmount,
      w.advanceRecorded,
      w.advanceRemaining,
    ].forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  r += 1;
  ws.getCell(r, 1).value = 'Charges';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  for (const c of account.charges) {
    [c.date, c.description, c.amount].forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  r += 1;
  ws.getCell(r, 1).value = 'Discounts';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  for (const d of account.discounts) {
    [d.appliedAt.slice(0, 10), d.kind, d.value, d.note].forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  r += 1;
  ws.getCell(r, 1).value = 'Payments';
  ws.getCell(r, 1).font = { bold: true };
  r += 1;
  ['Date', 'Amount', 'Type', 'Detail', 'Note'].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  r += 1;
  for (const p of account.payments) {
    [p.date, p.amount, p.type, paymentDetail(p), p.note].forEach((v, i) => {
      ws.getCell(r, i + 1).value = v;
    });
    r += 1;
  }
  ws.getColumn(1).width = 16;
  ws.getColumn(2).width = 28;
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export async function downloadClientStatementPdf(
  state: AppState,
  account: ClientAccount,
): Promise<void> {
  const bytes = await buildClientStatementPdfBytes(state, account);
  downloadBlob(`client-statement-${account.handle || account.id}.pdf`, bytes, 'application/pdf');
}

export async function downloadClientStatementExcel(
  state: AppState,
  account: ClientAccount,
): Promise<void> {
  const bytes = await buildClientStatementExcelBytes(state, account);
  downloadBlob(
    `client-statement-${account.handle || account.id}.xlsx`,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}
