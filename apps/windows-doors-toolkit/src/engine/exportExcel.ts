import ExcelJS from 'exceljs';
import type { ExportDocument, RateMode } from './exportDocs';

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

function visibleColumns(
  cols: ExportDocument['tables'][0]['columns'],
  rateMode: RateMode,
) {
  return rateMode === 'include' ? cols : cols.filter((c) => !c.isRate);
}

/** Build a real .xlsx workbook from an export document. */
export async function buildExcelBytes(doc: ExportDocument): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Windows & Doors Toolkit';
  wb.created = new Date();
  const ws = wb.addWorksheet(doc.kind === 'quote' ? 'Quotation' : 'Export', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  let row = 1;
  ws.getCell(row, 1).value = doc.title;
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 1;
  if (doc.subtitle) {
    ws.getCell(row, 1).value = doc.subtitle;
    row += 1;
  }
  row += 1;

  for (const m of doc.meta) {
    ws.getCell(row, 1).value = m.label;
    ws.getCell(row, 2).value = m.value;
    row += 1;
  }
  row += 1;

  if (doc.letterhead) {
    const lh = doc.letterhead;
    ws.getCell(row, 1).value = 'Company';
    ws.getCell(row, 2).value = lh.companyName;
    row += 1;
    if (lh.gstin) {
      ws.getCell(row, 1).value = 'GST';
      ws.getCell(row, 2).value = lh.gstin;
      row += 1;
    }
    ws.getCell(row, 1).value = 'Customer';
    ws.getCell(row, 2).value = lh.customerName || '—';
    row += 1;
    ws.getCell(row, 1).value = 'Site';
    ws.getCell(row, 2).value = lh.siteAddress || '—';
    row += 1;
    row += 1;
  }

  if (doc.openingBlocks?.length) {
    ws.getCell(row, 1).value = 'Opening schedule';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    for (const b of doc.openingBlocks) {
      ws.getCell(row, 1).value = b.code;
      ws.getCell(row, 2).value = b.text;
      row += 1;
    }
    row += 1;
  }

  if (doc.sizeListBlocks?.length) {
    ws.getCell(row, 1).value = 'Window size list';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    for (const b of doc.sizeListBlocks) {
      ws.getCell(row, 1).value = b.code;
      ws.getCell(row, 2).value = b.text;
      row += 1;
    }
    row += 1;
  }

  if (doc.boqLines?.length) {
    ws.getCell(row, 1).value = 'BOQ lines';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    for (const line of doc.boqLines) {
      ws.getCell(row, 1).value = line;
      row += 1;
    }
    row += 1;
  }

  for (const table of doc.tables) {
    ws.getCell(row, 1).value = table.title;
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    const cols = visibleColumns(table.columns, doc.rateMode);
    cols.forEach((c, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = c.label;
      cell.font = { bold: true };
    });
    row += 1;
    for (const data of table.rows) {
      cols.forEach((c, i) => {
        ws.getCell(row, i + 1).value = data[c.key] ?? '';
      });
      row += 1;
    }
    row += 1;
  }

  if (doc.summary.length) {
    ws.getCell(row, 1).value = 'Summary';
    ws.getCell(row, 1).font = { bold: true };
    row += 1;
    for (const s of doc.summary) {
      if (doc.rateMode === 'exclude' && s.isRate) continue;
      ws.getCell(row, 1).value = s.label;
      ws.getCell(row, 2).value = s.value;
      row += 1;
    }
  }

  if (doc.footerSections?.length) {
    row += 1;
    for (const sec of doc.footerSections) {
      ws.getCell(row, 1).value = sec.title;
      ws.getCell(row, 1).font = { bold: true };
      ws.getCell(row, 2).value = sec.body;
      row += 1;
    }
  }

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 48;
  for (let c = 3; c <= 12; c++) ws.getColumn(c).width = 14;

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export async function downloadExcelDocument(doc: ExportDocument): Promise<void> {
  const bytes = await buildExcelBytes(doc);
  const tag = doc.kind === 'quote' ? 'package' : doc.rateMode === 'include' ? 'with-rates' : 'no-rates';
  downloadBlob(
    `${doc.filenameBase}-${tag}.xlsx`,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}
