import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { v4 as uid } from 'uuid';
import { createSeedState } from '../data/seed';
import {
  customerIdFromEmail,
  isValidEmail,
  isVerificationComplete,
  normalizeModeVerification,
  restoreAccountByEmail,
  syncAccountsFromState,
  upsertAccountFromState,
} from '../engine/accountStore';
import { ensureSeriesHardwareDefaults } from '../engine/hardwareKind';
import {
  mergeClientAccountsWithStore,
  mergeVendorLedgersWithStore,
  syncClientLedgers,
  syncVendorLedgers,
} from '../engine/ledgerStore';
import { withPersistedNet } from '../engine/lessOff';
import { inferWindowKind, realignJobsToMaterial } from '../engine/materialContext';
import { resolveMeshCosting, syncMeshYesNo } from '../engine/meshCosting';
import { ensureProfileStockLength } from '../engine/profileStockDefaults';
import { ensureBusinessBillSeries } from '../engine/billSeries';
import { allocateQuoteNo, ensureBusinessQuoteSeries } from '../engine/quoteSeries';
import type {
  AppState,
  CustomerModeId,
  HardwareClass,
  Material,
  ModeVerification,
  ModeVerificationInput,
  ProjectJobData,
  ProjectMeta,
} from '../types';
import { DEFAULT_MODE_PRICING, EMPTY_VENDOR_OVERRIDES } from '../types';
import { applyProjectJob, emptyProjectJob, extractProjectJob } from './projectKeys';

const STORAGE_KEY = 'wd-toolkit-v7';
const LEGACY_V6 = 'wd-toolkit-v6';
const LEGACY_V5 = 'wd-toolkit-v5';
const LEGACY_V4 = 'wd-toolkit-v4';
const LEGACY_V3 = 'wd-toolkit-v3';
const LEGACY_V2 = 'wd-toolkit-v2';
const LEGACY_V1 = 'wd-toolkit-v1';

function inferHardwareClass(name: string, category: string): HardwareClass {
  const n = `${name} ${category}`.toLowerCase();
  if (/\b(roller|sliding|track|anti-lift)\b/.test(n)) return 'sliding';
  if (/\b(floor spring|door closer|door set|swing|door connector|door hinge)\b/.test(n)) return 'door';
  if (/\b(friction|casement|hinge|lamination|lock guide|tilt)\b/.test(n)) return 'casement';
  return 'shared';
}

type Ctx = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  resetSeed: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
  createProject: (name: string, material?: Material, customerMode?: CustomerModeId) => void;
  renameProject: (id: string, name: string) => void;
  selectProject: (id: string) => void;
  setProjectMaterial: (id: string, material: Material) => void;
  setProjectCustomerMode: (id: string, mode: CustomerModeId) => void;
  /** Attempt mode switch; returns false when verification gate blocks (caller shows modal). */
  requestProjectCustomerMode: (id: string, mode: CustomerModeId) => boolean;
  submitModeVerification: (
    mode: Exclude<CustomerModeId, 'home-owner'>,
    data: ModeVerificationInput,
    /** Project to switch into the unlocked mode; pass null to verify only */
    projectId?: string | null,
  ) => void;
  updateProjectLessOff: (id: string, widthMm: number | null, heightMm: number | null) => void;
  refreshSiteMeasureNets: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

function normalizeSiteMeasures(state: AppState): AppState {
  const siteMeasures = state.siteMeasures.map((line) => {
    const meshDoors =
      line.meshDoors ?? (line.mesh === 'Yes' ? 1 : 0);
    const meshType =
      line.meshType ?? (line.mesh === 'Yes' ? 'rolling' : 'none');
    const base = {
      ...line,
      lessOffWidthMm: line.lessOffWidthMm ?? null,
      lessOffHeightMm: line.lessOffHeightMm ?? null,
      netWidth: line.netWidth ?? line.width,
      netHeight: line.netHeight ?? line.height,
      tracks: line.tracks ?? 0,
      glassDoors: line.glassDoors ?? (line.tracks ? 2 : 1),
      meshDoors,
      meshType,
      mesh: syncMeshYesNo(meshDoors, meshType),
      hasVent: line.hasVent ?? 'No',
      ventCount: line.ventCount ?? 0,
      notes: line.notes ?? '',
      meshAmountOverride: line.meshAmountOverride ?? null,
      amountOverride: line.amountOverride ?? null,
    };
    return withPersistedNet(state, base);
  });
  return { ...state, siteMeasures };
}

