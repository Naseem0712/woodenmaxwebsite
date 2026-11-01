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
import { withPersistedNet } from '../engine/lessOff';
import { inferWindowKind, realignJobsToMaterial } from '../engine/materialContext';
import type { AppState, Material, ProjectJobData, ProjectMeta } from '../types';
import { applyProjectJob, emptyProjectJob, extractProjectJob } from './projectKeys';

const STORAGE_KEY = 'wd-toolkit-v3';
const LEGACY_V2 = 'wd-toolkit-v2';
const LEGACY_V1 = 'wd-toolkit-v1';

type Ctx = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  resetSeed: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
  createProject: (name: string, material?: Material) => void;
  renameProject: (id: string, name: string) => void;
  selectProject: (id: string) => void;
  setProjectMaterial: (id: string, material: Material) => void;
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
  const seriesById = new Map(state.series.map((s) => [s.id, s]));
  const windowTypes = state.windowTypes.map((t) => {
    const series = t.seriesId ? seriesById.get(t.seriesId) : undefined;
    return {
      ...t,
      kind: t.kind ?? inferWindowKind(t.name, series),
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
  const projects = state.projects.map((p) => ({
    ...p,
    material: p.material ?? 'UPVC',
    lessOffWidthMm: p.lessOffWidthMm ?? null,
    lessOffHeightMm: p.lessOffHeightMm ?? null,
  }));
  const allowances = {
    ...state.allowances,
    lessOffAluWidthMm: state.allowances.lessOffAluWidthMm ?? 5,
    lessOffAluHeightMm: state.allowances.lessOffAluHeightMm ?? 5,
  };
  return { ...state, windowTypes, profiles, projects, allowances };
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
    return mergeLoaded(withProject);
  } catch {
    return null;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeLoaded(JSON.parse(raw) as Partial<AppState>);
    for (const key of [LEGACY_V2, LEGACY_V1]) {
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

  const createProject = useCallback((name: string, material: Material = 'UPVC') => {
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
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
    }));
  }, []);

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
