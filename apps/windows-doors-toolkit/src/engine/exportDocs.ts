import { calcHardwareJob, calcQuote, calcSiteMeasure, formatInr, formatNum } from './calcs';
import {
  calcConfiguratorCart,
  calcModeQuote,
  modeAdjustedLineAmount,
} from './modePricing';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import { meshTypeLabel } from './meshCosting';
import { CUSTOMER_MODES, type AppState } from '../types';

export type RateMode = 'include' | 'exclude';
export type ExportFormat = 'pdf' | 'excel';
export type ExportDocKind = 'quote' | 'bom';

export interface ExportColumn {
  key: string;
  label: string;
  /** Hide when customer chooses “excluding rates”. */
  isRate?: boolean;
}

export interface ExportTable {
  title: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface ExportSummaryRow {
  label: string;
  value: string;
  isRate?: boolean;
}

export interface ExportDocument {
  kind: ExportDocKind;
  title: string;
  subtitle: string;
  meta: Array<{ label: string; value: string }>;
  tables: ExportTable[];
  summary: ExportSummaryRow[];
  footnote?: string;
  rateMode: RateMode;
  filenameBase: string;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function visibleColumns(cols: ExportColumn[], rateMode: RateMode): ExportColumn[] {
  return rateMode === 'include' ? cols : cols.filter((c) => !c.isRate);
}

function modeLabel(state: AppState): string {
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const mode = project?.customerMode ?? 'home-owner';
  return CUSTOMER_MODES.find((m) => m.id === mode)?.label ?? 'Home owner';
}

function businessMeta(state: AppState): Array<{ label: string; value: string }> {
  const b = state.business;
  return [
    { label: 'Company', value: b.companyName || '—' },
    { label: 'Phone', value: b.phone || '—' },
    { label: 'Email', value: b.email || '—' },
    { label: 'GSTIN', value: b.gstin || '—' },
  ];
}

/** Quotation schedule (08 Quotation / openings). Settings rates when include. */
export function buildQuoteDocument(state: AppState, rateMode: RateMode): ExportDocument {
  const q = calcQuote(state);
  const unit = state.allowances.unit;
  const label = modeLabel(state);
  const columns: ExportColumn[] = [
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type / series' },
    { key: 'material', label: 'Material' },
    { key: 'size', label: `Size (${unit})` },
    { key: 'qty', label: 'Qty' },
    { key: 'tracks', label: 'Tracks' },
    { key: 'glassDoors', label: 'Glass doors' },
    { key: 'meshDoors', label: 'Mesh doors' },
    { key: 'meshType', label: 'Mesh type' },
    { key: 'sqft', label: 'Chargeable sqft' },
    { key: 'rate', label: 'Rate ₹/sqft', isRate: true },
    { key: 'amount', label: 'Amount ₹', isRate: true },
  ];
  const rows = q.openings.rows.map((r) => {
    const t = state.windowTypes.find((w) => w.id === r.line.windowTypeId);
    return {
      location: r.line.location,
      type: r.typeName,
      material: t?.material ?? '—',
      size: `${r.line.width} × ${r.line.height}`,
      qty: r.line.qty,
      tracks: r.line.tracks ?? '',
      glassDoors: r.line.glassDoors ?? '',
      meshDoors: r.line.meshDoors ?? '',
      meshType: r.line.meshType ?? '',
      sqft: formatNum(r.chargeableSqft),
      rate: formatNum(r.rate, 0),
      amount: formatNum(r.estimate, 0),
    };
  });

  const meshRows = q.mesh.rows.map((m) => ({
    location: m.location || m.kind,
    type: m.kind,
    material: '—',
    size: `${m.widthMm} × ${m.heightMm} mm`,
    qty: m.qty,
    tracks: '',
    glassDoors: '',
    meshDoors: '',
    meshType: '',
    sqft: formatNum(m.sqft),
    rate: formatNum(m.ratePerSqft, 0),
    amount: formatNum(m.amount, 0),
  }));

  const summary: ExportSummaryRow[] =
    rateMode === 'include'
      ? [
          { label: 'Windows subtotal', value: formatInr(q.windowsSubtotal), isRate: true },
          { label: 'Mesh + grill', value: formatInr(q.mesh.total), isRate: true },
          { label: 'After discount', value: formatInr(q.afterDiscount), isRate: true },
          { label: 'GST', value: formatInr(q.gst), isRate: true },
          { label: 'Grand total', value: formatInr(q.grand), isRate: true },
          { label: 'Advance', value: formatInr(q.advance), isRate: true },
          { label: 'Balance', value: formatInr(q.balance), isRate: true },
        ]
      : [
          { label: 'Openings lines', value: String(rows.length) },
          { label: 'Total chargeable sqft', value: formatNum(q.openings.totalChargeable) },
          { label: 'Total windows (qty)', value: String(q.openings.totalWindows) },
        ];

  return {
    kind: 'quote',
    title: 'Quotation',
    subtitle: `${state.quote.quoteNo || 'Draft'} · ${state.quote.quoteDate || '—'} · Mode ${label}`,
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || '—' },
      { label: 'Phone', value: state.quote.phone || '—' },
      { label: 'Site', value: state.quote.siteAddress || '—' },
      { label: 'Valid till', value: q.validTill || '—' },
      {
        label: 'Rates',
        value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts',
      },
    ],
    tables: [
      { title: 'Window schedule', columns, rows },
      ...(meshRows.length
        ? [{ title: 'Mesh / grill add-ons', columns, rows: meshRows }]
        : []),
    ],
    summary,
    footnote: state.quote.notes || state.business.warrantyNote || undefined,
    rateMode,
    filenameBase: `quote-${state.quote.quoteNo || 'schedule'}`,
  };
}