function normalizeMasters(state: AppState): AppState {
  const series = state.series.map((s) => ensureSeriesHardwareDefaults(s));
  const seriesById = new Map(series.map((s) => [s.id, s]));
  const windowTypes = state.windowTypes.map((t) => {
    const seriesHit = t.seriesId ? seriesById.get(t.seriesId) : undefined;
    return {
      ...t,
      kind: t.kind ?? inferWindowKind(t.name, seriesHit),
    };
  });
  const profiles = state.profiles.map((p) => {
    const material =
      p.material ??
      (p.kgPerMAluminium > 0 && !(p.ratePerMUpvc > 0) ? 'Aluminium' : 'UPVC');
    const name = p.name.toLowerCase();
    const kind =
      p.kind ??
      (name.includes('casement') || name.includes('mullion')
        ? 'casement'
        : name.includes('sliding') || name.includes('track') || name.includes('shutter') || name.includes('interlock')
          ? 'sliding'
          : 'other');
    // Fill empty/missing stock length only — never wipe vendor custom lengths.
    return ensureProfileStockLength({ ...p, material, kind });
  });
  const hardware = state.hardware.map((h) => ({
    ...h,
    hardwareClass: h.hardwareClass ?? inferHardwareClass(h.name, h.category),
    brand: h.brand ?? '',
    colour: h.colour ?? '',
    weightCapacityKg: h.weightCapacityKg ?? 0,
  }));
  const glassTypes = (state.glassTypes ?? []).map((g) => ({
    ...g,
    brand: g.brand ?? '',
  }));
  const c = state.casement;
  const casementMeshDoors = c.meshDoors ?? (c.mesh === 'Yes' ? Math.max(1, c.openablePanels || 1) : 0);
  const casementMeshType =
    c.meshType ?? (c.mesh === 'Yes' ? (c.hasVent === 'Yes' ? 'fixed' : 'door-side') : 'none');
  const casement = {
    ...c,
    doorLeaves: c.doorLeaves ?? 0,
    meshDoors: casementMeshDoors,
    meshType: casementMeshType,
    mesh: syncMeshYesNo(casementMeshDoors, casementMeshType),
    hasVent: c.hasVent ?? 'No',
    ventCount: c.ventCount ?? 0,
    frictionStaySizeMm: c.frictionStaySizeMm ?? 305,
    frictionStaySetsPerOpenable: c.frictionStaySetsPerOpenable ?? 1,
    hingeQty: c.hingeQty ?? 0,
    hingeRate: c.hingeRate ?? 0,
    doorConnectorQty: c.doorConnectorQty ?? 0,
    doorConnectorRate: c.doorConnectorRate ?? 0,
    laminationArmSizeMm: c.laminationArmSizeMm ?? 200,
    laminationArmRate: c.laminationArmRate ?? 0,
    lockGuideRate: c.lockGuideRate ?? 0,
    brushRate: c.brushRate ?? 0,
    epdmRate: c.epdmRate ?? 0,
    lockRate: c.lockRate ?? 0,
    doorCloserRate: c.doorCloserRate ?? 0,
    floorSpringRate: c.floorSpringRate ?? 0,
    doorSetRate: c.doorSetRate ?? 0,
    swingHandleRate: c.swingHandleRate ?? 0,
    swingLockRate: c.swingLockRate ?? 0,
  };
  const sl = state.sliding;
  const slidingMeshDoors = sl.meshDoors ?? (sl.mesh === 'Yes' ? 1 : 0);
  const slidingMeshType = sl.meshType ?? (sl.mesh === 'Yes' ? 'rolling' : 'none');
  const sliding = {
    ...sl,
    meshDoors: slidingMeshDoors,
    meshType: slidingMeshType,
    mesh: syncMeshYesNo(slidingMeshDoors, slidingMeshType),
  };
  const projects = state.projects.map((p) => ({
    ...p,
    material: p.material ?? 'UPVC',
    customerMode: p.customerMode ?? 'home-owner',
    lessOffWidthMm: p.lessOffWidthMm ?? null,
    lessOffHeightMm: p.lessOffHeightMm ?? null,
  }));
  const allowances = {
    ...state.allowances,
    lessOffAluWidthMm: state.allowances.lessOffAluWidthMm ?? 5,
    lessOffAluHeightMm: state.allowances.lessOffAluHeightMm ?? 5,
    meshCosting: resolveMeshCosting(state.allowances),
  };
  const colourOptions = state.colourOptions ?? [];
  const modePricing = { ...DEFAULT_MODE_PRICING, ...state.modePricing };
  const modeVerifications = (state.modeVerifications ?? []).map(normalizeModeVerification);
  const configuratorLines = state.configuratorLines ?? [];
  const vendorOverrides = {
    ...EMPTY_VENDOR_OVERRIDES,
    ...state.vendorOverrides,
    windowTypeRates: {
      ...EMPTY_VENDOR_OVERRIDES.windowTypeRates,
      ...state.vendorOverrides?.windowTypeRates,
    },
    glassRates: { ...EMPTY_VENDOR_OVERRIDES.glassRates, ...state.vendorOverrides?.glassRates },
    colourAdjRates: {
      ...EMPTY_VENDOR_OVERRIDES.colourAdjRates,
      ...state.vendorOverrides?.colourAdjRates,
    },
    hardwareRates: {
      ...EMPTY_VENDOR_OVERRIDES.hardwareRates,
      ...state.vendorOverrides?.hardwareRates,
    },
    profileRatePerMUpvc: {
      ...EMPTY_VENDOR_OVERRIDES.profileRatePerMUpvc,
      ...state.vendorOverrides?.profileRatePerMUpvc,
    },
    seriesMemberRates: {
      ...EMPTY_VENDOR_OVERRIDES.seriesMemberRates,
      ...state.vendorOverrides?.seriesMemberRates,
    },
  };
  const openings = (state.openings ?? []).map((o) => ({
    ...o,
    tracks: o.tracks ?? 0,
    glassDoors: o.glassDoors ?? 0,
    meshDoors: o.meshDoors ?? 0,
    meshType: o.meshType ?? 'none',
    hasVent: o.hasVent ?? 'No',
    ventCount: o.ventCount ?? 0,
  }));
  const normalizedConfigurator = configuratorLines.map((line) => ({
    ...line,
    tracks: line.tracks ?? 0,
    glassDoors: line.glassDoors ?? 0,
    meshDoors: line.meshDoors ?? 0,
    meshType: line.meshType ?? 'none',
    hasVent: line.hasVent ?? 'No',
    ventCount: line.ventCount ?? 0,
  }));
  return {
    ...state,
    business: ensureBusinessBillSeries(ensureBusinessQuoteSeries(state.business)),
    series,
    windowTypes,
    profiles,
    hardware,
    glassTypes,
    sliding,
    casement,
    openings,
    projects,
    allowances,
    colourOptions,
    modePricing,
    modeVerifications,
    configuratorLines: normalizedConfigurator,
    customQuoteLines: state.customQuoteLines ?? [],
    vendorOverrides,
  };
}

