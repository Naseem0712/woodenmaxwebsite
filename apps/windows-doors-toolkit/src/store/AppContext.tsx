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
import { ensureSeriesHardwareDefaults } from '../engine/hardwareKind';
import { withPersistedNet } from '../engine/lessOff';
import { inferWindowKind, realignJobsToMaterial } from '../engine/materialContext';
import type {
  AppState,
  CustomerModeId,
  HardwareClass,
  Material,
  ModeVerification,
  ProjectJobData,
  ProjectMeta,
} from '../types';
import { DEFAULT_MODE_PRICING } from '../types';
import { applyProjectJob, emptyProjectJob, extractProjectJob } from './projectKeys';

const STORAGE_KEY = 'wd-toolkit-v5';
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
    data: { name: string; professionalId: string; gstNo: string },
    /** Project to switch into the unlocked mode; pass null to verify only */
    projectId?: string | null,
  ) => void;
  updateProjectLessOff: (id: string, widthMm: number | null, heightMm: number | null) => void;
  refreshSiteMeasureNets: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

function normalizeSiteMeasures(state: AppState): AppState {
  const siteMeasures = state.siteMeasures.map((line) => {
    const base = {
      ...line,
      lessOffWidthMm: line.lessOffWidthMm ?? null,
      lessOffHeightMm: line.lessOffHeightMm ?? null,
      netWidth: line.netWidth ?? line.width,
      netHeight: line.netHeight ?? line.height,
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
    return { ...p, material, kind };
  });
  const hardware = state.hardware.map((h) => ({
    ...h,
    hardwareClass: h.hardwareClass ?? inferHardwareClass(h.name, h.category),
  }));
  const c = state.casement;
  const casement = {
    ...c,
    doorLeaves: c.doorLeaves ?? 0,
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
  };
  const colourOptions = state.colourOptions ?? [];
  const modePricing = { ...DEFAULT_MODE_PRICING, ...state.modePricing };
  const modeVerifications = state.modeVerifications ?? [];
  const configuratorLines = state.configuratorLines ?? [];
  return {
    ...state,
    series,
    windowTypes,
    profiles,
    hardware,
    casement,
    projects,
    allowances,
    colourOptions,
    modePricing,
    modeVerifications,
    configuratorLines,
  };
}

function mergeLoaded(parsed: Partial<AppState>): AppState {
  const seed = createSeedState();
  const merged: AppState = {
    ...seed,
    ...parsed,
    business: { ...seed.business, ...parsed.business },
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
    colourOptions: parsed.colourOptions ?? seed.colourOptions,
    modePricing: { ...seed.modePricing, ...parsed.modePricing },
    modeVerifications: parsed.modeVerifications ?? seed.modeVerifications,
    configuratorLines: parsed.configuratorLines ?? seed.configuratorLines,
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
  return normalizeSiteMeasures(aligned);
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
    for (const key of [LEGACY_V4, LEGACY_V3, LEGACY_V2, LEGACY_V1]) {
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
      let next = applyProjectJob(
        {
          ...s,
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
        !state.modeVerifications.some(
          (v) =>
            v.modeId === mode &&
            v.name.trim() &&
            v.professionalId.trim() &&
            v.gstNo.trim(),
        );
      if (needsGate) return false;
      setProjectCustomerMode(id, mode);
      return true;
    },
    [state.modeVerifications, setProjectCustomerMode],
  );

  const submitModeVerification = useCallback(
    (
      mode: Exclude<CustomerModeId, 'home-owner'>,
      data: { name: string; professionalId: string; gstNo: string },
      projectId?: string | null,
    ) => {
      const entry: ModeVerification = {
        modeId: mode,
        name: data.name.trim(),
        professionalId: data.professionalId.trim(),
        gstNo: data.gstNo.trim(),
        verifiedAt: new Date().toISOString(),
      };
      setState((s) => {
        const modeVerifications = [
          ...s.modeVerifications.filter((v) => v.modeId !== mode),
          entry,
        ];
        if (projectId === null) {
          return { ...s, modeVerifications };
        }
        const pid = projectId ?? s.activeProjectId;
        return {
          ...s,
          modeVerifications,
          projects: s.projects.map((p) => (p.id === pid ? { ...p, customerMode: mode } : p)),
        };
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