/** Configurator mode quote (cart lines with glass / colour). */
export function buildConfiguratorQuoteDocument(
  state: AppState,
  rateMode: RateMode,
): ExportDocument {
  const cart = calcConfiguratorCart(state);
  const modeQuote = calcModeQuote(state);
  const label = modeLabel(state);
  const columns: ExportColumn[] = [
    { key: 'location', label: 'Location' },
    { key: 'product', label: 'Product' },
    { key: 'type', label: 'Type' },
    { key: 'material', label: 'Material' },
    { key: 'size', label: 'Size (mm)' },
    { key: 'qty', label: 'Qty' },
    { key: 'glass', label: 'Glass' },
    { key: 'colour', label: 'Colour' },
    { key: 'tracks', label: 'Tracks' },
    { key: 'glassDoors', label: 'Glass doors' },
    { key: 'meshDoors', label: 'Mesh doors' },
    { key: 'meshType', label: 'Mesh type' },
    { key: 'sqft', label: 'Sqft' },
    { key: 'retail', label: 'Retail ₹', isRate: true },
    { key: 'modeAmount', label: 'Mode ₹', isRate: true },
  ];
  const rows = cart.rows.map((r) => {
    const lineRetail = r.retailAmount + r.glassAmount + r.meshAmount;
    const adj = modeAdjustedLineAmount(lineRetail, modeQuote);
    return {
      location: r.line.location,
      product: r.line.productType,
      type: r.typeName,
      material: r.line.material,
      size: `${r.line.widthMm} × ${r.line.heightMm}`,
      qty: r.line.qty,
      glass: r.glassName,
      colour: r.colourName,
      tracks: r.line.tracks ?? '',
      glassDoors: r.line.glassDoors ?? '',
      meshDoors: r.line.meshDoors ?? '',
      meshType: r.line.meshType ?? '',
      sqft: formatNum(r.chargeableSqft),
      retail: formatNum(lineRetail, 0),
      modeAmount: formatNum(adj.amount, 0),
    };
  });

  const summary: ExportSummaryRow[] =
    rateMode === 'include'
      ? [
          { label: 'Retail subtotal', value: formatInr(modeQuote.retailSubtotal), isRate: true },
          {
            label: `Mode discount (${modeQuote.discountPercent}%)`,
            value: formatInr(modeQuote.discountAmount),
            isRate: true,
          },
          { label: 'After mode discount', value: formatInr(modeQuote.afterModeDiscount), isRate: true },
          { label: 'GST', value: formatInr(modeQuote.gst), isRate: true },
          { label: 'Grand total', value: formatInr(modeQuote.grand), isRate: true },
        ]
      : [
          { label: 'Lines', value: String(rows.length) },
          { label: 'Total qty', value: String(cart.totalQty) },
          { label: 'Total chargeable sqft', value: formatNum(cart.totalChargeable) },
        ];

  return {
    kind: 'quote',
    title: 'Mode quote',
    subtitle: `${label} · ${modeQuote.pricingNote}`,
    meta: [
      ...businessMeta(state),
      { label: 'Quote no', value: state.quote.quoteNo || '—' },
      { label: 'Mode', value: label },
      {
        label: 'Rates',
        value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts',
      },
    ],
    tables: [{ title: 'Quote lines', columns, rows }],
    summary,
    footnote: state.quote.notes || undefined,
    rateMode,
    filenameBase: `mode-quote-${state.quote.quoteNo || 'configurator'}`,
  };
}

