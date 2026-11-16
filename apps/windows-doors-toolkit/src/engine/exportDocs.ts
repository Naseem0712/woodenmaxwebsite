import { calcHardwareJob, calcQuote, calcSiteMeasure, formatInr, formatNum } from './calcs';
import {
  buildHardwareProfileBoq,
  buildWindowSizeList,
  type DeliverableSource,
} from './deliverableLists';
import {
  calcConfiguratorCart,
  calcModeQuote,
  modeLineSellingAmount,
} from './modePricing';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import { meshTypeLabel, resolveMeshCosting } from './meshCosting';
import {
  buildQuoteFooterSections,
  calcCustomQuoteLines,
  customUnitLabel,
  resolveQuoteGst,
} from './quoteEnhancements';
import {
  formatGlassLabel,
  formatOpeningCode,
  formatQuoteOpeningBlock,
  formatQuoteOpeningLines,
  formatQuoteOpeningNarrativeLines,
  resolveLockHandleLabel,
  resolveSeriesDoorExtraLabels,
  type QuoteOpeningFormatInput,
} from './quoteOpeningFormat';
import {
  CUSTOMER_MODES,
  type AppState,
  type BusinessInfo,
  type DoorExtraKind,
  type MeshTypeId,
} from '../types';

export type RateMode = 'include' | 'exclude';
export type ExportFormat = 'pdf' | 'excel';
export type ExportDocKind = 'quote' | 'bom' | 'size-list' | 'profile-boq';

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
  /**
   * When true and the document has openingBlocks, PDF/print skips this table
   * (blocks replace the wide schedule). Excel still exports the table.
   */
  pdfSkipWhenBlocks?: boolean;
}

export interface ExportSummaryRow {
  label: string;
  value: string;
  isRate?: boolean;
}

/** One W-01… opening rendered as multi-line customer template on PDF/print. */
export interface ExportOpeningBlock {
  code: string;
  /** Full plain-text (Excel). */
  lines: string[];
  text: string;
  /** Narrative without Rate/Amount — PDF body. */
  narrativeLines: string[];
  /** Right-aligned rate cell for dotted leader row (with-rates). */
  rateText?: string;
  /** Right-aligned amount cell for dotted leader row (with-rates). */
  amountText?: string;
}

export interface ExportLetterhead {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  /** GSTIN number — letterhead shows capital “GST”. */
  gstin: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  quoteNo: string;
  quoteDate: string;
}

export interface ExportDocument {
  kind: ExportDocKind;
  title: string;
  subtitle: string;
  meta: Array<{ label: string; value: string }>;
  letterhead?: ExportLetterhead;
  /** Quote PDF opening schedule in customer W-01 block format. */
  openingBlocks?: ExportOpeningBlock[];
  /** Fabrication window size list blocks (location……type / actual→net / hardwares). */
  sizeListBlocks?: Array<{ code: string; lines: string[]; text: string }>;
  /** Profile + hardware BOQ plain lines for PDF. */
  boqLines?: string[];
  tables: ExportTable[];
  summary: ExportSummaryRow[];
  footnote?: string;
  footerSections?: Array<{ title: string; body: string }>;
  rateMode: RateMode;
  filenameBase: string;
}

function quoteFooter(state: AppState): Array<{ title: string; body: string }> {
  return buildQuoteFooterSections(state.quote, state.business.warrantyNote);
}

function gstSummaryRows(state: AppState, gst: number, grand: number): ExportSummaryRow[] {
  const { apply, percent } = resolveQuoteGst(state);
  if (!apply) {
    return [
      { label: 'GST', value: 'Not applied' },
      { label: 'Grand total', value: formatInr(grand) },
    ];
  }
  return [
    { label: `GST (${formatNum(percent, 2)}%)`, value: formatInr(gst) },
    { label: 'Grand total', value: formatInr(grand) },
  ];
}

function appendCustomOpeningBlocks(state: AppState, startIndex: number): ExportOpeningBlock[] {
  const custom = calcCustomQuoteLines(state);
  return custom.rows.map((r, i) => {
    const code = formatOpeningCode(startIndex + i);
    const unit = customUnitLabel(r.line.unit);
    const size = (r.line.sizeLabel || '').trim() || '—';
    const narrativeLines = [
      `${code} ${(r.line.name || '').trim() || 'Custom product'}, ${size}, qty ${r.line.qty}, ${unit}`,
      `Rate: ${formatNum(r.line.rate, 0)} ${unit}`,
      ...(r.line.unit !== 'pc' ? [`Measure: ${formatNum(r.line.measure, 2)}`] : []),
      ...(r.hasDiscount
        ? [
            `Actual amount: ${formatNum(r.actual, 0)}`,
            `Discount: ${formatNum(r.discountPercent, 2)}% (−${formatInr(r.discountAmount)})`,
          ]
        : []),
      ...((r.line.notes || '').trim() ? [`Notes: ${(r.line.notes || '').trim()}`] : []),
    ];
    const text = [
      ...narrativeLines,
      `${r.hasDiscount ? 'Selling' : 'Package'}: ${formatNum(r.selling, 0)}`,
    ].join('\n');
    return {
      code,
      lines: text.split('\n'),
      text,
      narrativeLines,
      amountText: formatNum(r.selling, 0),
    };
  });
}