function mergeLoaded(parsed: Partial<AppState>): AppState {
  const seed = createSeedState();
  const merged: AppState = {
    ...seed,
    ...parsed,
    business: ensureBusinessBillSeries(
      ensureBusinessQuoteSeries({
        ...seed.business,
        ...parsed.business,
        website: parsed.business?.website ?? seed.business.website,
        logoUrl: parsed.business?.logoUrl ?? seed.business.logoUrl,
        billSeriesPrefix:
          parsed.business?.billSeriesPrefix ?? seed.business.billSeriesPrefix,
        billNextSeq: parsed.business?.billNextSeq ?? seed.business.billNextSeq,
        gstSlabs: parsed.business?.gstSlabs ?? seed.business.gstSlabs,
        defaultGstSlab: parsed.business?.defaultGstSlab ?? seed.business.defaultGstSlab,
        pan: parsed.business?.pan ?? seed.business.pan,
        udyamNo: parsed.business?.udyamNo ?? seed.business.udyamNo,
        invoiceTagline: parsed.business?.invoiceTagline ?? seed.business.invoiceTagline,
        bankAccountName: parsed.business?.bankAccountName ?? seed.business.bankAccountName,
        bankAccountNo: parsed.business?.bankAccountNo ?? seed.business.bankAccountNo,
        bankIfsc: parsed.business?.bankIfsc ?? seed.business.bankIfsc,
        bankName: parsed.business?.bankName ?? seed.business.bankName,
        invoiceTerms: parsed.business?.invoiceTerms ?? seed.business.invoiceTerms,
        jurisdictionState:
          parsed.business?.jurisdictionState ?? seed.business.jurisdictionState,
      }),
    ),
    allowances: { ...seed.allowances, ...parsed.allowances },
    jobMeta: { ...seed.jobMeta, ...parsed.jobMeta },
    quote: { ...seed.quote, ...parsed.quote },
    labour: { ...seed.labour, ...parsed.labour },
    marginExtras: { ...seed.marginExtras, ...parsed.marginExtras },
    sliding: { ...seed.sliding, ...parsed.sliding },
    casement: { ...seed.casement, ...parsed.casement },
    windowTypes: parsed.windowTypes ?? seed.windowTypes,
    series: parsed.series ?? seed.series,
    glassTypes: parsed.glassTypes ?? seed.glassTypes,
    hardware: parsed.hardware ?? seed.hardware,
    profiles: parsed.profiles ?? seed.profiles,
    hardwareBom: parsed.hardwareBom ?? seed.hardwareBom,
    openings: parsed.openings ?? seed.openings,
    leads: parsed.leads ?? seed.leads,
    siteMeasures: parsed.siteMeasures ?? seed.siteMeasures,
    doors: parsed.doors ?? seed.doors,
    cuts: parsed.cuts ?? seed.cuts,
    glassPanes: parsed.glassPanes ?? seed.glassPanes,
    meshGrill: parsed.meshGrill ?? seed.meshGrill,
    compare: parsed.compare ?? seed.compare,
    builder: parsed.builder ?? seed.builder,
    revisions: parsed.revisions ?? seed.revisions,
    stock: parsed.stock ?? seed.stock,
    stockIssues: parsed.stockIssues ?? seed.stockIssues,
    billingInvoices: (parsed.billingInvoices ?? seed.billingInvoices).map((inv) => ({
      ...inv,
      status: inv.status ?? 'issued',
      lines: inv.lines ?? [],
      taxMode: inv.taxMode,
      customerGstin: inv.customerGstin ?? '',
      billingAddress: inv.billingAddress ?? '',
      shippingAddress: inv.shippingAddress ?? '',
      placeOfSupply: inv.placeOfSupply ?? '',
      eWayBillNo: inv.eWayBillNo ?? '',
      vehicleNo: inv.vehicleNo ?? '',
      transportName: inv.transportName ?? '',
      station: inv.station ?? '',
      reverseCharge: inv.reverseCharge ?? 'N',
      grRrNo: inv.grRrNo ?? '',
    })),
    billingPayments: parsed.billingPayments ?? seed.billingPayments,
    billingExpenses: parsed.billingExpenses ?? seed.billingExpenses,
    billingSettings: {
      ...seed.billingSettings,
      ...parsed.billingSettings,
      expenseHeads:
        parsed.billingSettings?.expenseHeads?.length
          ? parsed.billingSettings.expenseHeads
          : seed.billingSettings.expenseHeads,
      payModes:
        parsed.billingSettings?.payModes?.length
          ? parsed.billingSettings.payModes
          : seed.billingSettings.payModes,
    },
    savedQuotes: parsed.savedQuotes ?? seed.savedQuotes ?? [],
    vendorLabourTeams: parsed.vendorLabourTeams ?? seed.vendorLabourTeams ?? [],
    vendorLabourMembers: parsed.vendorLabourMembers ?? seed.vendorLabourMembers ?? [],
    vendorLabourPayouts: parsed.vendorLabourPayouts ?? seed.vendorLabourPayouts ?? [],
    clientAccounts: parsed.clientAccounts ?? seed.clientAccounts ?? [],
    colourOptions: parsed.colourOptions ?? seed.colourOptions,
    modePricing: { ...seed.modePricing, ...parsed.modePricing },
    modeVerifications: (parsed.modeVerifications ?? seed.modeVerifications).map(
      normalizeModeVerification,
    ),
    vendorOverrides: {
      ...EMPTY_VENDOR_OVERRIDES,
      ...seed.vendorOverrides,
      ...parsed.vendorOverrides,
      windowTypeRates: {
        ...EMPTY_VENDOR_OVERRIDES.windowTypeRates,
        ...seed.vendorOverrides?.windowTypeRates,
        ...parsed.vendorOverrides?.windowTypeRates,
      },
      glassRates: {
        ...EMPTY_VENDOR_OVERRIDES.glassRates,
        ...seed.vendorOverrides?.glassRates,
        ...parsed.vendorOverrides?.glassRates,
      },
      colourAdjRates: {
        ...EMPTY_VENDOR_OVERRIDES.colourAdjRates,
        ...seed.vendorOverrides?.colourAdjRates,
        ...parsed.vendorOverrides?.colourAdjRates,
      },
      hardwareRates: {
        ...EMPTY_VENDOR_OVERRIDES.hardwareRates,
        ...seed.vendorOverrides?.hardwareRates,
        ...parsed.vendorOverrides?.hardwareRates,
      },
      profileRatePerMUpvc: {
        ...EMPTY_VENDOR_OVERRIDES.profileRatePerMUpvc,
        ...seed.vendorOverrides?.profileRatePerMUpvc,
        ...parsed.vendorOverrides?.profileRatePerMUpvc,
      },
      seriesMemberRates: {
        ...EMPTY_VENDOR_OVERRIDES.seriesMemberRates,
        ...seed.vendorOverrides?.seriesMemberRates,
        ...parsed.vendorOverrides?.seriesMemberRates,
      },
    },
    configuratorLines: parsed.configuratorLines ?? seed.configuratorLines,
    customQuoteLines: parsed.customQuoteLines ?? seed.customQuoteLines,
    projects: parsed.projects?.length ? parsed.projects : seed.projects,
    activeProjectId: parsed.activeProjectId ?? seed.activeProjectId,
    projectBags: parsed.projectBags ?? {},
  };

  if (!merged.projects.some((p) => p.id === merged.activeProjectId)) {
    merged.activeProjectId = merged.projects[0]?.id ?? seed.activeProjectId;
  }

  const normalized = normalizeMasters(merged);
  const material =
    normalized.projects.find((p) => p.id === normalized.activeProjectId)?.material ?? 'UPVC';
  const aligned =
    normalized.sliding.material !== material || normalized.casement.material !== material
      ? realignJobsToMaterial(normalized, material)
      : normalized;
  const withSite = normalizeSiteMeasures(aligned);
  const vendorMerged = mergeVendorLedgersWithStore({
    teams: withSite.vendorLabourTeams ?? [],
    members: withSite.vendorLabourMembers ?? [],
    payouts: withSite.vendorLabourPayouts ?? [],
  });
  return {
    ...withSite,
    vendorLabourTeams: vendorMerged.teams,
    vendorLabourMembers: vendorMerged.members,
    vendorLabourPayouts: vendorMerged.payouts,
    clientAccounts: mergeClientAccountsWithStore(withSite.clientAccounts ?? []),
  };
}