/** Site Measure schedule (measured openings + mesh add-ons). Settings rates when include. */
export function buildSiteMeasureQuoteDocument(
  state: AppState,
  rateMode: RateMode,
): ExportDocument {
  const site = calcSiteMeasure(state);
  const unit = state.allowances.unit;
  const label = modeLabel(state);
  const columns: ExportColumn[] = [
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type' },
    { key: 'material', label: 'Material' },
    { key: 'size', label: `Site size (${unit})` },
    { key: 'net', label: `Net fab (${unit})` },
    { key: 'qty', label: 'Qty' },
    { key: 'tracks', label: 'Tracks' },
    { key: 'glassDoors', label: 'Glass doors' },
    { key: 'meshDoors', label: 'Mesh doors' },
    { key: 'meshType', label: 'Mesh type' },
    { key: 'sqft', label: 'Chargeable sqft' },
    { key: 'rate', label: 'Rate ₹/sqft', isRate: true },
    { key: 'meshAmount', label: 'Mesh ₹', isRate: true },
    { key: 'amount', label: 'Amount ₹', isRate: true },
  ];
  const rows = site.rows.map((r) => ({
    location: r.line.location || '—',
    type: r.typeName,
    material: r.material,
    size: `${r.line.width} × ${r.line.height}`,
    net: `${r.netWidth} × ${r.netHeight}`,
    qty: r.line.qty,
    tracks: r.line.tracks ?? '',
    glassDoors: r.line.glassDoors ?? '',
    meshDoors: r.line.meshDoors ?? '',
    meshType: meshTypeLabel(r.line.meshType ?? 'none'),
    sqft: formatNum(r.totalSqft),
    rate: formatNum(r.effectiveRate, 0),
    meshAmount: formatNum(r.meshAmount, 0),
    amount: formatNum(r.amount, 0),
  }));

  const summary: ExportSummaryRow[] =
    rateMode === 'include'
      ? [
          { label: 'Openings (qty)', value: String(site.totalQty) },
          { label: 'Chargeable sqft', value: formatNum(site.totalSqft) },
          { label: 'Mesh add-on', value: formatInr(site.totalMeshAmount), isRate: true },
          { label: 'Measured value', value: formatInr(site.totalAmount), isRate: true },
        ]
      : [
          { label: 'Openings (qty)', value: String(site.totalQty) },
          { label: 'Chargeable sqft', value: formatNum(site.totalSqft) },
          { label: 'Lines', value: String(rows.length) },
        ];

  return {
    kind: 'quote',
    title: 'Site measure quote',
    subtitle: `Measured openings · Mode ${label}`,
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || state.jobMeta.customerName || '—' },
      { label: 'Site', value: state.quote.siteAddress || state.jobMeta.siteAddress || '—' },
      {
        label: 'Rates',
        value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts',
      },
    ],
    tables: [{ title: 'Site measured openings', columns, rows }],
    summary,
    footnote: 'Site measure uses Settings window-type + mesh rates. Push to Openings/Configurator for full quotation.',
    rateMode,
    filenameBase: `site-measure-${state.quote.quoteNo || 'openings'}`,
  };
}