function buildOpeningBlock(input: QuoteOpeningFormatInput): ExportOpeningBlock {
  const lines = formatQuoteOpeningLines(input);
  const narrativeLines = formatQuoteOpeningNarrativeLines(input);
  const rateText =
    input.ratePerSqft != null && Number.isFinite(input.ratePerSqft)
      ? `${formatNum(input.ratePerSqft, 0)} /sqft`
      : undefined;
  const amountText =
    input.amount != null && Number.isFinite(input.amount)
      ? formatNum(input.amount, 0)
      : undefined;
  return {
    code: formatOpeningCode(input.index),
    lines,
    text: formatQuoteOpeningBlock(input),
    narrativeLines,
    rateText,
    amountText,
  };
}

function buildLetterhead(
  state: AppState,
  overrides?: Partial<Pick<ExportLetterhead, 'customerName' | 'customerPhone' | 'siteAddress'>>,
): ExportLetterhead {
  const b: BusinessInfo = state.business;
  return {
    companyName: b.companyName || '—',
    address: b.address || '',
    phone: b.phone || '',
    email: b.email || '',
    website: b.website || '',
    logoUrl: b.logoUrl || '',
    gstin: b.gstin || '',
    customerName: overrides?.customerName ?? state.quote.customerName ?? state.jobMeta.customerName ?? '',
    customerPhone: overrides?.customerPhone ?? state.quote.phone ?? '',
    siteAddress: overrides?.siteAddress ?? state.quote.siteAddress ?? state.jobMeta.siteAddress ?? '',
    quoteNo: state.quote.quoteNo || '',
    quoteDate: state.quote.quoteDate || '',
  };
}

/** Shared narrative fields from Site Measure / Configurator / Openings + Settings masters. */
function enrichOpeningNarrative(
  state: AppState,
  partial: QuoteOpeningFormatInput & {
    windowTypeId?: string | null;
    glassTypeId?: string | null;
    colourId?: string | null;
    lockHandleLabel?: string | null;
    doorExtraKind?: DoorExtraKind | null;
    meshType?: MeshTypeId | null;
  },
): QuoteOpeningFormatInput {
  const mesh = resolveMeshCosting(state.allowances);
  const wt = partial.windowTypeId
    ? state.windowTypes.find((w) => w.id === partial.windowTypeId)
    : undefined;
  const series = wt?.seriesId ? state.series.find((s) => s.id === wt.seriesId) : undefined;
  const glass =
    (partial.glassTypeId
      ? state.glassTypes.find((g) => g.id === partial.glassTypeId)
      : undefined) ?? state.glassTypes[0];
  const colourName =
    partial.colourName ??
    (partial.colourId
      ? state.colourOptions.find((c) => c.id === partial.colourId)?.name
      : null) ??
    null;
  const lockHandleLabel = resolveLockHandleLabel(state, {
    windowTypeId: partial.windowTypeId,
    series,
    lockHandleLabel: partial.lockHandleLabel,
  });
  const lineExtra = partial.doorExtraKind;
  const seriesExtra = resolveSeriesDoorExtraLabels(series);
  const doorExtraKind =
    lineExtra === 'door-closer' || lineExtra === 'floor-spring' || lineExtra === 'none'
      ? lineExtra
      : seriesExtra.kind;
  const showDoorExtras = wt?.kind === 'door' || wt?.kind === 'casement' || doorExtraKind !== 'none';

  return {
    ...partial,
    colourName,
    seriesBrand: (series?.brand || '').trim() || null,
    glassLabel: formatGlassLabel(glass),
    lockHandleLabel,
    meshType: partial.meshType ?? null,
    meshThicknessMm: mesh.defaultThicknessMm,
    meshColour: mesh.defaultColour,
    meshBrand: (mesh.brand || '').trim() || null,
    doorExtraKind: showDoorExtras ? doorExtraKind : 'none',
    doorCloserLabel: doorExtraKind === 'door-closer' ? seriesExtra.doorCloserLabel : null,
    floorSpringLabel: doorExtraKind === 'floor-spring' ? seriesExtra.floorSpringLabel : null,
  };
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
    { label: 'Website', value: b.website || '—' },
    { label: 'GST', value: b.gstin || '—' },
  ];
}

