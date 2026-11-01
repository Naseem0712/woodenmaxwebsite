import { formatNum } from './calcs';
import type {
  AppState,
  DoorExtraKind,
  GlassType,
  HardwareItem,
  MeshTypeId,
  SeriesDefinition,
  Unit,
} from '../types';
import { meshTypeLabel } from './meshCosting';

/** Inputs for one opening block on Export Quote PDF / print / Excel schedule. */
export interface QuoteOpeningFormatInput {
  /** 1-based opening index → W-01, W-02… */
  index: number;
  location: string;
  width: number;
  height: number;
  unit: Unit;
  qty: number;
  areaSqft: number;
  /** Window / door type name (e.g. 3-track sliding window) */
  windowTypeName: string;
  glassDoors?: number | null;
  meshDoors?: number | null;
  colourName?: string | null;
  /** e.g. `5 mm clear tuff (Saint-Gobain)` */
  glassLabel?: string | null;
  /** e.g. `Metro Type Matt black lock` */
  lockHandleLabel?: string | null;
  meshType?: MeshTypeId | null;
  meshThicknessMm?: number | null;
  meshColour?: string | null;
  /** Door/casement only — closer OR floor spring, never both */
  doorExtraKind?: DoorExtraKind | null;
  doorCloserLabel?: string | null;
  floorSpringLabel?: string | null;
  /** When set (with-rates PDF), append Rate / Amount lines. */
  ratePerSqft?: number | null;
  amount?: number | null;
  /** Per-opening note shown under the narrative block. */
  notes?: string | null;
}

export function formatOpeningCode(index: number): string {
  return `W-${String(Math.max(1, Math.floor(index))).padStart(2, '0')}`;
}

/** Unit label as selected (mm / inch / ft). */
export function formatSizeUnitLabel(unit: Unit): string {
  if (unit === 'mm') return 'mm';
  if (unit === 'inch') return 'inch';
  return 'ft';
}

/**
 * Shutter/door breakdown from glass + mesh door counts.
 * Example: `2 shutters Glass + 1 shutter mesh`
 */
export function formatShutterDoorBreakdown(
  glassDoors?: number | null,
  meshDoors?: number | null,
): string {
  const g = Math.max(0, Number(glassDoors) || 0);
  const m = Math.max(0, Number(meshDoors) || 0);
  const glassWord = g === 1 ? 'shutter' : 'shutters';
  const meshWord = m === 1 ? 'shutter' : 'shutters';
  return `${g} ${glassWord} Glass + ${m} ${meshWord} mesh`;
}

/** Glass narrative: `5 mm clear tuff (Saint-Gobain)` */
export function formatGlassLabel(glass?: Pick<GlassType, 'name' | 'thicknessMm' | 'brand'> | null): string {
  if (!glass) return '—';
  const name = (glass.name || '').trim() || 'glass';
  const thick = Number(glass.thicknessMm);
  const thickPart = Number.isFinite(thick) && thick > 0 ? `${formatNum(thick)} mm ` : '';
  const brand = (glass.brand || '').trim();
  return brand ? `${thickPart}${name} (${brand})` : `${thickPart}${name}`;
}

/** Hardware display name with optional brand. */
export function formatHardwareLabel(
  item?: Pick<HardwareItem, 'name' | 'brand' | 'colour'> | null,
  fallback = '—',
): string {
  if (!item) return fallback;
  const name = (item.name || '').trim();
  if (!name) return fallback;
  const brand = (item.brand || '').trim();
  const colour = (item.colour || '').trim();
  const bits = [name];
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) bits.push(brand);
  if (colour && !name.toLowerCase().includes(colour.toLowerCase())) bits.push(colour);
  return bits.join(' · ');
}

/** Door closer / floor spring: brand + colour + weight capacity */
export function formatDoorExtraLabel(parts: {
  brand?: string | null;
  colour?: string | null;
  weightCapacityKg?: number | null;
  name?: string | null;
}): string {
  const bits: string[] = [];
  const name = (parts.name || '').trim();
  const brand = (parts.brand || '').trim();
  const colour = (parts.colour || '').trim();
  if (name) bits.push(name);
  if (brand) bits.push(brand);
  if (colour) bits.push(colour);
  const kg = Number(parts.weightCapacityKg);
  if (Number.isFinite(kg) && kg > 0) bits.push(`${formatNum(kg, 0)} kg`);
  return bits.length ? bits.join(', ') : '—';
}