function migrateLegacy(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object') return null;
    const seed = createSeedState();
    const projectId = seed.projects[0].id;
    const withProject: Partial<AppState> = {
      ...parsed,
      projects: parsed.projects?.length
        ? parsed.projects.map((p) => ({
            ...p,
            material: p.material ?? 'UPVC',
            lessOffWidthMm: p.lessOffWidthMm ?? null,
            lessOffHeightMm: p.lessOffHeightMm ?? null,
          }))
        : [
            {
              id: projectId,
              name: parsed.jobMeta?.jobLabel || 'Migrated job',
              createdAt: new Date().toISOString().slice(0, 10),
              material: 'UPVC' as Material,
              customerMode: 'home-owner' as CustomerModeId,
              lessOffWidthMm: null,
              lessOffHeightMm: null,
            },
          ],
      activeProjectId: parsed.activeProjectId ?? projectId,
      projectBags: parsed.projectBags ?? {},
      stock: parsed.stock ?? seed.stock,
      stockIssues: parsed.stockIssues ?? [],
      allowances: {
        ...seed.allowances,
        ...parsed.allowances,
        lessOffWidthMm: parsed.allowances?.lessOffWidthMm ?? seed.allowances.lessOffWidthMm,
        lessOffHeightMm: parsed.allowances?.lessOffHeightMm ?? seed.allowances.lessOffHeightMm,
        lessOffAluWidthMm:
          parsed.allowances?.lessOffAluWidthMm ?? seed.allowances.lessOffAluWidthMm,
        lessOffAluHeightMm:
          parsed.allowances?.lessOffAluHeightMm ?? seed.allowances.lessOffAluHeightMm,
      },
    };
    if (withProject.projects) {
      withProject.projects = withProject.projects.map((p) => ({
        ...p,
        customerMode: p.customerMode ?? 'home-owner',
      }));
    }
    return mergeLoaded(withProject);
  } catch {
    return null;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeLoaded(JSON.parse(raw) as Partial<AppState>);
    for (const key of [LEGACY_V6, LEGACY_V5, LEGACY_V4, LEGACY_V3, LEGACY_V2, LEGACY_V1]) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const migrated = migrateLegacy(legacy);
        if (migrated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return createSeedState();
}

function syncActiveBag(next: AppState): AppState {
  const bags = { ...next.projectBags };
  bags[next.activeProjectId] = extractProjectJob(next);
  return { ...next, projectBags: bags };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(load);

  const setState: React.Dispatch<React.SetStateAction<AppState>> = useCallback((action) => {
    setStateRaw((prev) => {
      const draft = typeof action === 'function' ? action(prev) : action;
      return syncActiveBag(normalizeSiteMeasures(normalizeMasters(draft)));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try {
      syncAccountsFromState(state);
      syncClientLedgers(state.clientAccounts ?? []);
      syncVendorLedgers(
        state.vendorLabourTeams ?? [],
        state.vendorLabourMembers ?? [],
        state.vendorLabourPayouts ?? [],
      );
    } catch {
      /* ignore account sync failures */
    }
  }, [state]);

  const patch = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((s) => {
      const next = { ...s, [key]: value };
      return next;
    });
  }, [setState]);

  const resetSeed = useCallback(() => {
    const next = createSeedState();
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importJson = useCallback((raw: string) => {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    setState(mergeLoaded(parsed));
  }, []);

  const selectProject = useCallback((id: string) => {
    setState((s) => {
      if (id === s.activeProjectId) return s;
      if (!s.projects.some((p) => p.id === id)) return s;
      const bags: Record<string, ProjectJobData> = {
        ...s.projectBags,
        [s.activeProjectId]: extractProjectJob(s),
      };
      const meta = s.projects.find((p) => p.id === id)!;
      let incoming = bags[id] ?? emptyProjectJob(extractProjectJob(s));
      let next = normalizeSiteMeasures(
        applyProjectJob({ ...s, projectBags: bags, activeProjectId: id }, incoming),
      );
      next = realignJobsToMaterial(next, meta.material);
      bags[id] = extractProjectJob(next);
      return { ...next, projectBags: bags };
    });
  }, []);

  const createProject = useCallback(
    (name: string, material: Material = 'UPVC', customerMode: CustomerModeId = 'home-owner') => {
    setState((s) => {
      const bags: Record<string, ProjectJobData> = {
        ...s.projectBags,
        [s.activeProjectId]: extractProjectJob(s),
      };
      const id = uid();
      const meta: ProjectMeta = {
        id,
        name: name.trim() || `Project ${s.projects.length + 1}`,
        createdAt: new Date().toISOString().slice(0, 10),
        material,
        customerMode,
        lessOffWidthMm: null,
        lessOffHeightMm: null,
      };
      let job = emptyProjectJob(extractProjectJob(s));
      // New quote keeps Settings series prefix; only the running number increments.
      const numbered = allocateQuoteNo(s.business);
      job = {
        ...job,
        quote: { ...job.quote, quoteNo: numbered.quoteNo },
      };
      let next = applyProjectJob(
        {
          ...s,
          business: numbered.business,
          projects: [...s.projects, meta],
          activeProjectId: id,
          projectBags: bags,
        },
        job,
      );
      next = realignJobsToMaterial(next, material);
      bags[id] = extractProjectJob(next);
      return normalizeSiteMeasures({ ...next, projectBags: bags });
    });
  },
  [],
  );

  const renameProject = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
    }));
  }, []);

  const setProjectCustomerMode = useCallback((id: string, mode: CustomerModeId) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, customerMode: mode } : p)),
    }));
  }, []);

  const requestProjectCustomerMode = useCallback(
    (id: string, mode: CustomerModeId): boolean => {
      const needsGate =
        mode !== 'home-owner' &&
        !state.modeVerifications
          .map(normalizeModeVerification)
          .some((v) => v.modeId === mode && isVerificationComplete(v));
      if (needsGate) return false;
      setProjectCustomerMode(id, mode);
      return true;
    },
    [state.modeVerifications, setProjectCustomerMode],
  );

  const submitModeVerification = useCallback(
    (
      mode: Exclude<CustomerModeId, 'home-owner'>,
      data: ModeVerificationInput,
      projectId?: string | null,
    ) => {
      const email = data.email.trim().toLowerCase();
      if (!isValidEmail(email)) {
        throw new Error('A valid professional / business email is required.');
      }
      const customerId = customerIdFromEmail(email);
      const entry: ModeVerification = normalizeModeVerification({
        modeId: mode,
        name: data.name.trim(),
        email,
        customerId,
        mobile: data.mobile.trim(),
        area: data.area.trim(),
        city: data.city.trim(),
        gstNo: data.gstNo.trim(),
        verifiedAt: new Date().toISOString(),
      });
      if (!isVerificationComplete(entry)) {
        throw new Error('Name, email, mobile, area, city, and GST are required.');
      }

      setState((s) => {
        let next: AppState = s;
        const restored =
          data.restoreSaved !== false ? restoreAccountByEmail(email) : null;

        if (restored && data.restoreSaved) {
          const bags = { ...restored.projectBags };
          const activeId = restored.activeProjectId;
          const incoming = bags[activeId] ?? emptyProjectJob(extractProjectJob(s));
          next = applyProjectJob(
            {
              ...s,
              projects: restored.projects,
              projectBags: bags,
              activeProjectId: activeId,
              modeVerifications: restored.modeVerifications,
            },
            incoming,
          );
          const meta = restored.projects.find((p) => p.id === activeId);
          if (meta) next = realignJobsToMaterial(next, meta.material);
        }

        const prior = next.modeVerifications
          .map(normalizeModeVerification)
          .filter((v) => v.modeId !== mode);
        const modeVerifications = [...prior, entry];

        if (projectId === null) {
          next = { ...next, modeVerifications };
        } else {
          const pid = projectId ?? next.activeProjectId;
          next = {
            ...next,
            modeVerifications,
            projects: next.projects.map((p) =>
              p.id === pid ? { ...p, customerMode: mode } : p,
            ),
          };
        }

        try {
          upsertAccountFromState(next, modeVerifications, email);
        } catch {
          /* ignore */
        }
        return normalizeSiteMeasures(normalizeMasters(next));
      });
    },
    [],
  );

  const setProjectMaterial = useCallback((id: string, material: Material) => {
    setState((s) => {
      const projects = s.projects.map((p) => (p.id === id ? { ...p, material } : p));
      let next: AppState = { ...s, projects };
      if (id === s.activeProjectId) {
        next = realignJobsToMaterial(next, material);
      } else if (next.projectBags[id]) {
        const bagState = applyProjectJob(next, next.projectBags[id]);
        const aligned = realignJobsToMaterial({ ...bagState, projects }, material);
        next = {
          ...next,
          projectBags: {
            ...next.projectBags,
            [id]: extractProjectJob(aligned),
          },
        };
      }
      return normalizeSiteMeasures(next);
    });
  }, []);

  const updateProjectLessOff = useCallback(
    (id: string, widthMm: number | null, heightMm: number | null) => {
      setState((s) => {
        const projects = s.projects.map((p) =>
          p.id === id ? { ...p, lessOffWidthMm: widthMm, lessOffHeightMm: heightMm } : p,
        );
        return normalizeSiteMeasures({ ...s, projects });
      });
    },
    [],
  );

  const refreshSiteMeasureNets = useCallback(() => {
    setState((s) => normalizeSiteMeasures(s));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setState,
      patch,
      resetSeed,
      exportJson,
      importJson,
      createProject,
      renameProject,
      selectProject,
      setProjectMaterial,
      setProjectCustomerMode,
      requestProjectCustomerMode,
      submitModeVerification,
      updateProjectLessOff,
      refreshSiteMeasureNets,
    }),
    [
      state,
      patch,
      resetSeed,
      exportJson,
      importJson,
      createProject,
      renameProject,
      selectProject,
      setProjectMaterial,
      setProjectCustomerMode,
      requestProjectCustomerMode,
      submitModeVerification,
      updateProjectLessOff,
      refreshSiteMeasureNets,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