/** Quotation schedule (08 Quotation / openings). Package amount only — never ₹/sqft. */
export function buildQuoteDocument(state: AppState, _rateMode: RateMode = 'include'): ExportDocument {
  const rateMode: RateMode = 'include';
  const q = calcQuote(state);
  const unit = state.allowances.unit;
  const columns: ExportColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'schedule', label: 'Schedule (W-01 block)' },
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
    { key: 'amount', label: 'Package ₹' },
  ];
  const openingBlocks: ExportOpeningBlock[] = [];
  const rows = q.openings.rows.map((r, i) => {
    const t = state.windowTypes.find((w) => w.id === r.line.windowTypeId);
    const block = buildOpeningBlock(
      enrichOpeningNarrative(state, {
        index: i + 1,
        location: r.line.location,
        width: r.line.width,
        height: r.line.height,
        unit,
        qty: r.line.qty,
        areaSqft: r.chargeableSqft,
        windowTypeName: r.typeName,
        glassDoors: r.line.glassDoors,
        meshDoors: r.line.meshDoors,
        meshType: r.line.meshType ?? null,
        windowTypeId: r.line.windowTypeId,
        glassTypeId: r.line.glassTypeId,
        colourId: r.line.colourId,
        lockHandleLabel: r.line.lockHandleLabel,
        doorExtraKind: r.line.doorExtraKind,
        notes: r.line.notes ?? '',
        ratePerSqft: null,
        actualAmount: r.estimate,
        discountPercent: r.hasDiscount ? r.discountPercent : null,
        discountAmount: r.hasDiscount ? r.discountAmount : null,
        amount: r.selling,
      }),
    );
    openingBlocks.push(block);
    return {
      code: block.code,
      schedule: block.text,
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
      amount: formatNum(r.selling, 0),
    };
  });

  openingBlocks.push(...appendCustomOpeningBlocks(state, openingBlocks.length + 1));

  const meshRows = q.mesh.rows.map((m) => ({
    code: '',
    schedule: '',
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
    amount: formatNum(m.amount, 0),
  }));

  const summary: ExportSummaryRow[] = [
    { label: 'Windows (actual)', value: formatInr(q.windowsSubtotal) },
    { label: 'Windows (selling)', value: formatInr(q.windowsSelling) },
    { label: 'Mesh + grill', value: formatInr(q.mesh.total) },
    ...(q.customSelling > 0 ? [{ label: 'Custom products', value: formatInr(q.customSelling) }] : []),
    { label: 'After discount', value: formatInr(q.afterDiscount) },
    ...gstSummaryRows(state, q.gst, q.grand),
    { label: 'Advance', value: formatInr(q.advance) },
    { label: 'Balance', value: formatInr(q.balance) },
  ];

  return {
    kind: 'quote',
    title: 'Quotation',
    subtitle: '',
    letterhead: buildLetterhead(state),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || '—' },
      { label: 'Phone', value: state.quote.phone || '—' },
      { label: 'Site', value: state.quote.siteAddress || '—' },
      { label: 'Valid till', value: q.validTill || '—' },
      {
        label: 'GST',
        value: q.gstApplied ? `${formatNum(q.gstPercent, 2)}% on grand` : 'Off for this quote',
      },
    ],
    openingBlocks,
    tables: [
      { title: 'Window schedule', columns, rows, pdfSkipWhenBlocks: true },
      ...(meshRows.length
        ? [{ title: 'Mesh / grill add-ons', columns, rows: meshRows }]
        : []),
    ],
    summary,
    footerSections: quoteFooter(state),
    footnote: undefined,
    rateMode,
    filenameBase: `quote-${state.quote.quoteNo || 'schedule'}`,
  };
}

