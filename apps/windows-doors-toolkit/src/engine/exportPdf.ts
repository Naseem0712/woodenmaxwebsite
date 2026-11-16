import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ExportDocument, ExportOpeningBlock, RateMode } from './exportDocs';

const MARGIN = 48;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE = 12;
const TITLE_SIZE = 14;
const BODY = 10;
const SMALL = 9;

/** Helvetica/WinAnsi cannot encode ₹ and similar — normalize for PDF text. */
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
  const paragraphs = raw.split('\n');
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const trial = `${line} ${words[i]}`;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        line = trial;
      } else {
        out.push(line);
        line = words[i];
      }
    }
    out.push(line);
  }
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
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxWidth?: number } = {},
): void {
  const size = opts.size ?? BODY;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const color = opts.color ?? rgb(0.06, 0.09, 0.16);
  const maxWidth = opts.maxWidth ?? CONTENT_W;
  const lines = wrapText(font, text, size, maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - size,
      size,
      font,
      color,
    });
    ctx.y -= size + 3;
  }
}

function drawRule(ctx: DrawCtx): void {
  ensureSpace(ctx, 10);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1.2,
    color: rgb(0.04, 0.23, 0.36),
  });
  ctx.y -= 10;
}

function drawDotRow(ctx: DrawCtx, label: string, value: string): void {
  ensureSpace(ctx, LINE + 6);
  const size = BODY;
  const safeValue = pdfSafe(value);
  const valueWidth = ctx.fontBold.widthOfTextAtSize(safeValue, size);
  const labelMax = CONTENT_W - valueWidth - 24;
  const labelLines = wrapText(ctx.font, label, size, Math.max(80, labelMax));
  const first = labelLines[0] || '';
  ctx.page.drawText(first, {
    x: MARGIN,
    y: ctx.y - size,
    size,
    font: ctx.font,
    color: rgb(0.06, 0.09, 0.16),
  });
  ctx.page.drawText(safeValue, {
    x: PAGE_W - MARGIN - valueWidth,
    y: ctx.y - size,
    size,
    font: ctx.fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  // dotted leader
  const labelW = ctx.font.widthOfTextAtSize(first, size);
  const startX = MARGIN + labelW + 6;
  const endX = PAGE_W - MARGIN - valueWidth - 6;
  if (endX > startX + 8) {
    ctx.page.drawLine({
      start: { x: startX, y: ctx.y - size + 2 },
      end: { x: endX, y: ctx.y - size + 2 },
      thickness: 0.6,
      color: rgb(0.58, 0.64, 0.72),
      dashArray: [1, 2],
    });
  }
  ctx.y -= size + 4;
  for (let i = 1; i < labelLines.length; i++) {
    drawText(ctx, labelLines[i], { size });
  }
}

function drawLetterhead(ctx: DrawCtx, doc: ExportDocument): void {
  const lh = doc.letterhead;
  if (!lh) {
    drawText(ctx, doc.title, { size: TITLE_SIZE, bold: true, color: rgb(0.04, 0.23, 0.36) });
    if (doc.subtitle) drawText(ctx, doc.subtitle, { size: SMALL, color: rgb(0.39, 0.45, 0.55) });
    for (const m of doc.meta) drawText(ctx, `${m.label}: ${m.value}`, { size: SMALL });
    ctx.y -= 4;
    drawRule(ctx);
    return;
  }

  const topY = ctx.y;
  // Left company block
  drawText(ctx, lh.companyName || '—', {
    size: 16,
    bold: true,
    color: rgb(0.04, 0.23, 0.36),
    maxWidth: CONTENT_W * 0.58,
  });
  if (lh.address) drawText(ctx, lh.address, { size: SMALL, color: rgb(0.29, 0.33, 0.39) });
  const contact = [lh.phone, lh.email, lh.website].filter(Boolean).join(' · ');
  if (contact) drawText(ctx, contact, { size: SMALL, color: rgb(0.29, 0.33, 0.39) });
  if (lh.gstin) drawText(ctx, `GST ${lh.gstin}`, { size: SMALL, bold: true });

  // Right doc meta (quote no + date only for quotes)
  const rightLines: string[] = [];
  if (doc.kind === 'quote') {
    rightLines.push('Quotation');
    const qd = [lh.quoteNo, lh.quoteDate].filter(Boolean).join(' · ');
    if (qd) rightLines.push(qd);
  } else {
    rightLines.push(doc.title || 'Document');
    if (doc.subtitle) rightLines.push(doc.subtitle);
    const qd = [lh.quoteNo, lh.quoteDate].filter(Boolean).join(' · ');
    if (qd) rightLines.push(qd);
    rightLines.push(doc.rateMode === 'include' ? 'With rates' : 'No rates');
  }

  let ry = topY;
  for (let i = 0; i < rightLines.length; i++) {
    const size = i === 0 ? 12 : SMALL;
    const font = i === 0 ? ctx.fontBold : ctx.font;
    const t = rightLines[i];
    const w = font.widthOfTextAtSize(t, size);
    ctx.page.drawText(t, {
      x: PAGE_W - MARGIN - w,
      y: ry - size,
      size,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
    ry -= size + 4;
  }

  ctx.y = Math.min(ctx.y, ry) - 6;
  drawRule(ctx);

  // Customer / site
  ensureSpace(ctx, 40);
  const colW = CONTENT_W / 2 - 8;
  const partyTop = ctx.y;
  ctx.page.drawText('CUSTOMER', {
    x: MARGIN,
    y: partyTop - SMALL,
    size: 8,
    font: ctx.font,
    color: rgb(0.39, 0.45, 0.55),
  });
  ctx.page.drawText('SITE', {
    x: MARGIN + colW + 16,
    y: partyTop - SMALL,
    size: 8,
    font: ctx.font,
    color: rgb(0.39, 0.45, 0.55),
  });
  const custName = lh.customerName || '—';
  const siteName = lh.siteAddress || '—';
  ctx.page.drawText(custName.slice(0, 60), {
    x: MARGIN,
    y: partyTop - SMALL - 14,
    size: BODY,
    font: ctx.fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  ctx.page.drawText(siteName.slice(0, 60), {
    x: MARGIN + colW + 16,
    y: partyTop - SMALL - 14,
    size: BODY,
    font: ctx.fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  let partyBottom = partyTop - SMALL - 14 - BODY;
  if (lh.customerPhone) {
    ctx.page.drawText(lh.customerPhone, {
      x: MARGIN,
      y: partyBottom - 12,
      size: SMALL,
      font: ctx.font,
      color: rgb(0.29, 0.33, 0.39),
    });
    partyBottom -= 14;
  }
  ctx.y = partyBottom - 10;
}

function drawOpeningBlock(ctx: DrawCtx, block: ExportOpeningBlock, kind: ExportDocument['kind']): void {
  ensureSpace(ctx, 56);
  const boxTop = ctx.y;
  const narrative = block.narrativeLines?.length ? block.narrativeLines : block.lines;
  for (let i = 0; i < narrative.length; i++) {
    drawText(ctx, narrative[i], {
      size: BODY,
      bold: i === 0,
      color: i === 0 ? rgb(0.04, 0.23, 0.36) : rgb(0.06, 0.09, 0.16),
    });
  }
  if (kind === 'quote' && block.amountText) {
    drawDotRow(ctx, block.code, block.amountText);
  } else if (block.amountText || block.rateText) {
    const label = block.rateText ? `${block.code}  ${block.rateText}` : block.code;
    drawDotRow(ctx, label, block.amountText || '');
  }
  // light box
  const boxBottom = ctx.y - 4;
  ctx.page.drawRectangle({
    x: MARGIN - 4,
    y: boxBottom,
    width: CONTENT_W + 8,
    height: boxTop - boxBottom,
    borderColor: rgb(0.8, 0.84, 0.88),
    borderWidth: 0.8,
  });
  ctx.y = boxBottom - 8;
}

function visibleCols(
  columns: ExportDocument['tables'][0]['columns'],
  rateMode: RateMode,
) {
  return rateMode === 'include' ? columns : columns.filter((c) => !c.isRate);
}

function drawTable(
  ctx: DrawCtx,
  table: ExportDocument['tables'][0],
  rateMode: RateMode,
): void {
  const cols = visibleCols(table.columns, rateMode);
  if (!cols.length) return;
  drawText(ctx, table.title, { size: 11, bold: true, color: rgb(0.04, 0.23, 0.36) });
  const colW = CONTENT_W / cols.length;
  ensureSpace(ctx, LINE + 8);
  let x = MARGIN;
  for (const c of cols) {
    const label = pdfSafe(c.label).slice(0, 18);
    ctx.page.drawText(label, {
      x,
      y: ctx.y - SMALL,
      size: 8,
      font: ctx.fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });
    x += colW;
  }
  ctx.y -= SMALL + 4;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: rgb(0.8, 0.84, 0.88),
  });
  ctx.y -= 6;
  for (const row of table.rows) {
    ensureSpace(ctx, LINE + 4);
    x = MARGIN;
    let rowH = LINE;
    const cells = cols.map((c) => {
      const raw = String(row[c.key] ?? '').replace(/\n/g, ' · ');
      const lines = wrapText(ctx.font, raw, 8, colW - 4);
      rowH = Math.max(rowH, lines.length * 10);
      return lines;
    });
    ensureSpace(ctx, rowH + 4);
    for (let ci = 0; ci < cols.length; ci++) {
      let ly = ctx.y;
      for (const line of cells[ci]) {
        ctx.page.drawText(pdfSafe(line).slice(0, 40), {
          x: MARGIN + ci * colW,
          y: ly - 8,
          size: 8,
          font: ctx.font,
          color: rgb(0.06, 0.09, 0.16),
        });
        ly -= 10;
      }
    }
    ctx.y -= rowH + 2;
  }
  ctx.y -= 6;
}

/** Build a real PDF (binary) from an ExportDocument. */
export async function buildPdfBytes(doc: ExportDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const ctx: DrawCtx = { doc: pdf, page, font, fontBold, y: PAGE_H - MARGIN };

  drawLetterhead(ctx, doc);

  if (doc.openingBlocks?.length) {
    drawText(ctx, 'Opening schedule', { size: 11, bold: true, color: rgb(0.04, 0.23, 0.36) });
    for (const block of doc.openingBlocks) {
      drawOpeningBlock(ctx, block, doc.kind);
    }
  }

  if (doc.sizeListBlocks?.length) {
    drawText(ctx, 'Window size list', { size: 11, bold: true, color: rgb(0.04, 0.23, 0.36) });
    for (const b of doc.sizeListBlocks) {
      ensureSpace(ctx, 40);
      for (const line of b.lines) drawText(ctx, line, { size: BODY });
      ctx.y -= 6;
    }
  }

  if (doc.boqLines?.length) {
    drawText(ctx, 'Hardware / profile BOQ', { size: 11, bold: true, color: rgb(0.04, 0.23, 0.36) });
    for (const line of doc.boqLines) drawText(ctx, `• ${line}`, { size: BODY });
  }

  const hasBlocks = Boolean(doc.openingBlocks?.length || doc.sizeListBlocks?.length);
  if (!doc.boqLines?.length) {
    for (const table of doc.tables) {
      if (hasBlocks && table.pdfSkipWhenBlocks) continue;
      drawTable(ctx, table, doc.rateMode);
    }
  }

  if (doc.summary.length) {
    ctx.y -= 4;
    drawText(ctx, 'Summary', { size: 11, bold: true, color: rgb(0.04, 0.23, 0.36) });
    for (const s of doc.summary) {
      if (doc.rateMode === 'exclude' && s.isRate) continue;
      drawDotRow(ctx, s.label, s.value);
    }
  }

  if (doc.footerSections?.length) {
    ctx.y -= 6;
    for (const sec of doc.footerSections) {
      drawText(ctx, sec.title, { size: SMALL, bold: true, color: rgb(0.04, 0.23, 0.36) });
      drawText(ctx, sec.body, { size: SMALL, color: rgb(0.2, 0.25, 0.33) });
      ctx.y -= 4;
    }
  }

  if (doc.footnote) {
    drawText(ctx, doc.footnote, { size: 8, color: rgb(0.39, 0.45, 0.55) });
  }

  return pdf.save();
}

export async function downloadPdfDocument(doc: ExportDocument): Promise<void> {
  const bytes = await buildPdfBytes(doc);
  const tag = doc.kind === 'quote' ? 'package' : doc.rateMode === 'include' ? 'with-rates' : 'no-rates';
  downloadBlob(`${doc.filenameBase}-${tag}.pdf`, bytes, 'application/pdf');
}
