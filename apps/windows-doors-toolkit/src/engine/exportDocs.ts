import { calcHardwareJob, calcQuote, calcSiteMeasure, formatInr, formatNum } from './calcs';
import {
  calcConfiguratorCart,
  calcModeQuote,
  modeAdjustedLineAmount,
} from './modePricing';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import { meshTypeLabel, resolveMeshCosting } from './meshCosting';
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
  rateMode: RateMode;
  filenameBase: string;
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
    glassLabel: formatGlassLabel(glass),
    lockHandleLabel,
    meshType: partial.meshType ?? null,
    meshThicknessMm: mesh.defaultThicknessMm,
    meshColour: mesh.defaultColour,
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
  const label = modeLabel(state);
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
        amount: r.estimate,
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
      amount: formatNum(r.estimate, 0),
    };
  });

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
    { label: 'Windows subtotal', value: formatInr(q.windowsSubtotal) },
    { label: 'Mesh + grill', value: formatInr(q.mesh.total) },
    { label: 'After discount', value: formatInr(q.afterDiscount) },
    { label: 'GST', value: formatInr(q.gst) },
    { label: 'Grand total', value: formatInr(q.grand) },
    { label: 'Advance', value: formatInr(q.advance) },
    { label: 'Balance', value: formatInr(q.balance) },
  ];

  return {
    kind: 'quote',
    title: 'Quotation',
    subtitle: `${state.quote.quoteNo || 'Draft'} · ${state.quote.quoteDate || '—'} · Mode ${label}`,
    letterhead: buildLetterhead(state),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || '—' },
      { label: 'Phone', value: state.quote.phone || '—' },
      { label: 'Site', value: state.quote.siteAddress || '—' },
      { label: 'Valid till', value: q.validTill || '—' },
      { label: 'Amounts', value: 'Package amount per opening (no ₹/sqft)' },
    ],
    openingBlocks,
    tables: [
      { title: 'Window schedule', columns, rows, pdfSkipWhenBlocks: true },
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

/** Configurator mode quote (cart lines with glass / colour). Package amount only. */
export function buildConfiguratorQuoteDocument(
  state: AppState,
  _rateMode: RateMode = 'include',
): ExportDocument {
  const rateMode: RateMode = 'include';
  const cart = calcConfiguratorCart(state);
  const modeQuote = calcModeQuote(state);
  const label = modeLabel(state);
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
    const adj = modeAdjustedLineAmount(lineRetail, modeQuote);
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
        amount: adj.amount,
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
      modeAmount: formatNum(adj.amount, 0),
    };
  });

  const summary: ExportSummaryRow[] = [
    { label: 'Retail subtotal', value: formatInr(modeQuote.retailSubtotal) },
    {
      label: `Mode discount (${modeQuote.discountPercent}%)`,
      value: formatInr(modeQuote.discountAmount),
    },
    { label: 'After mode discount', value: formatInr(modeQuote.afterModeDiscount) },
    { label: 'GST', value: formatInr(modeQuote.gst) },
    { label: 'Grand total', value: formatInr(modeQuote.grand) },
  ];

  return {
    kind: 'quote',
    title: 'Mode quote',
    subtitle: `${label} · ${modeQuote.pricingNote}`,
    letterhead: buildLetterhead(state),
    meta: [
      ...businessMeta(state),
      { label: 'Quote no', value: state.quote.quoteNo || '—' },
      { label: 'Mode', value: label },
      { label: 'Amounts', value: 'Package amount per opening (no ₹/sqft)' },
    ],
    openingBlocks,
    tables: [{ title: 'Quote lines', columns, rows, pdfSkipWhenBlocks: true }],
    summary,
    footnote: state.quote.notes || undefined,
    rateMode,
    filenameBase: `mode-quote-${state.quote.quoteNo || 'configurator'}`,
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
  const label = modeLabel(state);
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
        amount: r.amount,
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
      amount: formatNum(r.amount, 0),
    };
  });

  const summary: ExportSummaryRow[] = [
    { label: 'Openings (qty)', value: String(site.totalQty) },
    { label: 'Chargeable sqft', value: formatNum(site.totalSqft) },
    { label: 'Mesh add-on', value: formatInr(site.totalMeshAmount) },
    { label: 'Measured value', value: formatInr(site.totalAmount) },
  ];

  return {
    kind: 'quote',
    title: 'Site measure quote',
    subtitle: `Measured openings · Mode ${label}`,
    letterhead: buildLetterhead(state, {
      customerName: state.quote.customerName || state.jobMeta.customerName || '',
      siteAddress: state.quote.siteAddress || state.jobMeta.siteAddress || '',
    }),
    meta: [
      ...businessMeta(state),
      { label: 'Customer', value: state.quote.customerName || state.jobMeta.customerName || '—' },
      { label: 'Site', value: state.quote.siteAddress || state.jobMeta.siteAddress || '—' },
      { label: 'Amounts', value: 'Package amount per opening (no ₹/sqft)' },
    ],
    openingBlocks,
    tables: [{ title: 'Site measured openings', columns, rows, pdfSkipWhenBlocks: true }],
    summary,
    footnote:
      'Site measure package amounts from editable opening rates (₹/sqft, Mesh ₹, Amount). Push to Openings/Configurator for full quotation.',
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

function renderDotRow(description: string, rate: string, amount: string): string {
  const rateCell = rate ? `<span class="dot-rate">${escHtml(rate)}</span>` : '';
  return `<div class="dot-row">
  <span class="dot-desc">${escHtml(description)}</span>
  <span class="dot-lead" aria-hidden="true"></span>
  ${rateCell}
  <span class="dot-amount">${escHtml(amount)}</span>
</div>`;
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
  const badge =
    kind === 'quote'
      ? 'Package amounts'
      : rateMode === 'include'
        ? 'With rates'
        : 'No rates';
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
    <strong>${escHtml(title)}</strong>
    <span class="badge">${badge}</span>
    <div class="sub">${escHtml(subtitle)}</div>
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

function documentToHtml(doc: ExportDocument): string {
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
  const blocksHtml = hasBlocks
    ? `<h2>Opening schedule</h2>
<div class="openings">
${doc.openingBlocks!
  .map((b) => {
    const narrative = (b.narrativeLines?.length ? b.narrativeLines : b.lines).join('\n');
    const rateRow =
      b.rateText || b.amountText
        ? renderDotRow(b.code, b.rateText || '', b.amountText || '')
        : '';
    return `<div class="opening-block"><pre>${escHtml(narrative)}</pre>${rateRow}</div>`;
  })
  .join('\n')}
</div>`
    : '';
  const tablesHtml = doc.tables
    .filter((table) => !(hasBlocks && table.pdfSkipWhenBlocks))
    .map((table) => {
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

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escHtml(doc.title)}</title>
<style>
  @page{margin:18mm 16mm}
  body{font:13px/1.45 system-ui,Segoe UI,sans-serif;color:#0f172a;margin:0;padding:18mm 16mm;max-width:none;box-sizing:border-box}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:#64748b;margin:2px 0 0;font-size:12px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:16px;font-size:12px}
  .lbl{color:#64748b;display:inline-block;min-width:88px}
  h2{font-size:14px;margin:18px 0 6px}
  .letterhead{display:flex;justify-content:space-between;gap:16px;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid #0b3a5b}
  .lh-company{display:flex;gap:12px;align-items:flex-start;min-width:0}
  .lh-logo{max-height:64px;max-width:120px;object-fit:contain}
  .lh-name{font-size:18px;margin:0 0 4px;color:#0b3a5b}
  .lh-line{font-size:12px;color:#475569;margin-top:2px}
  .gst-label{font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#0b3a5b}
  .lh-doc{text-align:right;min-width:160px}
  .party{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:13px}
  .party-lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px}
  .openings{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
  .opening-block{border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;background:#fff}
  .opening-block pre{margin:0 0 8px;font:13px/1.5 Consolas,ui-monospace,Segoe UI,monospace;white-space:pre-wrap;color:#0f172a}
  .dot-row{display:flex;align-items:baseline;gap:8px;width:100%;margin-top:4px;font-size:13px}
  .dot-desc{flex:0 1 auto;max-width:55%;color:#0f172a}
  .dot-lead{flex:1 1 auto;border-bottom:1px dotted #94a3b8;min-width:16px;transform:translateY(-3px)}
  .dot-rate,.dot-amount{flex:0 0 auto;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;min-width:4.5rem}
  .dot-rate{color:#334155;min-width:5.5rem}
  .dot-amount{min-width:6rem}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left;vertical-align:top}
  th{background:#f1f5f9;font-size:11px}
  .sums{margin-top:14px;display:flex;flex-direction:column;gap:6px;max-width:520px;margin-left:auto}
  .foot{margin-top:16px;font-size:11px;color:#64748b}
  .badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#ecfeff;color:#0e7490;font-size:11px;font-weight:600}
  @media print{
    body{padding:0;margin:0}
    .noprint{display:none}
    .opening-block{break-inside:avoid}
  }
</style></head><body>
  ${headHtml}
  ${blocksHtml}
  ${tablesHtml}
  <div class="sums">${summaryHtml}</div>
  ${doc.footnote ? `<p class="foot">${escHtml(doc.footnote)}</p>` : ''}
  <p class="foot noprint">Use the browser Print dialog → Save as PDF.</p>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`;
}

export function openPrintPdf(doc: ExportDocument): void {
  const html = documentToHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  // Blob URL so noopener popups still receive the document (document.write is null with noopener).
  const w = window.open(url, '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.filenameBase}-${doc.rateMode}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