export function meshHasSpec(meshType?: MeshTypeId | null, meshDoors?: number | null): boolean {
  const doors = Math.max(0, Number(meshDoors) || 0);
  return Boolean(meshType && meshType !== 'none' && doors > 0);
}

/** `0.5 mm, Black, rolling` */
export function formatMeshSpecLine(
  meshType?: MeshTypeId | null,
  thicknessMm?: number | null,
  colour?: string | null,
): string {
  const typeLabel = meshType && meshType !== 'none' ? meshTypeLabel(meshType).toLowerCase() : '—';
  const thick = Number(thicknessMm);
  const thickPart = Number.isFinite(thick) && thick > 0 ? `${formatNum(thick)} mm` : '—';
  const colourPart = (colour || '').trim() || '—';
  return `${thickPart}, ${colourPart}, ${typeLabel}`;
}

/**
 * Exclusive door extra: door closer OR floor spring, never both.
 * Prefer explicit kind; else infer from which rate/label is set.
 */
export function resolveDoorExtraKind(input: {
  doorExtraKind?: DoorExtraKind | null;
  doorCloserRate?: number | null;
  floorSpringRate?: number | null;
  doorCloserLabel?: string | null;
  floorSpringLabel?: string | null;
}): DoorExtraKind {
  const kind = input.doorExtraKind;
  if (kind === 'door-closer' || kind === 'floor-spring' || kind === 'none') return kind;
  const closerOn =
    (Number(input.doorCloserRate) || 0) > 0 || Boolean((input.doorCloserLabel || '').trim());
  const springOn =
    (Number(input.floorSpringRate) || 0) > 0 || Boolean((input.floorSpringLabel || '').trim());
  if (closerOn && !springOn) return 'door-closer';
  if (springOn && !closerOn) return 'floor-spring';
  if (closerOn && springOn) return 'door-closer';
  return 'none';
}

/**
 * Customer template lines for one opening (shared Quotation + Configurator + Site Measure):
 *
 * ```
 * W-01 location, 00×00 mm, qty 1, area 29.06 sqft
 * Window: 3-track sliding window
 * Shutter/door: 2 shutters Glass + 1 shutter mesh
 * Color: Matt Black
 * Glass: 5 mm clear tuff (Saint-Gobain)
 * Lock / handle type: Metro Type Matt black lock
 * Mesh: 0.5 mm, Black, rolling
 * Door closer: Brand, colour, 45 kg
 * ```
 */
export function formatQuoteOpeningLines(input: QuoteOpeningFormatInput): string[] {
  const code = formatOpeningCode(input.index);
  const loc = (input.location || '').trim() || '—';
  const unitLabel = formatSizeUnitLabel(input.unit);
  const size = `${input.width}×${input.height} ${unitLabel}`;
  const area = formatNum(input.areaSqft);
  const lines = [
    `${code} ${loc}, ${size}, qty ${input.qty}, area ${area} sqft`,
    `Window: ${(input.windowTypeName || '').trim() || '—'}`,
    `Shutter/door: ${formatShutterDoorBreakdown(input.glassDoors, input.meshDoors)}`,
    `Color: ${(input.colourName || '').trim() || '—'}`,
    `Glass: ${(input.glassLabel || '').trim() || '—'}`,
    `Lock / handle type: ${(input.lockHandleLabel || '').trim() || '—'}`,
  ];

  if (meshHasSpec(input.meshType, input.meshDoors)) {
    lines.push(
      `Mesh: ${formatMeshSpecLine(input.meshType, input.meshThicknessMm, input.meshColour)}`,
    );
  }

  const extra = resolveDoorExtraKind({
    doorExtraKind: input.doorExtraKind,
    doorCloserLabel: input.doorCloserLabel,
    floorSpringLabel: input.floorSpringLabel,
  });
  if (extra === 'door-closer') {
    lines.push(`Door closer: ${(input.doorCloserLabel || '').trim() || '—'}`);
  } else if (extra === 'floor-spring') {
    lines.push(`Floor spring: ${(input.floorSpringLabel || '').trim() || '—'}`);
  }

  const note = (input.notes || '').trim();
  if (note) lines.push(`Notes: ${note}`);

  // Plain-text fallback (Excel / CSV). PDF HTML uses dotted rate/amount rows instead.
  if (input.ratePerSqft != null && Number.isFinite(input.ratePerSqft)) {
    lines.push(`Rate: ${formatNum(input.ratePerSqft, 0)} /sqft`);
  }
  if (input.amount != null && Number.isFinite(input.amount)) {
    lines.push(`Amount: ${formatNum(input.amount, 0)}`);
  }
  return lines;
}

