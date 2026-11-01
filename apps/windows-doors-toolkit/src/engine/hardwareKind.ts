import type { SeriesDefinition, SeriesKind, SizedRate } from '../types';

/** Friction stay catalogue sizes — inches → mm (label in Settings / tools). */
export const FRICTION_STAY_SIZE_OPTIONS: ReadonlyArray<{ inch: number; mm: number }> = [
  { inch: 6, mm: 152 },
  { inch: 8, mm: 203 },
  { inch: 10, mm: 254 },
  { inch: 12, mm: 305 },
  { inch: 14, mm: 356 },
  { inch: 16, mm: 406 },
  { inch: 18, mm: 457 },
  { inch: 20, mm: 508 },
  { inch: 24, mm: 610 },
  { inch: 30, mm: 762 },
];

export const LAMINATION_ARM_SIZES_MM = [150, 200, 250, 305] as const;

export function frictionStayLabel(mm: number): string {
  const hit = FRICTION_STAY_SIZE_OPTIONS.find((o) => o.mm === mm);
  return hit ? `${hit.inch} in (${hit.mm} mm)` : `${mm} mm`;
}

export function defaultFrictionStayRates(): SizedRate[] {
  // Sample seeds only — shops overwrite in Settings. Rate = 1 set (2 pc).
  const sampleByInch: Record<number, number> = {
    6: 180,
    8: 220,
    10: 260,
    12: 320,
    14: 360,
    16: 420,
    18: 480,
    20: 540,
    24: 680,
    30: 860,
  };
  return FRICTION_STAY_SIZE_OPTIONS.map(({ inch, mm }) => ({
    sizeMm: mm,
    rate: sampleByInch[inch] ?? 320,
    label: frictionStayLabel(mm),
  }));
}

export function defaultLaminationArmRates(): SizedRate[] {
  const sample: Record<number, number> = { 150: 90, 200: 110, 250: 130, 305: 160 };
  return LAMINATION_ARM_SIZES_MM.map((mm) => ({
    sizeMm: mm,
    rate: sample[mm] ?? 100,
    label: `${mm} mm`,
  }));
}

export function rateForSize(list: SizedRate[] | undefined, sizeMm: number, fallback = 0): number {
  if (!list?.length) return fallback;
  const hit = list.find((r) => r.sizeMm === sizeMm);
  return hit?.rate ?? list[0]?.rate ?? fallback;
}

export function seriesKindHardwareGroup(kind: SeriesKind): 'sliding' | 'casement' | 'door' | 'other' {
  if (kind === 'sliding') return 'sliding';
  if (kind === 'casement') return 'casement';
  if (kind === 'door') return 'door';
  return 'other';
}

/** Warn when series name suggests a different class than Kind. */
export function seriesNameKindMismatch(name: string, kind: SeriesKind): string | null {
  const n = name.toLowerCase();
  const slidingHints = /\b(sliding|slider|track|roller|ps\b)/i.test(n);
  const casementHints = /\b(casement|openable|side.?hung|tilt)/i.test(n);
  const doorHints = /\b(door|french|swing|hinged)\b/i.test(n) && !slidingHints;

  if (kind === 'casement' && slidingHints && !casementHints) {
    return `Name looks like sliding (“${name.trim()}”) but Kind is casement — hardware will stay casement-only. Rename or change Kind.`;
  }
  if (kind === 'sliding' && casementHints && !slidingHints) {
    return `Name looks like casement (“${name.trim()}”) but Kind is sliding — hardware will stay sliding-only. Rename or change Kind.`;
  }
  if (kind === 'door' && slidingHints && !doorHints) {
    return `Name suggests sliding (“${name.trim()}”) but Kind is door — swing/door hardware is shown, not sliding rollers.`;
  }
  if ((kind === 'sliding' || kind === 'casement') && doorHints && !slidingHints && !casementHints) {
    return `Name suggests a door (“${name.trim()}”) but Kind is ${kind}. Consider Kind=door for swing hardware.`;
  }
  return null;
}

export function ensureSeriesHardwareDefaults(series: SeriesDefinition): SeriesDefinition {
  const frictionStayRates =
    series.frictionStayRates?.length ? series.frictionStayRates : defaultFrictionStayRates();
  const laminationArmRates =
    series.laminationArmRates?.length ? series.laminationArmRates : defaultLaminationArmRates();
  const frictionStaySizeMm =
    series.frictionStaySizeMm ||
    frictionStayRates.find((r) => r.rate === series.frictionStayRate)?.sizeMm ||
    305;
  const laminationArmSizeMm = series.laminationArmSizeMm || 200;
  return {
    ...series,
    frictionStayRates,
    laminationArmRates,
    frictionStaySizeMm,
    laminationArmSizeMm,
    frictionStaySetsPerOpenable: series.frictionStaySetsPerOpenable ?? 1,
    hingeQtyPerOpenable: series.hingeQtyPerOpenable ?? 2,
    hingeRate: series.hingeRate ?? 0,
    doorConnectorQtyPerDoor: series.doorConnectorQtyPerDoor ?? 4,
    doorConnectorRate: series.doorConnectorRate ?? 0,
    lockGuideRate: series.lockGuideRate ?? 0,
    brushRate: series.brushRate ?? 0,
    epdmRate: series.epdmRate ?? 0,
    lockRate: series.lockRate ?? 0,
    doorCloserRate: series.doorCloserRate ?? 0,
    floorSpringRate: series.floorSpringRate ?? 0,
    doorExtraKind: series.doorExtraKind ?? 'none',
    doorCloserBrand: series.doorCloserBrand ?? '',
    doorCloserColour: series.doorCloserColour ?? '',
    doorCloserWeightKg: series.doorCloserWeightKg ?? 0,
    floorSpringBrand: series.floorSpringBrand ?? '',
    floorSpringColour: series.floorSpringColour ?? '',
    floorSpringWeightKg: series.floorSpringWeightKg ?? 0,
    doorSetRate: series.doorSetRate ?? 0,
    swingHandleRate: series.swingHandleRate ?? 0,
    swingLockRate: series.swingLockRate ?? 0,
    lockHandleLabel: series.lockHandleLabel ?? '',
  };
}