/** Configurator mode quote (cart lines with glass / colour). Package amount only. */
export function buildConfiguratorQuoteDocument(
  state: AppState,
  _rateMode: RateMode = 'include',
): ExportDocument {
  const rateMode: RateMode = 'include';
  const cart = calcConfiguratorCart(state);
  const modeQuote = calcModeQuote(state);
  const columns: ExportColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'schedule', label: 'Schedule (W-01 block)' },
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
    { key: 'modeAmount', label: 'Package ₹' },
  ];
  const openingBlocks: ExportOpeningBlock[] = [];
  const rows = cart.rows.map((r, i) => {
    const lineRetail = r.retailAmount + r.glassAmount + r.meshAmount;
    const sell = modeLineSellingAmount(lineRetail, modeQuote, r.line.discountPercent);
    const block = buildOpeningBlock(
      enrichOpeningNarrative(state, {
        index: i + 1,
        location: r.line.location,
        width: r.line.widthMm,
        height: r.line.heightMm,
        unit: 'mm',
        qty: r.line.qty,
        areaSqft: r.chargeableSqft,
        windowTypeName: r.typeName,
        glassDoors: r.line.glassDoors,
        meshDoors: r.line.meshDoors,
        meshType: r.line.meshType ?? null,
        windowTypeId: r.line.windowTypeId,
        glassTypeId: r.line.glassTypeId,
        colourId: r.line.colourId,
        colourName: r.colourName,
        lockHandleLabel: r.line.lockHandleLabel,
        doorExtraKind: r.line.doorExtraKind,
        notes: r.line.notes ?? '',
        ratePerSqft: null,
        actualAmount: sell.actual,
        discountPercent: sell.hasDiscount ? sell.discountPercent : null,
        discountAmount: sell.hasDiscount ? sell.discountAmount : null,
        amount: sell.selling,
      }),
    );
    openingBlocks.push(block);
    return {
      code: block.code,
      schedule: block.text,
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
      modeAmount: formatNum(sell.selling, 0),
    };
  });

  openingBlocks.push(...appendCustomOpeningBlocks(state, openingBlocks.length + 1));

  const summary: ExportSummaryRow[] = [
    { label: 'Retail subtotal', value: formatInr(modeQuote.retailSubtotal) },
    {
      label: `Mode discount (${modeQuote.discountPercent}%)`,
      value: formatInr(modeQuote.discountAmount),
    },
    { label: 'After mode discount', value: formatInr(modeQuote.afterModeDiscount) },
    ...(modeQuote.lineDiscountTotal > 0
      ? [{ label: 'Line discounts', value: formatInr(modeQuote.lineDiscountTotal) }]
      : []),
    ...(modeQuote.customSelling > 0
      ? [{ label: 'Custom products', value: formatInr(modeQuote.customSelling) }]
      : []),
    { label: 'Taxable total', value: formatInr(modeQuote.afterLineDiscounts) },
    ...gstSummaryRows(state, modeQuote.gst, modeQuote.grand),
  ];

  return {
    kind: 'quote',
    title: 'Quotation',
    subtitle: '',
    letterhead: buildLetterhead(state),
    meta: [
      ...businessMeta(state),
      { label: 'Quote no', value: state.quote.quoteNo || '—' },
      {
        label: 'GST',
        value: modeQuote.gstApplied
          ? `${formatNum(modeQuote.gstPercent, 2)}% on grand`
          : 'Off for this quote',
      },
    ],
    openingBlocks,
    tables: [{ title: 'Quote lines', columns, rows, pdfSkipWhenBlocks: true }],
    summary,
    footerSections: quoteFooter(state),
    footnote: undefined,
    rateMode,
    filenameBase: `quote-${state.quote.quoteNo || 'configurator'}`,
  };
}

/** Site Measure quote — package amount per opening (no ₹/sqft on export). */
export function buildSiteMeasureQuoteDocument(
  state: AppState,
  _rateMode: RateMode = 'include',
): ExportDocument {
  const rateMode: RateMode = 'include';
  const site = calcSiteMeasure(state);
  const unit = state.allowances.unit;
  const columns: ExportColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'schedule', label: 'Schedule (W-01 block)' },
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
    { key: 'amount', label: 'Package ₹' },
  ];
  const openingBlocks: ExportOpeningBlock[] = [];
  const rows = site.rows.map((r, i) => {
    const lineUnit = r.line.unit || unit;
    const block = buildOpeningBlock(
      enrichOpeningNarrative(state, {
        index: i + 1,
        location: r.line.location || '—',
        width: r.line.width,
        height: r.line.height,
        unit: lineUnit,
        qty: r.line.qty,
        areaSqft: r.totalSqft,
        windowTypeName: r.typeName,
        glassDoors: r.line.glassDoors,
        meshDoors: r.line.meshDoors,
        meshType: r.line.meshType ?? null,
        windowTypeId: r.line.windowTypeId,
        glassTypeId: r.line.glassTypeId,
        colourId: r.line.colourId,
        lockHandleLabel: r.line.lockHandleLabel,
        doorExtraKind: r.line.doorExtraKind,
        notes: r.line.notes ?? '',
        ratePerSqft: null,
        actualAmount: r.amount,
        discountPercent: r.hasDiscount ? r.discountPercent : null,
        discountAmount: r.hasDiscount ? r.discountAmount : null,
        amount: r.selling,
      }),
    );
    openingBlocks.push(block);
    return {
      code: block.code,
      schedule: block.text,
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
      amount: formatNum(r.selling, 0),
    };
  });

  openingBlocks.push(...appendCustomOpeningBlocks(state, openingBlocks.length + 1));

  const custom = calcCustomQuoteLines(state);
  const taxable = site.totalSelling + custom.totalSelling;
  const gstInfo = resolveQuoteGst(state);
  const gst = gstInfo.apply && gstInfo.percent > 0 ? (taxable * gstInfo.percent) / 100 : 0;
  const grand = taxable + gst;

  const summary: ExportSummaryRow[] = [
    { label: 'Openings (qty)', value: String(site.totalQty) },
    { label: 'Chargeable sqft', value: formatNum(site.totalSqft) },
    { label: 'Mesh add-on', value: formatInr(site.totalMeshAmount) },
    { label: 'Measured value (actual)', value: formatInr(site.totalAmount) },
    { label: 'Measured value (selling)', value: formatInr(site.totalSelling) },
    ...(custom.totalSelling > 0
      ? [{ label: 'Custom products', value: formatInr(custom.totalSelling) }]
      : []),
    { label: 'Taxable total', value: formatInr(taxable) },
    ...gstSummaryRows(state, gst, grand),
  ];

  return {
    kind: 'quote',
    title: 'Quotation',
    subtitle: '',
    letterhead: buildLetterhead(state, {
      customerName: state.quote.customerName || state.jobMeta.customerName || '',
      siteAddress: state.quote.siteAddress || state.jobMeta.siteAddress || '',
    }),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || state.jobMeta.customerName || '—' },
      { label: 'Site', value: state.quote.siteAddress || state.jobMeta.siteAddress || '—' },
      {
        label: 'GST',
        value: gstInfo.apply ? `${formatNum(gstInfo.percent, 2)}% on grand` : 'Off for this quote',
      },
    ],
    openingBlocks,
    tables: [{ title: 'Site measured openings', columns, rows, pdfSkipWhenBlocks: true }],
    summary,
    footerSections: quoteFooter(state),
    footnote: undefined,
    rateMode,
    filenameBase: `quote-${state.quote.quoteNo || 'openings'}`,
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