/** BOM / materials list: config materials + hardware (Settings rates when include). */
export function buildBomDocument(
  state: AppState,
  rateMode: RateMode,
  source: 'openings' | 'configurator' | 'site-measure' = 'openings',
): ExportDocument {
  const catalogue = resolveEffectiveCatalogue(state);
  const label = modeLabel(state);
  const materialColumns: ExportColumn[] = [
    { key: 'location', label: 'Location' },
    { key: 'material', label: 'Material' },
    { key: 'type', label: 'Type / name' },
    { key: 'size', label: 'Size' },
    { key: 'qty', label: 'Qty' },
    { key: 'glass', label: 'Glass' },
    { key: 'colour', label: 'Colour' },
    { key: 'hardwareNote', label: 'Tracks / doors / mesh' },
    { key: 'sqft', label: 'Sqft' },
  ];

  let materialRows: Array<Record<string, string | number>> = [];

  if (source === 'configurator') {
    const cart = calcConfiguratorCart(state);
    materialRows = cart.rows.map((r) => ({
      location: r.line.location,
      material: r.line.material,
      type: r.typeName,
      size: `${r.line.widthMm} × ${r.line.heightMm} mm`,
      qty: r.line.qty,
      glass: r.glassName,
      colour: r.colourName,
      hardwareNote: [
        r.line.tracks ? `T${r.line.tracks}` : null,
        r.line.glassDoors != null ? `G${r.line.glassDoors}` : null,
        r.line.meshDoors ? `M${r.line.meshDoors} ${r.line.meshType ?? ''}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      sqft: formatNum(r.chargeableSqft),
    }));
  } else if (source === 'site-measure') {
    const site = calcSiteMeasure(state);
    const unit = state.allowances.unit;
    materialRows = site.rows.map((r) => ({
      location: r.line.location || '—',
      material: r.material,
      type: r.typeName,
      size: `${r.line.width} × ${r.line.height} ${unit} (net ${r.netWidth} × ${r.netHeight})`,
      qty: r.line.qty,
      glass: '—',
      colour: '—',
      hardwareNote: [
        r.line.tracks ? `T${r.line.tracks}` : null,
        r.line.glassDoors != null ? `G${r.line.glassDoors}` : null,
        r.line.meshDoors
          ? `M${r.line.meshDoors} ${meshTypeLabel(r.line.meshType ?? 'none')}`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      sqft: formatNum(r.totalSqft),
    }));
  } else {
    const q = calcQuote(state);
    materialRows = q.openings.rows.map((r) => {
      const t = state.windowTypes.find((w) => w.id === r.line.windowTypeId);
      return {
        location: r.line.location,
        material: t?.material ?? '—',
        type: r.typeName,
        size: `${r.line.width} × ${r.line.height} ${state.allowances.unit}`,
        qty: r.line.qty,
        glass: '—',
        colour: '—',
        hardwareNote: [
          r.line.tracks ? `T${r.line.tracks}` : null,
          r.line.glassDoors != null ? `G${r.line.glassDoors}` : null,
          r.line.meshDoors ? `M${r.line.meshDoors} ${r.line.meshType ?? ''}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        sqft: formatNum(r.chargeableSqft),
      };
    });
  }

  const hwColumns: ExportColumn[] = [
    { key: 'windowType', label: 'Window type' },
    { key: 'hardware', label: 'Hardware' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'qtyPerWin', label: 'Qty / win' },
    { key: 'windows', label: 'Windows' },
    { key: 'jobQty', label: 'Job qty' },
    { key: 'rate', label: 'Rate ₹', isRate: true },
    { key: 'amount', label: 'Amount ₹', isRate: true },
  ];

  let hwRows: Array<Record<string, string | number>> = [];
  let hwTotal = 0;

  if (source === 'configurator' || source === 'site-measure') {
    const map = new Map<
      string,
      { windowType: string; hardware: string; category: string; unit: string; qty: number; rate: number }
    >();
    const lineRefs =
      source === 'configurator'
        ? calcConfiguratorCart(state).rows.map((r) => ({
            windowTypeId: r.line.windowTypeId,
            typeName: r.typeName,
            qty: r.line.qty,
          }))
        : calcSiteMeasure(state).rows.map((r) => ({
            windowTypeId: r.line.windowTypeId,
            typeName: r.typeName,
            qty: r.line.qty,
          }));
    for (const r of lineRefs) {
      const bom = state.hardwareBom.filter((b) => b.windowTypeId === r.windowTypeId);
      for (const b of bom) {
        const item = catalogue.hardware.find((h) => h.id === b.hardwareItemId);
        if (!item) continue;
        const key = `${r.windowTypeId}:${item.id}`;
        const prev = map.get(key) ?? {
          windowType: r.typeName,
          hardware: item.name,
          category: item.category,
          unit: item.unit,
          qty: 0,
          rate: item.rate,
        };
        prev.qty += b.qtyPerWindow * r.qty;
        map.set(key, prev);
      }
    }
    hwRows = [...map.values()].map((h) => ({
      windowType: h.windowType,
      hardware: h.hardware,
      category: h.category,
      unit: h.unit,
      qtyPerWin: '',
      windows: '',
      jobQty: h.qty,
      rate: formatNum(h.rate, 0),
      amount: formatNum(h.qty * h.rate, 0),
    }));
    hwTotal = [...map.values()].reduce((s, h) => s + h.qty * h.rate, 0);
  } else {
    const calc = calcHardwareJob(state);
    hwRows = calc.rows.map((r) => ({
      windowType: r.typeName,
      hardware: r.itemName,
      category: r.category,
      unit: r.unit,
      qtyPerWin: r.qtyPerWindow,
      windows: r.windows,
      jobQty: r.qtyPerWindow * r.windows,
      rate: formatNum(r.rate, 0),
      amount: formatNum(r.jobCost, 0),
    }));
    hwTotal = calc.total;
  }

  const summary: ExportSummaryRow[] =
    rateMode === 'include'
      ? [
          { label: 'Material lines', value: String(materialRows.length) },
          { label: 'Hardware lines', value: String(hwRows.length) },
          { label: 'Hardware total', value: formatInr(hwTotal), isRate: true },
        ]
      : [
          { label: 'Material lines', value: String(materialRows.length) },
          { label: 'Hardware lines', value: String(hwRows.length) },
        ];

  return {
    kind: 'bom',
    title: 'BOM / materials list',
    subtitle: `Configuration materials + hardware · Mode ${label}`,
    meta: [
      ...businessMeta(state),
      { label: 'Project material', value: state.projects.find((p) => p.id === state.activeProjectId)?.material ?? '—' },
      {
        label: 'Rates',
        value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts',
      },
    ],
    tables: [
      { title: 'Configuration materials', columns: materialColumns, rows: materialRows },
      { title: 'Hardware BOM', columns: hwColumns, rows: hwRows },
    ],
    summary,
    footnote: 'Rates come from Settings / shared master when included. No rates invented in export.',
    rateMode,
    filenameBase: `bom-${source}-${state.quote.quoteNo || 'materials'}`,
  };
}

export function documentToCsv(doc: ExportDocument): string {
  const lines: string[] = [];
  lines.push(csvCell(doc.title));
  lines.push(csvCell(doc.subtitle));
  lines.push('');
  for (const m of doc.meta) {
    lines.push([csvCell(m.label), csvCell(m.value)].join(','));
  }
  lines.push('');
  for (const table of doc.tables) {
    lines.push(csvCell(table.title));
    const cols = visibleColumns(table.columns, doc.rateMode);
    lines.push(cols.map((c) => csvCell(c.label)).join(','));
    for (const row of table.rows) {
      lines.push(cols.map((c) => csvCell(row[c.key] ?? '')).join(','));
    }
    lines.push('');
  }
  if (doc.summary.length) {
    lines.push(csvCell('Summary'));
    for (const s of doc.summary) {
      if (doc.rateMode === 'exclude' && s.isRate) continue;
      lines.push([csvCell(s.label), csvCell(s.value)].join(','));
    }
  }
  if (doc.footnote) {
    lines.push('');
    lines.push(csvCell(doc.footnote));
  }
  // UTF-8 BOM helps Excel open INR text correctly
  return `\uFEFF${lines.join('\n')}`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function documentToHtml(doc: ExportDocument): string {
  const metaHtml = doc.meta
    .map((m) => `<div><span class="lbl">${escHtml(m.label)}</span> ${escHtml(m.value)}</div>`)
    .join('');
  const tablesHtml = doc.tables
    .map((table) => {
      const cols = visibleColumns(table.columns, doc.rateMode);
      const head = cols.map((c) => `<th>${escHtml(c.label)}</th>`).join('');
      const body =
        table.rows.length === 0
          ? `<tr><td colspan="${cols.length}">No rows</td></tr>`
          : table.rows
              .map(
                (row) =>
                  `<tr>${cols.map((c) => `<td>${escHtml(String(row[c.key] ?? ''))}</td>`).join('')}</tr>`,
              )
              .join('');
      return `<h2>${escHtml(table.title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join('');
  const summaryHtml = doc.summary
    .filter((s) => !(doc.rateMode === 'exclude' && s.isRate))
    .map((s) => `<div class="sum"><span>${escHtml(s.label)}</span><strong>${escHtml(s.value)}</strong></div>`)
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escHtml(doc.title)}</title>
<style>
  body{font:13px/1.45 system-ui,Segoe UI,sans-serif;color:#0f172a;margin:24px;max-width:1100px}
  h1{font-size:20px;margin:0 0 4px} .sub{color:#64748b;margin-bottom:12px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:16px;font-size:12px}
  .lbl{color:#64748b;display:inline-block;min-width:88px}
  h2{font-size:14px;margin:18px 0 6px}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left;vertical-align:top}
  th{background:#f1f5f9;font-size:11px}
  .sums{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:14px}
  .sum{border:1px solid #e2e8f0;border-radius:8px;padding:8px}
  .sum span{display:block;font-size:11px;color:#64748b}
  .foot{margin-top:16px;font-size:11px;color:#64748b}
  .badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#ecfeff;color:#0e7490;font-size:11px;font-weight:600}
  @media print{body{margin:12px} .noprint{display:none}}
</style></head><body>
  <h1>${escHtml(doc.title)}<span class="badge">${doc.rateMode === 'include' ? 'With rates' : 'No rates'}</span></h1>
  <div class="sub">${escHtml(doc.subtitle)}</div>
  <div class="meta">${metaHtml}</div>
  ${tablesHtml}
  <div class="sums">${summaryHtml}</div>
  ${doc.footnote ? `<p class="foot">${escHtml(doc.footnote)}</p>` : ''}
  <p class="foot noprint">Use the browser Print dialog → Save as PDF.</p>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`;
}

export function openPrintPdf(doc: ExportDocument): void {
  const html = documentToHtml(doc);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!w) {
    // Fallback: download HTML if pop-up blocked
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.filenameBase}-${doc.rateMode}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function runExport(doc: ExportDocument, format: ExportFormat): void {
  if (format === 'excel') {
    downloadCsv(
      `${doc.filenameBase}-${doc.rateMode === 'include' ? 'with-rates' : 'no-rates'}.csv`,
      documentToCsv(doc),
    );
    return;
  }
  openPrintPdf(doc);
}
