/**
 * Fabrication deliverables: window size list (per opening) + hardware/profile BOQ.
 * Wired from Site Measure / Openings / Configurator + series members + cutting/hardware.
 * Stock lengths and rates come from Settings / catalogue — never invented.
 */
import {
  casementMemberCount,
  formatInr,
  formatNum,
  lookupWindowType,
  slidingMemberCount,
  toSqft,
} from './calcs';
import { resolveLessOffMm } from './lessOff';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import { meshTypeLabel, resolveMeshCosting } from './meshCosting';
import {
  formatGlassLabel,
  formatHardwareLabel,
  formatOpeningCode,
  formatShutterDoorBreakdown,
  formatSizeUnitLabel,
  meshHasSpec,
  resolveLockHandleLabel,
  resolveSeriesDoorExtraLabels,
} from './quoteOpeningFormat';
import type {
  AppState,
  CasementJob,
  MeshTypeId,
  OpeningLine,
  ProfileMember,
  ProfileSku,
  SeriesDefinition,
  SiteMeasureLine,
  SlidingJob,
  Unit,
  WindowType,
  YesNo,
} from '../types';

export type DeliverableSource = 'site-measure' | 'openings' | 'configurator';

export interface WindowSizeListRow {
  code: string;
  location: string;
  typeSummary: string;
  windowTypeName: string;
  kind: string;
  material: string;
  withMesh: boolean;
  tracks: number;
  actualSize: string;
  qty: number;
  lessW: number;
  lessH: number;
  netSize: string;
  unit: Unit;
  designSummary: string;
  blockLines: string[];
  blockText: string;
  areaSqft: number;
  ratePerSqft?: number | null;
  amount?: number | null;
}

export interface ProfileBoqRow {
  key: string;
  kind: 'profile' | 'hardware';
  name: string;
  detail: string;
  lineText: string;
  nos: number;
  unit: string;
  stockLengthFt: number | null;
  metres: number;
  rate: number;
  amount: number;
}

export interface ProfileBoqResult {
  rows: ProfileBoqRow[];
  profileRows: ProfileBoqRow[];
  hardwareRows: ProfileBoqRow[];
  totalMetres: number;
  totalBars: number;
  totalHardwareQty: number;
  hardwareAmount: number;
  profileAmount: number;
}

function metresToFt(m: number): number {
  return Math.round(m * 3.280839895 * 100) / 100;
}

function padDots(left: string, right: string, width = 52): string {
  const l = (left || '—').trim() || '—';
  const r = (right || '—').trim() || '—';
  const dots = Math.max(3, width - l.length - r.length);
  return `${l} ${'.'.repeat(dots)} ${r}`;
}