/** Per-opening fabrication size list (actual → less → net + hardwares / design). */
export function buildWindowSizeListDocument(
  state: AppState,
  rateMode: RateMode,
  source: DeliverableSource = 'site-measure',
): ExportDocument {
  const rows = buildWindowSizeList(state, source);
  const label = modeLabel(state);
  const columns: ExportColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'block', label: 'Size list block' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Window type' },
    { key: 'actual', label: 'Actual size' },
    { key: 'qty', label: 'Qty' },
    { key: 'lessW', label: 'Less W' },
    { key: 'lessH', label: 'Less H' },
    { key: 'net', label: 'Net fab size' },
    { key: 'design', label: 'Hardwares / design' },
    { key: 'sqft', label: 'Area sqft' },
    { key: 'rate', label: 'Rate ₹/sqft', isRate: true },
    { key: 'amount', label: 'Amount ₹', isRate: true },
  ];
  const tableRows = rows.map((r) => ({
    code: r.code,
    block: r.blockText,
    location: r.location,
    type: r.typeSummary,
    actual: r.actualSize,
    qty: r.qty,
    lessW: formatNum(r.lessW, 0),
    lessH: formatNum(r.lessH, 0),
    net: r.netSize,
    design: r.designSummary,
    sqft: formatNum(r.areaSqft),
    rate: r.ratePerSqft != null ? formatNum(r.ratePerSqft, 0) : '',
    amount: r.amount != null ? formatNum(r.amount, 0) : '',
  }));
  const sizeListBlocks = rows.map((r) => ({ code: r.code, lines: r.blockLines, text: r.blockText }));
  return {
    kind: 'size-list',
    title: 'Window size list',
    subtitle: `Per opening · actual → less → net fab · Mode ${label}`,
    letterhead: buildLetterhead(state, {
      customerName: state.quote.customerName || state.jobMeta.customerName || '',
      siteAddress: state.quote.siteAddress || state.jobMeta.siteAddress || '',
    }),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || state.jobMeta.customerName || '—' },
      { label: 'Site', value: state.quote.siteAddress || state.jobMeta.siteAddress || '—' },
      { label: 'Source', value: source },
      { label: 'Rates', value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts' },
    ],
    sizeListBlocks,
    tables: [{ title: 'Window size list', columns, rows: tableRows, pdfSkipWhenBlocks: true }],
    summary: [
      { label: 'Openings', value: String(rows.length) },
      { label: 'Total qty', value: String(rows.reduce((s, r) => s + r.qty, 0)) },
      { label: 'Total sqft', value: formatNum(rows.reduce((s, r) => s + r.areaSqft, 0)) },
    ],
    footnote: 'Less-off from Settings / project / row. Hardwares & design from series + glass/colour/mesh masters. No invented rates.',
    rateMode,
    filenameBase: `window-size-list-${source}-${state.quote.quoteNo || 'fab'}`,
  };
}

