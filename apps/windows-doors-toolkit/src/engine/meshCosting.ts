import type {
  Allowances,
  AppState,
  MeshCostingSettings,
  MeshTypeId,
  SeriesKind,
  SiteMeasureLine,
  TrackMeshDefault,
  Unit,
  YesNo,
} from '../types';
import { DEFAULT_MESH_COSTING } from '../types';

const MM_TO_SQFT = 92903.04;

function toSqft(width: number, height: number, unit: Unit): number {
  if (unit === 'mm') return (width * height) / MM_TO_SQFT;
  if (unit === 'inch') return (width * height) / 144;
  return width * height;
}

export function resolveMeshCosting(a: Allowances | undefined): MeshCostingSettings {
  const base = DEFAULT_MESH_COSTING;
  const raw = a?.meshCosting;
  return {
    ...base,
    ...raw,
    brand: raw?.brand ?? base.brand ?? '',
    trackDefaults:
      raw?.trackDefaults?.length ? raw.trackDefaults.map((t) => ({ ...t })) : base.trackDefaults.map((t) => ({ ...t })),
  };
}

export function meshTypeLabel(t: MeshTypeId): string {
  switch (t) {
    case 'rolling':
      return 'Rolling';
    case 'collapsible':
      return 'Collapsible';
    case 'fixed':
      return 'Fixed';
    case 'door-side':
      return 'Door-side';
    case 'sliding':
      return 'Sliding';
    case 'swing':
      return 'Swing';
    default:
      return 'None';
  }
}

export function meshRatePerSqft(settings: MeshCostingSettings, meshType: MeshTypeId, fallbackPerSqft = 0): number {
  switch (meshType) {
    case 'rolling':
      return settings.rollingPerSqft;
    case 'collapsible':
      return settings.collapsiblePerSqft;
    case 'fixed':
      return settings.fixedPerSqft;
    case 'door-side':
      return settings.doorSidePerSqft;
    case 'sliding':
      return settings.slidingPerSqft ?? settings.rollingPerSqft;
    case 'swing':
      return settings.swingPerSqft ?? settings.doorSidePerSqft;
    default:
      return fallbackPerSqft;
  }
}