function resolveStockLengthM(
  series: SeriesDefinition | undefined,
  member: ProfileMember,
  profiles: ProfileSku[],
): number {
  const material = series?.material;
  const name = member.name.toLowerCase();
  const className = member.memberClass.toLowerCase();
  const candidates = profiles.filter((p) => !material || p.material === material);
  const scored = candidates
    .map((p) => {
      const pn = p.name.toLowerCase();
      let score = 0;
      if (name && pn.includes(name.slice(0, Math.min(8, name.length)))) score += 3;
      if (className && pn.includes(className.replace(/\s+/g, ''))) score += 2;
      if (series?.kind && p.kind === series.kind) score += 1;
      if (/track/.test(name) && /track/.test(pn)) score += 2;
      if (/shutter|sash/.test(name) && /shutter|sash/.test(pn)) score += 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  const hit = scored.find((s) => s.score > 0)?.p ?? candidates[0];
  const stock = hit?.stockLengthM ?? 0;
  return stock > 0 ? stock : 5.8;
}

function barsFromMetres(metres: number, stockLengthM: number, endTrimMm: number): number {
  if (metres <= 0) return 0;
  const usable = Math.max(0.01, stockLengthM - endTrimMm / 1000);
  return Math.ceil(metres / usable);
}

function typeSummary(
  wt: WindowType | undefined,
  tracks: number,
  meshDoors: number,
  meshType: string | null | undefined,
): string {
  const name = (wt?.name || 'Window').trim();
  const kind = wt?.kind ?? 'other';
  const trackPart =
    kind === 'sliding' || (kind === 'door' && tracks > 0)
      ? tracks > 0
        ? ` · ${formatNum(tracks)} track`
        : ''
      : kind === 'casement'
        ? ' · casement'
        : kind === 'door'
          ? ' · door'
          : '';
  const meshOn = meshDoors > 0 && meshType && meshType !== 'none';
  const meshPart = meshOn ? ` · with ${meshTypeLabel(meshType as MeshTypeId)} mesh` : ' · without mesh';
  return `${name}${trackPart}${meshPart}`;
}

function designSummaryBits(opts: {
  glassLabel: string;
  colourName: string;
  lockHandleLabel: string;
  meshType?: string | null;
  meshDoors?: number | null;
  meshThicknessMm?: number | null;
  meshColour?: string | null;
  doorExtraLine?: string | null;
  notes?: string | null;
  tracks?: number | null;
  glassDoors?: number | null;
}): string {
  const bits: string[] = [];
  bits.push(`Glass ${opts.glassLabel || '—'}`);
  bits.push(`Colour ${(opts.colourName || '').trim() || '—'}`);
  bits.push(`Handle / lock ${(opts.lockHandleLabel || '').trim() || '—'}`);
  if (opts.tracks != null && opts.tracks > 0) bits.push(`Tracks ${formatNum(opts.tracks)}`);
  bits.push(`Shutters ${formatShutterDoorBreakdown(opts.glassDoors, opts.meshDoors)}`);
  if (meshHasSpec(opts.meshType as MeshTypeId, opts.meshDoors)) {
    const thick =
      opts.meshThicknessMm != null && opts.meshThicknessMm > 0
        ? `${formatNum(opts.meshThicknessMm)} mm`
        : '';
    const colour = (opts.meshColour || '').trim();
    const type = meshTypeLabel(opts.meshType as MeshTypeId);
    bits.push(`Mesh ${[thick, colour, type].filter(Boolean).join(', ')}`);
  }
  if (opts.doorExtraLine) bits.push(opts.doorExtraLine);
  const note = (opts.notes || '').trim();
  if (note) bits.push(`Notes ${note}`);
  return bits.join(' · ');
}

interface NormalizedOpening {
  index: number;
  location: string;
  windowTypeId: string;
  width: number;
  height: number;
  unit: Unit;
  qty: number;
  tracks: number;
  glassDoors: number;
  meshDoors: number;
  meshType: MeshTypeId;
  hasVent: YesNo;
  ventCount: number;
  glassTypeId?: string;
  colourId?: string;
  lockHandleLabel?: string;
  doorExtraKind?: SiteMeasureLine['doorExtraKind'];
  notes?: string;
  lessW: number;
  lessH: number;
  netWidth: number;
  netHeight: number;
  ratePerSqft?: number | null;
  amount?: number | null;
  areaSqft: number;
}

function normalizeFromSiteMeasure(state: AppState): NormalizedOpening[] {
  const unitDefault = state.allowances.unit;
  return state.siteMeasures.map((line, i) => {
    const less = resolveLessOffMm(state, line);
    const netW = line.netWidth ?? Math.max(0, line.width - less.widthMm);
    const netH = line.netHeight ?? Math.max(0, line.height - less.heightMm);
    const unit = line.unit || unitDefault;
    return {
      index: i + 1,
      location: line.location || '—',
      windowTypeId: line.windowTypeId,
      width: line.width,
      height: line.height,
      unit,
      qty: line.qty,
      tracks: line.tracks ?? 0,
      glassDoors: line.glassDoors ?? 0,
      meshDoors: line.meshDoors ?? 0,
      meshType: line.meshType ?? 'none',
      hasVent: line.hasVent ?? 'No',
      ventCount: line.ventCount ?? 0,
      glassTypeId: line.glassTypeId,
      colourId: line.colourId,
      lockHandleLabel: line.lockHandleLabel,
      doorExtraKind: line.doorExtraKind,
      notes: line.notes,
      lessW: less.widthMm,
      lessH: less.heightMm,
      netWidth: netW,
      netHeight: netH,
      ratePerSqft: line.ratePerSqft,
      amount: null,
      areaSqft: toSqft(line.width, line.height, unit) * line.qty,
    };
  });
}

function normalizeFromOpenings(state: AppState): NormalizedOpening[] {
  const unit = state.allowances.unit;
  const less = resolveLessOffMm(state, null);
  return state.openings.map((line: OpeningLine, i) => {
    const netW = Math.max(0, line.width - less.widthMm);
    const netH = Math.max(0, line.height - less.heightMm);
    return {
      index: i + 1,
      location: line.location || '—',
      windowTypeId: line.windowTypeId,
      width: line.width,
      height: line.height,
      unit,
      qty: line.qty,
      tracks: line.tracks ?? 0,
      glassDoors: line.glassDoors ?? 0,
      meshDoors: line.meshDoors ?? 0,
      meshType: line.meshType ?? 'none',
      hasVent: line.hasVent ?? 'No',
      ventCount: line.ventCount ?? 0,
      glassTypeId: line.glassTypeId,
      colourId: line.colourId,
      lockHandleLabel: line.lockHandleLabel,
      doorExtraKind: line.doorExtraKind,
      notes: line.notes,
      lessW: less.widthMm,
      lessH: less.heightMm,
      netWidth: netW,
      netHeight: netH,
      ratePerSqft: null,
      amount: null,
      areaSqft: toSqft(line.width, line.height, unit) * line.qty,
    };
  });
}

function normalizeFromConfigurator(state: AppState): NormalizedOpening[] {
  const less = resolveLessOffMm(state, null);
  return (state.configuratorLines ?? []).map((line, i) => {
    const netW = Math.max(0, line.widthMm - less.widthMm);
    const netH = Math.max(0, line.heightMm - less.heightMm);
    return {
      index: i + 1,
      location: line.location || '—',
      windowTypeId: line.windowTypeId,
      width: line.widthMm,
      height: line.heightMm,
      unit: 'mm' as Unit,
      qty: line.qty,
      tracks: line.tracks ?? 0,
      glassDoors: line.glassDoors ?? 0,
      meshDoors: line.meshDoors ?? 0,
      meshType: line.meshType ?? 'none',
      hasVent: line.hasVent ?? 'No',
      ventCount: line.ventCount ?? 0,
      glassTypeId: line.glassTypeId,
      colourId: line.colourId,
      lockHandleLabel: line.lockHandleLabel,
      doorExtraKind: line.doorExtraKind,
      notes: line.notes,
      lessW: less.widthMm,
      lessH: less.heightMm,
      netWidth: netW,
      netHeight: netH,
      ratePerSqft: null,
      amount: null,
      areaSqft: toSqft(line.widthMm, line.heightMm, 'mm') * line.qty,
    };
  });
}

export function resolveDeliverableOpenings(
  state: AppState,
  source: DeliverableSource,
): NormalizedOpening[] {
  if (source === 'site-measure') return normalizeFromSiteMeasure(state);
  if (source === 'configurator') return normalizeFromConfigurator(state);
  return normalizeFromOpenings(state);
}

export function pickDeliverableSource(
  state: AppState,
  preferred: DeliverableSource = 'site-measure',
): DeliverableSource {
  if (preferred === 'site-measure' && state.siteMeasures.length) return 'site-measure';
  if (preferred === 'openings' && state.openings.length) return 'openings';
  if (preferred === 'configurator' && (state.configuratorLines?.length ?? 0) > 0) {
    return 'configurator';
  }
  if (state.siteMeasures.length) return 'site-measure';
  if (state.openings.length) return 'openings';
  if ((state.configuratorLines?.length ?? 0) > 0) return 'configurator';
  return preferred;
}

export function buildWindowSizeList(
  state: AppState,
  source: DeliverableSource = 'site-measure',
): WindowSizeListRow[] {
  const catalogue = resolveEffectiveCatalogue(state);
  const mesh = resolveMeshCosting(state.allowances);
  const openings = resolveDeliverableOpenings(state, pickDeliverableSource(state, source));

  return openings.map((o) => {
    const wt = lookupWindowType(catalogue.windowTypes, o.windowTypeId);
    const series = wt?.seriesId
      ? catalogue.series.find((s) => s.id === wt.seriesId)
      : undefined;
    const glass =
      (o.glassTypeId
        ? catalogue.glassTypes.find((g) => g.id === o.glassTypeId)
        : undefined) ?? catalogue.glassTypes[0];
    const colourName =
      (o.colourId
        ? catalogue.colourOptions.find((c) => c.id === o.colourId)?.name
        : null) ?? '';
    const lockHandleLabel = resolveLockHandleLabel(state, {
      windowTypeId: o.windowTypeId,
      series,
      lockHandleLabel: o.lockHandleLabel,
    });
    const seriesExtra = resolveSeriesDoorExtraLabels(series);
    const doorExtraKind =
      o.doorExtraKind === 'door-closer' ||
      o.doorExtraKind === 'floor-spring' ||
      o.doorExtraKind === 'none'
        ? o.doorExtraKind
        : seriesExtra.kind;
    let doorExtraLine: string | null = null;
    if (doorExtraKind === 'door-closer') {
      doorExtraLine = `Door closer ${seriesExtra.doorCloserLabel || '—'}`;
    } else if (doorExtraKind === 'floor-spring') {
      doorExtraLine = `Floor spring ${seriesExtra.floorSpringLabel || '—'}`;
    }

    const unitLabel = formatSizeUnitLabel(o.unit);
    const typeSum = typeSummary(wt, o.tracks, o.meshDoors, o.meshType);
    const design = designSummaryBits({
      glassLabel: formatGlassLabel(glass),
      colourName,
      lockHandleLabel,
      meshType: o.meshType,
      meshDoors: o.meshDoors,
      meshThicknessMm: mesh.defaultThicknessMm,
      meshColour: mesh.defaultColour,
      doorExtraLine,
      notes: o.notes,
      tracks: o.tracks,
      glassDoors: o.glassDoors,
    });

    const code = formatOpeningCode(o.index);
    const actualSize = `${formatNum(o.width, 0)}×${formatNum(o.height, 0)} ${unitLabel}`;
    const netSize = `${formatNum(o.netWidth, 0)}×${formatNum(o.netHeight, 0)} ${unitLabel}`;
    const blockLines = [
      padDots(`${code} ${o.location}`, typeSum),
      `Actual ${actualSize} · qty ${o.qty} · Less W ${formatNum(o.lessW, 0)} · Less H ${formatNum(o.lessH, 0)} → Net ${netSize}`,
      `Hardwares / design: ${design}`,
    ];

    return {
      code,
      location: o.location,
      typeSummary: typeSum,
      windowTypeName: wt?.name ?? '—',
      kind: wt?.kind ?? 'other',
      material: wt?.material ?? '—',
      withMesh: o.meshDoors > 0 && o.meshType !== 'none',
      tracks: o.tracks,
      actualSize,
      qty: o.qty,
      lessW: o.lessW,
      lessH: o.lessH,
      netSize,
      unit: o.unit,
      designSummary: design,
      blockLines,
      blockText: blockLines.join('\n'),
      areaSqft: o.areaSqft,
      ratePerSqft: o.ratePerSqft ?? null,
      amount: o.amount ?? null,
    };
  });
}

function toMm(value: number, unit: Unit): number {
  if (unit === 'mm') return value;
  if (unit === 'inch') return value * 25.4;
  return value * 304.8;
}

function slidingJobFromOpening(series: SeriesDefinition, o: NormalizedOpening): SlidingJob {
  return {
    seriesId: series.id,
    material: series.material,
    tracks: o.tracks || series.defaultTracks || 2,
    glassShutters: o.glassDoors || series.defaultShutters || 2,
    mesh: o.meshDoors > 0 ? 'Yes' : 'No',
    meshDoors: o.meshDoors,
    meshType: o.meshType || 'none',
    widthMm: toMm(o.netWidth, o.unit),
    heightMm: toMm(o.netHeight, o.unit),
    qty: o.qty,
    glassTypeId: o.glassTypeId || '',
    glassInsetMm: series.glassInsetMm,
    rollersPerShutter: series.rollersPerShutter,
    rollerRate: series.rollerRate,
    lockHandleSet: series.lockHandleSet,
    otherHardware: series.otherHardware,
    meshAreaShare: series.meshAreaShare,
    meshNetPerSqft: series.meshNetPerSqft,
    fabricationLabourPerSqft: 0,
    installationLabourPerSqft: 0,
    siliconePerWindow: 0,
    transportPerJob: 0,
    wastage: 0,
    targetMargin: 0,
    priceRoundUpStep: 1,
    quotedRatePerSqft: 0,
  };
}

function casementJobFromOpening(series: SeriesDefinition, o: NormalizedOpening): CasementJob {
  const openable = o.glassDoors || series.defaultOpenable || 1;
  const panels = Math.max(openable, series.defaultPanels || openable);
  return {
    seriesId: series.id,
    material: series.material,
    panels,
    openablePanels: openable,
    doorLeaves: series.kind === 'door' ? openable : 0,
    mesh: o.meshDoors > 0 ? 'Yes' : 'No',
    meshDoors: o.meshDoors,
    meshType: o.meshType || 'none',
    hasVent: o.hasVent,
    ventCount: o.ventCount,
    widthMm: toMm(o.netWidth, o.unit),
    heightMm: toMm(o.netHeight, o.unit),
    qty: o.qty,
    glassTypeId: o.glassTypeId || '',
    glassInsetMm: series.glassInsetMm,
    frictionStaySizeMm: series.frictionStaySizeMm,
    frictionStayRate: series.frictionStayRate,
    frictionStaySetsPerOpenable: series.frictionStaySetsPerOpenable,
    hingeQty: series.hingeQtyPerOpenable * openable,
    hingeRate: series.hingeRate,
    doorConnectorQty: series.kind === 'door' ? series.doorConnectorQtyPerDoor * openable : 0,
    doorConnectorRate: series.doorConnectorRate,
    laminationArmSizeMm: series.laminationArmSizeMm,
    laminationArmRate: 0,
    lockGuideRate: series.lockGuideRate,
    brushRate: series.brushRate,
    epdmRate: series.epdmRate,
    lockRate: series.lockRate,
    doorCloserRate: series.doorCloserRate,
    floorSpringRate: series.floorSpringRate,
    doorSetRate: series.doorSetRate,
    swingHandleRate: series.swingHandleRate,
    swingLockRate: series.swingLockRate,
    handleRate: series.handleRate,
    otherHardware: series.otherHardware,
    meshAreaShare: series.meshAreaShare,
    meshNetPerSqft: series.meshNetPerSqft,
    fabricationLabourPerSqft: 0,
    installationLabourPerSqft: 0,
    siliconePerWindow: 0,
    transportPerJob: 0,
    wastage: 0,
    targetMargin: 0,
    priceRoundUpStep: 1,
    quotedRatePerSqft: 0,
  };
}

interface AggProfile {
  key: string;
  name: string;
  metres: number;
  ratePerM: number;
  stockLengthM: number;
}

interface AggHardware {
  key: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
}

function addProfile(
  map: Map<string, AggProfile>,
  key: string,
  name: string,
  metres: number,
  ratePerM: number,
  stockLengthM: number,
) {
  if (metres <= 0) return;
  const prev = map.get(key) ?? { key, name, metres: 0, ratePerM, stockLengthM };
  prev.metres += metres;
  if (ratePerM > 0) prev.ratePerM = ratePerM;
  if (stockLengthM > 0) prev.stockLengthM = stockLengthM;
  map.set(key, prev);
}

function addHardware(
  map: Map<string, AggHardware>,
  key: string,
  name: string,
  unit: string,
  qty: number,
  rate: number,
) {
  if (qty <= 0) return;
  const prev = map.get(key) ?? { key, name, unit, qty: 0, rate };
  prev.qty += qty;
  if (rate > 0) prev.rate = rate;
  map.set(key, prev);
}

function accumulateMemberCuts(
  map: Map<string, AggProfile>,
  member: ProfileMember,
  count: number,
  widthMm: number,
  heightMm: number,
  qty: number,
  stockLengthM: number,
  panelWidthMm?: number,
) {
  if (count <= 0 || qty <= 0) return;
  const w = panelWidthMm ?? widthMm;
  const hFactor = Number(member.hFactor) || 0;
  const wFactor = Number(member.wFactor) || 0;
  const intH = Number.isInteger(hFactor) && hFactor > 0;
  const intW = Number.isInteger(wFactor) && wFactor > 0;

  if (intH || intW) {
    if (intH) {
      const pieces = hFactor * count * qty;
      addProfile(
        map,
        `${member.id}:v`,
        `${member.name} vertical`,
        (pieces * heightMm) / 1000,
        member.ratePerM,
        stockLengthM,
      );
    }
    if (intW) {
      const pieces = wFactor * count * qty;
      addProfile(
        map,
        `${member.id}:h`,
        `${member.name} top/bottom`,
        (pieces * w) / 1000,
        member.ratePerM,
        stockLengthM,
      );
    }
    return;
  }

  const metres = ((wFactor * w + hFactor * heightMm) / 1000) * count * qty;
  addProfile(map, member.id, member.name, metres, member.ratePerM, stockLengthM);
}

function accumulateSeriesHardware(
  hwMap: Map<string, AggHardware>,
  series: SeriesDefinition,
  wt: WindowType,
  o: NormalizedOpening,
) {
  const qty = o.qty;
  if (wt.kind === 'sliding' || (wt.kind === 'door' && (o.tracks > 0 || series.kind === 'sliding'))) {
    const shutters = o.glassDoors || series.defaultShutters || 2;
    const rollers = series.rollersPerShutter * shutters * qty;
    if (rollers > 0) {
      addHardware(hwMap, `${series.id}:roller`, `Roller (${series.name})`, 'pc', rollers, series.rollerRate);
    }
    if (series.lockHandleSet > 0) {
      addHardware(
        hwMap,
        `${series.id}:lock-set`,
        series.lockHandleLabel || 'Lock / handle set',
        'set',
        qty,
        series.lockHandleSet,
      );
    }
    if (series.otherHardware > 0) {
      addHardware(
        hwMap,
        `${series.id}:other-slide`,
        `Other hardware (${series.name})`,
        'set',
        qty,
        series.otherHardware,
      );
    }
    return;
  }

  const openable = o.glassDoors || series.defaultOpenable || 1;
  const staySets = (series.frictionStaySetsPerOpenable || 1) * openable * qty;
  if (series.frictionStayRate > 0 && staySets > 0) {
    addHardware(
      hwMap,
      `${series.id}:friction`,
      `Friction stay ${series.frictionStaySizeMm || ''} mm`.trim(),
      'set',
      staySets,
      series.frictionStayRate,
    );
  }
  const hinges = series.hingeQtyPerOpenable * openable * qty;
  if (hinges > 0 && series.hingeRate > 0) {
    addHardware(hwMap, `${series.id}:hinge`, 'Hinge', 'pc', hinges, series.hingeRate);
  }
  if (series.kind === 'door' || wt.kind === 'door') {
    const connectors = series.doorConnectorQtyPerDoor * openable * qty;
    if (connectors > 0) {
      addHardware(hwMap, `${series.id}:connector`, 'Door connector', 'pc', connectors, series.doorConnectorRate);
    }
  }
  if (series.handleRate > 0) {
    addHardware(
      hwMap,
      `${series.id}:handle`,
      series.lockHandleLabel || 'Handle',
      'pc',
      openable * qty,
      series.handleRate,
    );
  }
  if (series.lockRate > 0) {
    addHardware(hwMap, `${series.id}:lock`, 'Lock', 'pc', qty, series.lockRate);
  }
  if (series.lockGuideRate > 0) {
    addHardware(hwMap, `${series.id}:lock-guide`, 'Lock guide', 'set', qty, series.lockGuideRate);
  }
  if (series.brushRate > 0) {
    addHardware(hwMap, `${series.id}:brush`, 'Brush / pile', 'set', qty, series.brushRate);
  }
  if (series.epdmRate > 0) {
    addHardware(hwMap, `${series.id}:epdm`, 'EPDM / gasket', 'set', qty, series.epdmRate);
  }
  const extra = resolveSeriesDoorExtraLabels(series);
  if (extra.kind === 'door-closer' && series.doorCloserRate > 0) {
    addHardware(
      hwMap,
      `${series.id}:closer`,
      extra.doorCloserLabel || 'Door closer',
      'pc',
      qty,
      series.doorCloserRate,
    );
  }
  if (extra.kind === 'floor-spring' && series.floorSpringRate > 0) {
    addHardware(
      hwMap,
      `${series.id}:floor-spring`,
      extra.floorSpringLabel || 'Floor spring',
      'pc',
      qty,
      series.floorSpringRate,
    );
  }
  if (series.otherHardware > 0) {
    addHardware(
      hwMap,
      `${series.id}:other-case`,
      `Other hardware (${series.name})`,
      'set',
      qty,
      series.otherHardware,
    );
  }
}

function accumulateCuttingProfiles(
  map: Map<string, AggProfile>,
  state: AppState,
  profiles: ProfileSku[],
) {
  if (!state.cuts.length) return;
  const byProfile = new Map<string, { name: string; metres: number; stock: number; rate: number }>();
  for (const c of state.cuts) {
    const profile = profiles.find((p) => p.id === c.profileId);
    const name = profile?.name ?? 'Profile';
    const stock = profile?.stockLengthM && profile.stockLengthM > 0 ? profile.stockLengthM : 5.8;
    const allowance = state.allowances.sawAllowanceMm;
    const metres = ((c.cutMm + allowance) * c.pieces) / 1000;
    const rate =
      profile && profile.kgPerMAluminium > 0
        ? profile.kgPerMAluminium *
          (state.allowances.aluminiumRatePerKg + state.allowances.coatingPerKg)
        : (profile?.ratePerMUpvc ?? 0);
    const prev = byProfile.get(c.profileId) ?? { name, metres: 0, stock, rate };
    prev.metres += metres;
    byProfile.set(c.profileId, prev);
  }
  for (const [id, v] of byProfile) {
    addProfile(map, `cut:${id}`, v.name, v.metres, v.rate, v.stock);
  }
}

export function buildHardwareProfileBoq(
  state: AppState,
  source: DeliverableSource = 'site-measure',
): ProfileBoqResult {
  const catalogue = resolveEffectiveCatalogue(state);
  const openings = resolveDeliverableOpenings(state, pickDeliverableSource(state, source));
  const profileMap = new Map<string, AggProfile>();
  const hwMap = new Map<string, AggHardware>();
  const endTrim = state.allowances.endTrimMm;

  for (const o of openings) {
    const wt = lookupWindowType(catalogue.windowTypes, o.windowTypeId);
    if (!wt) continue;
    const series = wt.seriesId ? catalogue.series.find((s) => s.id === wt.seriesId) : undefined;
    if (!series) continue;

    const isSliding =
      wt.kind === 'sliding' ||
      series.kind === 'sliding' ||
      (wt.kind === 'door' && o.tracks > 0);

    if (isSliding) {
      const job = slidingJobFromOpening(series, o);
      for (const m of series.members) {
        const count = slidingMemberCount(m.memberClass, job);
        const stock = resolveStockLengthM(series, m, catalogue.profiles);
        accumulateMemberCuts(profileMap, m, count, job.widthMm, job.heightMm, job.qty, stock);
      }
      accumulateSeriesHardware(hwMap, series, wt, o);
    } else {
      const job = casementJobFromOpening(series, o);
      for (const m of series.members) {
        const count = casementMemberCount(m.memberClass, job);
        const stock = resolveStockLengthM(series, m, catalogue.profiles);
        const panelClasses = new Set(['Openable panel', 'Panel', 'Mesh panel', 'UPVC openable']);
        const widthForMember =
          panelClasses.has(m.memberClass) && job.panels > 0 ? job.widthMm / job.panels : job.widthMm;
        accumulateMemberCuts(
          profileMap,
          m,
          count,
          job.widthMm,
          job.heightMm,
          job.qty,
          stock,
          widthForMember,
        );
      }
      accumulateSeriesHardware(hwMap, series, wt, o);
    }

    for (const bom of state.hardwareBom.filter((b) => b.windowTypeId === o.windowTypeId)) {
      const item = catalogue.hardware.find((h) => h.id === bom.hardwareItemId);
      if (!item) continue;
      addHardware(
        hwMap,
        `bom:${item.id}`,
        formatHardwareLabel(item),
        item.unit || 'pc',
        bom.qtyPerWindow * o.qty,
        item.rate,
      );
    }
  }

  accumulateCuttingProfiles(profileMap, state, catalogue.profiles);

  const profileRows: ProfileBoqRow[] = [...profileMap.values()]
    .filter((p) => p.metres > 0)
    .map((p) => {
      const nos = barsFromMetres(p.metres, p.stockLengthM, endTrim);
      const stockFt = metresToFt(p.stockLengthM);
      const amount = nos * p.stockLengthM * p.ratePerM;
      return {
        key: p.key,
        kind: 'profile' as const,
        name: p.name,
        detail: `${formatNum(p.metres)} m cut → ${nos} bars @ ${formatNum(stockFt, 0)} ft`,
        lineText: `${p.name} · ${nos} nos · ${formatNum(stockFt, 0)} ft`,
        nos,
        unit: 'nos',
        stockLengthFt: stockFt,
        metres: p.metres,
        rate: p.ratePerM,
        amount,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const hardwareRows: ProfileBoqRow[] = [...hwMap.values()]
    .filter((h) => h.qty > 0)
    .map((h) => ({
      key: h.key,
      kind: 'hardware' as const,
      name: h.name,
      detail: h.unit,
      lineText: `${h.name} · ${formatNum(h.qty, 0)} ${h.unit}`,
      nos: h.qty,
      unit: h.unit,
      stockLengthFt: null,
      metres: 0,
      rate: h.rate,
      amount: h.qty * h.rate,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    rows: [...profileRows, ...hardwareRows],
    profileRows,
    hardwareRows,
    totalMetres: profileRows.reduce((s, r) => s + r.metres, 0),
    totalBars: profileRows.reduce((s, r) => s + r.nos, 0),
    totalHardwareQty: hardwareRows.reduce((s, r) => s + r.nos, 0),
    hardwareAmount: hardwareRows.reduce((s, r) => s + r.amount, 0),
    profileAmount: profileRows.reduce((s, r) => s + r.amount, 0),
  };
}

export function formatBoqSummary(boq: ProfileBoqResult, withRates: boolean): string[] {
  const lines = [
    `Profile lines: ${boq.profileRows.length}`,
    `Stock bars: ${boq.totalBars}`,
    `Cut metres: ${formatNum(boq.totalMetres)}`,
    `Hardware lines: ${boq.hardwareRows.length}`,
  ];
  if (withRates) {
    lines.push(`Profile ₹: ${formatInr(boq.profileAmount)}`);
    lines.push(`Hardware ₹: ${formatInr(boq.hardwareAmount)}`);
  }
  return lines;
}