/** Narrative lines only (no Rate/Amount) — PDF renders rate/amount as dotted leaders. */
export function formatQuoteOpeningNarrativeLines(input: QuoteOpeningFormatInput): string[] {
  return formatQuoteOpeningLines({
    ...input,
    ratePerSqft: null,
    amount: null,
  });
}

export function formatQuoteOpeningBlock(input: QuoteOpeningFormatInput): string {
  return formatQuoteOpeningLines(input).join('\n');
}

/** Resolve lock/handle label from series masters + hardware catalogue / BOM. */
export function resolveLockHandleLabel(
  state: AppState,
  opts: {
    windowTypeId?: string | null;
    series?: SeriesDefinition | null;
    lockHandleLabel?: string | null;
  },
): string {
  const override = (opts.lockHandleLabel || '').trim();
  if (override) return override;
  const series = opts.series;
  const seriesLabel = (series?.lockHandleLabel || '').trim();
  if (seriesLabel) return seriesLabel;

  if (opts.windowTypeId) {
    const bomLocks = state.hardwareBom
      .filter((b) => b.windowTypeId === opts.windowTypeId)
      .map((b) => state.hardware.find((h) => h.id === b.hardwareItemId))
      .filter((h): h is HardwareItem => Boolean(h))
      .filter((h) => /lock|handle/i.test(`${h.name} ${h.category}`));
    if (bomLocks[0]) return formatHardwareLabel(bomLocks[0]);
  }

  const classHint = series?.kind === 'sliding' ? 'sliding' : series?.kind === 'door' ? 'door' : 'casement';
  const catalogueHit = state.hardware.find(
    (h) =>
      (h.hardwareClass === classHint || h.hardwareClass === 'shared') &&
      /lock|handle/i.test(`${h.name} ${h.category}`),
  );
  if (catalogueHit) return formatHardwareLabel(catalogueHit);
  return '—';
}

export function resolveSeriesDoorExtraLabels(series?: SeriesDefinition | null): {
  kind: DoorExtraKind;
  doorCloserLabel: string | null;
  floorSpringLabel: string | null;
} {
  if (!series) {
    return { kind: 'none', doorCloserLabel: null, floorSpringLabel: null };
  }
  const kind = resolveDoorExtraKind({
    doorExtraKind: series.doorExtraKind,
    doorCloserRate: series.doorCloserRate,
    floorSpringRate: series.floorSpringRate,
  });
  const doorCloserLabel =
    kind === 'door-closer'
      ? formatDoorExtraLabel({
          brand: series.doorCloserBrand,
          colour: series.doorCloserColour,
          weightCapacityKg: series.doorCloserWeightKg,
          name: 'Door closer',
        })
      : null;
  const floorSpringLabel =
    kind === 'floor-spring'
      ? formatDoorExtraLabel({
          brand: series.floorSpringBrand,
          colour: series.floorSpringColour,
          weightCapacityKg: series.floorSpringWeightKg,
          name: 'Floor spring',
        })
      : null;
  return { kind, doorCloserLabel, floorSpringLabel };
}

/** Apply exclusive door closer vs floor spring on a series patch. */
export function applyExclusiveDoorExtra(
  series: SeriesDefinition,
  kind: DoorExtraKind,
): SeriesDefinition {
  if (kind === 'door-closer') {
    return {
      ...series,
      doorExtraKind: 'door-closer',
      floorSpringRate: 0,
    };
  }
  if (kind === 'floor-spring') {
    return {
      ...series,
      doorExtraKind: 'floor-spring',
      doorCloserRate: 0,
    };
  }
  return {
    ...series,
    doorExtraKind: 'none',
    doorCloserRate: 0,
    floorSpringRate: 0,
  };
}