export function buildHardwareProfileBoqDocument(
  state: AppState,
  rateMode: RateMode,
  source: DeliverableSource = 'site-measure',
): ExportDocument {
  const boq = buildHardwareProfileBoq(state, source);
  const label = modeLabel(state);
  const columns: ExportColumn[] = [
    { key: 'kind', label: 'Kind' },
    { key: 'line', label: 'BOQ line' },
    { key: 'name', label: 'Item' },
    { key: 'nos', label: 'Nos / qty' },
    { key: 'unit', label: 'Unit' },
    { key: 'stockFt', label: 'Stock ft' },
    { key: 'metres', label: 'Cut m' },
    { key: 'rate', label: 'Rate ₹', isRate: true },
    { key: 'amount', label: 'Amount ₹', isRate: true },
  ];
  const tableRows = boq.rows.map((r) => ({
    kind: r.kind,
    line: r.lineText,
    name: r.name,
    nos: formatNum(r.nos, 0),
    unit: r.unit,
    stockFt: r.stockLengthFt != null ? formatNum(r.stockLengthFt, 0) : '',
    metres: r.metres > 0 ? formatNum(r.metres) : '',
    rate: formatNum(r.rate, 0),
    amount: formatNum(r.amount, 0),
  }));
  const summary: ExportSummaryRow[] =
    rateMode === 'include'
      ? [
          { label: 'Profile lines', value: String(boq.profileRows.length) },
          { label: 'Stock bars', value: String(boq.totalBars) },
          { label: 'Cut metres', value: formatNum(boq.totalMetres) },
          { label: 'Hardware lines', value: String(boq.hardwareRows.length) },
          { label: 'Profile ₹', value: formatInr(boq.profileAmount), isRate: true },
          { label: 'Hardware ₹', value: formatInr(boq.hardwareAmount), isRate: true },
        ]
      : [
          { label: 'Profile lines', value: String(boq.profileRows.length) },
          { label: 'Stock bars', value: String(boq.totalBars) },
          { label: 'Cut metres', value: formatNum(boq.totalMetres) },
          { label: 'Hardware lines', value: String(boq.hardwareRows.length) },
          { label: 'Hardware qty', value: formatNum(boq.totalHardwareQty, 0) },
        ];
  return {
    kind: 'profile-boq',
    title: 'Hardware / profile BOQ',
    subtitle: `Series members + cutting + hardware · Mode ${label}`,
    letterhead: buildLetterhead(state, {
      customerName: state.quote.customerName || state.jobMeta.customerName || '',
      siteAddress: state.quote.siteAddress || state.jobMeta.siteAddress || '',
    }),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || state.jobMeta.customerName || '—' },
      { label: 'Site', value: state.quote.siteAddress || state.jobMeta.siteAddress || '—' },
      { label: 'Source', value: source },
      { label: 'Rates', value: rateMode === 'include' ? 'Including rates / amounts' : 'Excluding rates / amounts' },
    ],
    boqLines: boq.rows.map((r) => r.lineText),
    tables: [
      { title: 'Profile stock bars', columns, rows: tableRows.filter((r) => r.kind === 'profile') },
      { title: 'Hardware', columns, rows: tableRows.filter((r) => r.kind === 'hardware') },
    ],
    summary,
    footnote: 'Stock length from Settings profiles; member metres from series masters. Hardware from series + catalogue BOM. Rates Settings-driven only.',
    rateMode,
    filenameBase: `profile-boq-${source}-${state.quote.quoteNo || 'materials'}`,
  };
}

/** Alias — some siblings/patches import this shorter name. Prefer buildHardwareProfileBoqDocument. */
export const buildProfileBoqDocument = buildHardwareProfileBoqDocument;