/** Nearest track default (exact match preferred; else closest tracks value). */
export function trackMeshDefaultFor(
  settings: MeshCostingSettings,
  tracks: number,
): TrackMeshDefault | undefined {
  if (!tracks || tracks <= 0) return undefined;
  const exact = settings.trackDefaults.find((t) => Math.abs(t.tracks - tracks) < 1e-6);
  if (exact) return exact;
  let best: TrackMeshDefault | undefined;
  let bestDist = Infinity;
  for (const t of settings.trackDefaults) {
    const d = Math.abs(t.tracks - tracks);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

export function syncMeshYesNo(meshDoors: number, meshType: MeshTypeId): YesNo {
  return meshDoors > 0 && meshType !== 'none' ? 'Yes' : 'No';
}

export function suggestSlidingMeshFromTracks(
  settings: MeshCostingSettings,
  tracks: number,
): Pick<SiteMeasureLine, 'glassDoors' | 'meshDoors' | 'meshType' | 'mesh'> {
  const def = trackMeshDefaultFor(settings, tracks);
  if (!def) {
    return { glassDoors: 2, meshDoors: 0, meshType: 'none', mesh: 'No' };
  }
  if (!def.meshAllowed) {
    return {
      glassDoors: def.glassDoors,
      meshDoors: 0,
      meshType: 'none',
      mesh: 'No',
    };
  }
  return {
    glassDoors: def.glassDoors,
    meshDoors: def.meshDoors,
    meshType: def.meshType === 'none' ? 'rolling' : def.meshType,
    mesh: syncMeshYesNo(def.meshDoors, def.meshType === 'none' ? 'rolling' : def.meshType),
  };
}

export function suggestOpenableMesh(
  settings: MeshCostingSettings,
  opts: { openablePanels: number; hasVent: YesNo; doorSide: boolean },
): { meshDoors: number; meshType: MeshTypeId; mesh: YesNo; ventCount: number } {
  if (opts.hasVent === 'Yes') {
    const meshType = settings.ventDefaultMeshType || 'fixed';
    const ventCount = Math.max(1, opts.openablePanels || 1);
    return {
      meshDoors: ventCount,
      meshType,
      mesh: 'Yes',
      ventCount,
    };
  }
  if (opts.doorSide) {
    const meshType = settings.openableDefaultMeshType || 'door-side';
    const meshDoors = Math.max(1, opts.openablePanels || 1);
    return { meshDoors, meshType, mesh: 'Yes', ventCount: 0 };
  }
  return { meshDoors: 0, meshType: 'none', mesh: 'No', ventCount: 0 };
}

export interface MeshAreaInput {
  width: number;
  height: number;
  unit: Unit;
  meshType: MeshTypeId;
  meshDoors: number;
  /** Sliding glass shutters or casement panels — for door-side leaf width */
  glassDoors?: number;
  panels?: number;
  hasVent?: YesNo;
  ventCount?: number;
  /** Legacy series share when meshType is none but mesh Yes */
  meshAreaShare?: number;
}

/**
 * Chargeable mesh area (sqft) for one window unit.
 * Rolling / collapsible → full window × max(1, meshDoors) when mesh doors set.
 * Door-side → leaf size × meshDoors.
 * Fixed → full window × max(1, ventCount when vent else 1).
 */
export function meshChargeableSqft(input: MeshAreaInput): number {
  const {
    width,
    height,
    unit,
    meshType,
    meshDoors,
    glassDoors = 0,
    panels = 0,
    hasVent = 'No',
    ventCount = 0,
    meshAreaShare = 1,
  } = input;
  if (meshType === 'none' || meshDoors <= 0) {
    return 0;
  }
  const windowSqft = toSqft(width, height, unit);
  const leafDiv = Math.max(1, glassDoors || panels || 1);
  const doorSqft = windowSqft / leafDiv;

  if (meshType === 'rolling' || meshType === 'collapsible') {
    return windowSqft * Math.max(1, meshDoors);
  }
  if (meshType === 'door-side') {
    return doorSqft * Math.max(1, meshDoors);
  }
  if (meshType === 'fixed') {
    const mult = hasVent === 'Yes' ? Math.max(1, ventCount || meshDoors || 1) : Math.max(1, meshDoors);
    return windowSqft * mult * (meshAreaShare > 0 && meshAreaShare < 1 ? meshAreaShare : 1);
  }
  return windowSqft * meshAreaShare * Math.max(1, meshDoors);
}

export function meshLineAmount(
  input: MeshAreaInput,
  settings: MeshCostingSettings,
  qty: number,
  legacyRatePerSqft = 0,
): { sqft: number; rate: number; amount: number } {
  const sqft = meshChargeableSqft(input) * Math.max(0, qty);
  const rate = meshRatePerSqft(settings, input.meshType, legacyRatePerSqft);
  return { sqft, rate, amount: Math.round(sqft * rate) };
}

/** Infer kind from window type for site-measure suggestions. */
export function kindSupportsTracks(kind: SeriesKind | undefined): boolean {
  return kind === 'sliding';
}

export function defaultsForWindowType(
  state: AppState,
  windowTypeId: string,
): Partial<SiteMeasureLine> {
  const settings = resolveMeshCosting(state.allowances);
  const wt = state.windowTypes.find((t) => t.id === windowTypeId);
  const series = wt?.seriesId ? state.series.find((s) => s.id === wt.seriesId) : undefined;
  if (wt?.kind === 'sliding' || series?.kind === 'sliding') {
    const tracks = series?.defaultTracks || 2;
    const sug = suggestSlidingMeshFromTracks(settings, tracks);
    return {
      tracks,
      glassDoors: sug.glassDoors,
      meshDoors: sug.meshDoors,
      meshType: sug.meshType,
      mesh: sug.mesh,
      hasVent: 'No',
      ventCount: 0,
    };
  }
  // Openable / casement / door — no tracks; mesh optional
  return {
    tracks: 0,
    glassDoors: series?.defaultOpenable || series?.defaultPanels || 1,
    meshDoors: 0,
    meshType: 'none',
    mesh: 'No',
    hasVent: 'No',
    ventCount: 0,
  };
}
