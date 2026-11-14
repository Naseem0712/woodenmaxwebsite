import type {
  AppState,
  ColourOption,
  CustomerModeId,
  GlassType,
  HardwareItem,
  ProfileSku,
  SeriesDefinition,
  SharedMasterSnapshot,
  VendorRateOverrides,
  WindowType,
} from '../types';
import { EMPTY_VENDOR_OVERRIDES } from '../types';

export function activeCustomerMode(state: AppState): CustomerModeId {
  return state.projects.find((p) => p.id === state.activeProjectId)?.customerMode ?? 'home-owner';
}

export function resolveVendorOverrides(state: AppState): VendorRateOverrides {
  return {
    ...EMPTY_VENDOR_OVERRIDES,
    ...state.vendorOverrides,
    windowTypeRates: { ...EMPTY_VENDOR_OVERRIDES.windowTypeRates, ...state.vendorOverrides?.windowTypeRates },
    glassRates: { ...EMPTY_VENDOR_OVERRIDES.glassRates, ...state.vendorOverrides?.glassRates },
    colourAdjRates: { ...EMPTY_VENDOR_OVERRIDES.colourAdjRates, ...state.vendorOverrides?.colourAdjRates },
    hardwareRates: { ...EMPTY_VENDOR_OVERRIDES.hardwareRates, ...state.vendorOverrides?.hardwareRates },
    profileRatePerMUpvc: {
      ...EMPTY_VENDOR_OVERRIDES.profileRatePerMUpvc,
      ...state.vendorOverrides?.profileRatePerMUpvc,
    },
    seriesMemberRates: {
      ...EMPTY_VENDOR_OVERRIDES.seriesMemberRates,
      ...state.vendorOverrides?.seriesMemberRates,
    },
  };
}

/** True when Vendor mode should layer private overrides on shared master. */
export function useVendorOverrides(state: AppState, mode?: CustomerModeId): boolean {
  return (mode ?? activeCustomerMode(state)) === 'vendor';
}

export function seriesMemberKey(seriesId: string, memberId: string): string {
  return `${seriesId}::${memberId}`;
}

/**
 * Effective catalogue for tools / configurator.
 * Shared Settings masters are always the base; Vendor mode applies private overrides on read.
 */
export function resolveEffectiveCatalogue(state: AppState, mode?: CustomerModeId) {
  const applyVendor = useVendorOverrides(state, mode);
  const ov = applyVendor ? resolveVendorOverrides(state) : EMPTY_VENDOR_OVERRIDES;

  const windowTypes: WindowType[] = state.windowTypes.map((t) =>
    ov.windowTypeRates[t.id] != null ? { ...t, ratePerSqft: ov.windowTypeRates[t.id] } : t,
  );
  const glassTypes: GlassType[] = state.glassTypes.map((g) =>
    ov.glassRates[g.id] != null ? { ...g, ratePerSqft: ov.glassRates[g.id] } : g,
  );
  const colourOptions: ColourOption[] = state.colourOptions.map((c) =>
    ov.colourAdjRates[c.id] != null ? { ...c, rateAdjPerSqft: ov.colourAdjRates[c.id] } : c,
  );
  const hardware: HardwareItem[] = state.hardware.map((h) =>
    ov.hardwareRates[h.id] != null ? { ...h, rate: ov.hardwareRates[h.id] } : h,
  );
  const profiles: ProfileSku[] = state.profiles.map((p) =>
    ov.profileRatePerMUpvc[p.id] != null
      ? { ...p, ratePerMUpvc: ov.profileRatePerMUpvc[p.id] }
      : p,
  );
  const series: SeriesDefinition[] = state.series.map((s) => ({
    ...s,
    members: s.members.map((m) => {
      const key = seriesMemberKey(s.id, m.id);
      return ov.seriesMemberRates[key] != null
        ? { ...m, ratePerM: ov.seriesMemberRates[key] }
        : m;
    }),
  }));

  return {
    windowTypes,
    glassTypes,
    colourOptions,
    hardware,
    profiles,
    series,
    applyingVendorOverrides: applyVendor,
  };
}

/** Snapshot of the shared master (market/standard layer) — never includes vendor overrides. */
export function exportSharedMaster(state: AppState, label = 'Shared market rates'): SharedMasterSnapshot {
  return {
    exportedAt: new Date().toISOString(),
    label,
    windowTypes: state.windowTypes,
    series: state.series,
    glassTypes: state.glassTypes,
    colourOptions: state.colourOptions,
    hardware: state.hardware,
    profiles: state.profiles,
    hardwareBom: state.hardwareBom,
  };
}

/** Merge a shared-master snapshot into Settings masters (does not touch vendorOverrides or job bags). */
export function importSharedMaster(
  state: AppState,
  snap: Partial<SharedMasterSnapshot>,
): AppState {
  return {
    ...state,
    windowTypes: snap.windowTypes ?? state.windowTypes,
    series: snap.series ?? state.series,
    glassTypes: snap.glassTypes ?? state.glassTypes,
    colourOptions: snap.colourOptions ?? state.colourOptions,
    hardware: snap.hardware ?? state.hardware,
    profiles: snap.profiles ?? state.profiles,
    hardwareBom: snap.hardwareBom ?? state.hardwareBom,
  };
}

export function setVendorOverride(
  overrides: VendorRateOverrides,
  bucket: keyof VendorRateOverrides,
  id: string,
  rate: number | null,
): VendorRateOverrides {
  const nextBucket = { ...overrides[bucket] };
  if (rate == null || Number.isNaN(rate)) {
    delete nextBucket[id];
  } else {
    nextBucket[id] = rate;
  }
  return { ...overrides, [bucket]: nextBucket };
}

export function countVendorOverrides(ov: VendorRateOverrides | undefined): number {
  if (!ov) return 0;
  return (
    Object.keys(ov.windowTypeRates ?? {}).length +
    Object.keys(ov.glassRates ?? {}).length +
    Object.keys(ov.colourAdjRates ?? {}).length +
    Object.keys(ov.hardwareRates ?? {}).length +
    Object.keys(ov.profileRatePerMUpvc ?? {}).length +
    Object.keys(ov.seriesMemberRates ?? {}).length
  );
}