export function documentToCsv(doc: ExportDocument): string {
  const lines: string[] = [];
  lines.push(csvCell(doc.title));
  lines.push(csvCell(doc.subtitle));
  lines.push('');
  for (const m of doc.meta) {
    lines.push([csvCell(m.label), csvCell(m.value)].join(','));
  }
  lines.push('');
  if (doc.sizeListBlocks?.length) {
    lines.push(csvCell('Window size list'));
    for (const b of doc.sizeListBlocks) { lines.push(csvCell(b.text)); lines.push(''); }
  }
  if (doc.boqLines?.length) {
    lines.push(csvCell('BOQ lines'));
    for (const line of doc.boqLines) lines.push(csvCell(line));
    lines.push('');
  }
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
  if (doc.footerSections?.length) {
    lines.push('');
    for (const s of doc.footerSections) {
      lines.push([csvCell(s.title), csvCell(s.body)].join(','));
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

function renderDotRow(description: string, rate: string, amount: string): string {
  const rateCell = rate ? `<span class="dot-rate">${escHtml(rate)}</span>` : '';
  return `<div class="dot-row">
  <span class="dot-desc">${escHtml(description)}</span>
  <span class="dot-lead" aria-hidden="true"></span>
  ${rateCell}
  <span class="dot-amount">${escHtml(amount)}</span>
</div>`;
}

/** Professional print stack — never monospace for customer quote narrative. */
const PRINT_FONT =
  'Inter,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,Georgia,"Times New Roman",serif';

/** W-01 location header bold; remaining narrative lines regular. */
function renderOpeningNarrativeHtml(lines: string[]): string {
  if (!lines.length) return '';
  const [head, ...rest] = lines;
  const headHtml = `<div class="opening-head">${escHtml(head)}</div>`;
  const restHtml = rest.map((line) => `<div class="opening-line">${escHtml(line)}</div>`).join('');
  return `<div class="opening-narrative">${headHtml}${restHtml}</div>`;
}

function letterheadHtml(
  lh: ExportLetterhead,
  title: string,
  subtitle: string,
  rateMode: RateMode,
  kind?: ExportDocKind,
): string {
  const logo = lh.logoUrl
    ? `<img class="lh-logo" src="${escHtml(lh.logoUrl)}" alt="Logo"/>`
    : '';
  const contactBits = [lh.phone, lh.email, lh.website].filter(Boolean).join(' · ');
  const gstLine = lh.gstin ? `<div><span class="gst-label">GST</span> ${escHtml(lh.gstin)}</div>` : '';
  // Quotes: clean letterhead — title + quote no/date only (no mode / package badges).
  const isQuote = kind === 'quote';
  const displayTitle = isQuote ? 'Quotation' : title;
  const badge = isQuote
    ? ''
    : `<span class="badge">${rateMode === 'include' ? 'With rates' : 'No rates'}</span>`;
  const subHtml =
    !isQuote && subtitle ? `<div class="sub">${escHtml(subtitle)}</div>` : '';
  return `<header class="letterhead">
  <div class="lh-company">
    ${logo}
    <div>
      <h1 class="lh-name">${escHtml(lh.companyName)}</h1>
      ${lh.address ? `<div class="lh-line">${escHtml(lh.address)}</div>` : ''}
      ${contactBits ? `<div class="lh-line">${escHtml(contactBits)}</div>` : ''}
      ${gstLine}
    </div>
  </div>
  <div class="lh-doc">
    <strong>${escHtml(displayTitle)}</strong>
    ${badge}
    ${subHtml}
    ${lh.quoteNo || lh.quoteDate ? `<div class="lh-line">${escHtml([lh.quoteNo, lh.quoteDate].filter(Boolean).join(' · '))}</div>` : ''}
  </div>
</header>
<section class="party">
  <div>
    <div class="party-lbl">Customer</div>
    <strong>${escHtml(lh.customerName || '—')}</strong>
    ${lh.customerPhone ? `<div class="lh-line">${escHtml(lh.customerPhone)}</div>` : ''}
  </div>
  <div>
    <div class="party-lbl">Site</div>
    <strong>${escHtml(lh.siteAddress || '—')}</strong>
  </div>
</section>`;
}

export function documentToHtml(doc: ExportDocument): string {
  const hasLetterhead = Boolean(doc.letterhead);
  const metaHtml = hasLetterhead
    ? ''
    : doc.meta
        .map((m) => `<div><span class="lbl">${escHtml(m.label)}</span> ${escHtml(m.value)}</div>`)
        .join('');
  const headHtml = hasLetterhead
    ? letterheadHtml(doc.letterhead!, doc.title, doc.subtitle, doc.rateMode, doc.kind)
    : `<h1>${escHtml(doc.title)}<span class="badge">${doc.rateMode === 'include' ? 'With rates' : 'No rates'}</span></h1>
  <div class="sub">${escHtml(doc.subtitle)}</div>
  <div class="meta">${metaHtml}</div>`;

  const hasBlocks = Boolean(doc.openingBlocks?.length);
  const hasSizeBlocks = Boolean(doc.sizeListBlocks?.length);
  const hasBoqLines = Boolean(doc.boqLines?.length);
  const skipTablesForBlocks = hasBlocks || hasSizeBlocks;
  const blocksHtml = hasBlocks
    ? `<h2>Opening schedule</h2>
<div class="openings">
${doc.openingBlocks!
  .map((b) => {
    const narrativeLines = b.narrativeLines?.length ? b.narrativeLines : b.lines;
    // Quote package layout: amount only (no ₹/sqft rate column).
    const rateForRow = doc.kind === 'quote' ? '' : b.rateText || '';
    const rateRow =
      rateForRow || b.amountText
        ? renderDotRow(b.code, rateForRow, b.amountText || '')
        : '';
    return `<div class="opening-block">${renderOpeningNarrativeHtml(narrativeLines)}${rateRow}</div>`;
  })
  .join('\n')}
</div>`
    : '';
  const sizeListHtml = hasSizeBlocks
    ? `<h2>Window size list</h2>\n<div class="openings">\n${doc.sizeListBlocks!.map((b) => `<div class="opening-block size-list-block"><pre>${escHtml(b.lines.join('\n'))}</pre></div>`).join('\n')}\n</div>` : '';
  const boqHtml = hasBoqLines
    ? `<h2>Hardware / profile BOQ</h2>\n<ul class="boq-lines">\n${doc.boqLines!.map((line) => `<li>${escHtml(line)}</li>`).join('\n')}\n</ul>` : '';
  const tablesHtml = (hasBoqLines ? [] : doc.tables.filter((table) => !(skipTablesForBlocks && table.pdfSkipWhenBlocks))).map((table) => {
      const cols = visibleColumns(table.columns, doc.rateMode).filter(
        (c) => !(hasBlocks && (c.key === 'schedule' || c.key === 'code')),
      );
      if (!cols.length) return '';
      const head = cols.map((c) => `<th>${escHtml(c.label)}</th>`).join('');
      const body =
        table.rows.length === 0
          ? `<tr><td colspan="${cols.length}">No rows</td></tr>`
          : table.rows
              .map(
                (row) =>
                  `<tr>${cols
                    .map((c) => {
                      const raw = String(row[c.key] ?? '');
                      const html = escHtml(raw).replace(/\n/g, '<br/>');
                      return `<td>${html}</td>`;
                    })
                    .join('')}</tr>`,
              )
              .join('');
      return `<h2>${escHtml(table.title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join('');
  const summaryHtml = doc.summary
    .filter((s) => !(doc.rateMode === 'exclude' && s.isRate))
    .map((s) => {
      // Dotted leader: description .... value (rate+amount style for money rows)
      if (s.isRate || /₹|INR|total|GST|subtotal|discount|advance|balance/i.test(s.label)) {
        return renderDotRow(s.label, '', s.value);
      }
      return renderDotRow(s.label, '', s.value);
    })
    .join('');
  const footerSectionsHtml = (doc.footerSections || [])
    .map(
      (s) =>
        `<div class="foot-sec"><div class="foot-title">${escHtml(s.title)}</div><div class="foot-body">${escHtml(s.body).replace(/\n/g, '<br/>')}</div></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escHtml(doc.title)}</title>
<style>
  @page{margin:18mm 16mm}
  body{font:13px/1.45 ${PRINT_FONT};color:#0f172a;margin:0;padding:18mm 16mm;max-width:none;box-sizing:border-box}
  h1{font-size:20px;margin:0 0 4px;font-family:${PRINT_FONT}}
  .sub{color:#64748b;margin:2px 0 0;font-size:12px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:16px;font-size:12px}
  .lbl{color:#64748b;display:inline-block;min-width:88px}
  h2{font-size:14px;margin:18px 0 6px;font-family:${PRINT_FONT}}
  .letterhead{display:flex;justify-content:space-between;gap:16px;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid #0b3a5b}
  .lh-company{display:flex;gap:12px;align-items:flex-start;min-width:0}
  .lh-logo{max-height:64px;max-width:120px;object-fit:contain}
  .lh-name{font-size:18px;margin:0 0 4px;color:#0b3a5b;font-family:${PRINT_FONT}}
  .lh-line{font-size:12px;color:#475569;margin-top:2px}
  .gst-label{font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#0b3a5b}
  .lh-doc{text-align:right;min-width:160px}
  .party{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:13px}
  .party-lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px}
  .openings{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
  .opening-block{border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;background:#fff}
  .opening-narrative{margin:0 0 8px;font:13px/1.55 ${PRINT_FONT};color:#0f172a}
  .opening-head{font-weight:700;font-size:13.5px;margin:0 0 6px;color:#0b3a5b;font-family:${PRINT_FONT}}
  .opening-line{margin:0 0 2px}
  .size-list-block pre{margin:0;font:13px/1.5 ${PRINT_FONT};white-space:pre-wrap;color:#0f172a}
  .boq-lines{list-style:none;padding:0;margin:0 0 12px;font:13px/1.55 ${PRINT_FONT}}
  .boq-lines li{padding:4px 0;border-bottom:1px dotted #cbd5e1}
  .dot-row{display:flex;align-items:baseline;gap:8px;width:100%;margin-top:4px;font-size:13px;font-family:${PRINT_FONT}}
  .dot-desc{flex:0 1 auto;max-width:55%;color:#0f172a}
  .dot-lead{flex:1 1 auto;border-bottom:1px dotted #94a3b8;min-width:16px;transform:translateY(-3px)}
  .dot-rate,.dot-amount{flex:0 0 auto;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;min-width:4.5rem}
  .dot-rate{color:#334155;min-width:5.5rem}
  .dot-amount{min-width:6rem}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;font-family:${PRINT_FONT}}
  th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left;vertical-align:top}
  th{background:#f1f5f9;font-size:11px}
  .sums{margin-top:14px;display:flex;flex-direction:column;gap:6px;max-width:520px;margin-left:auto}
  .foot{margin-top:16px;font-size:11px;color:#64748b}
  .foot-sec{margin-top:12px;max-width:640px}
  .foot-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#0b3a5b;margin-bottom:2px}
  .foot-body{font-size:12px;color:#334155;white-space:pre-wrap}
  .badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#ecfeff;color:#0e7490;font-size:11px;font-weight:600}
  @media print{
    body{padding:0;margin:0}
    .noprint{display:none}
    .opening-block{break-inside:avoid}
  }
</style></head><body>
  ${headHtml}
  ${blocksHtml}
  ${sizeListHtml}
  ${boqHtml}
  ${tablesHtml}
  <div class="sums">${summaryHtml}</div>
  ${footerSectionsHtml}
  ${doc.footnote ? `<p class="foot">${escHtml(doc.footnote)}</p>` : ''}
</body></html>`;
}

/** @deprecated Prefer downloadPdfDocument — kept for smoke HTML preview helpers. */
export function openPrintPdf(doc: ExportDocument): void {
  const html = documentToHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!w) {
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function runExport(doc: ExportDocument, format: ExportFormat): Promise<void> {
  if (format === 'excel') {
    const { downloadExcelDocument } = await import('./exportExcel');
    await downloadExcelDocument(doc);
    return;
  }
  const { downloadPdfDocument } = await import('./exportPdf');
  await downloadPdfDocument(doc);
}
