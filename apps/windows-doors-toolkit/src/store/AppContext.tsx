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
import type { AppState, ProjectJobData, ProjectMeta } from '../types';
import { applyProjectJob, emptyProjectJob, extractProjectJob } from './projectKeys';

const STORAGE_KEY = 'wd-toolkit-v2';
const LEGACY_KEY = 'wd-toolkit-v1';

type Ctx = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  resetSeed: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
  createProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  selectProject: (id: string) => void;
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

  return normalizeSiteMeasures(merged);
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
        ? parsed.projects
        : [
            {
              id: projectId,
              name: parsed.jobMeta?.jobLabel || 'Migrated job',
              createdAt: new Date().toISOString().slice(0, 10),
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
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = migrateLegacy(legacy);
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
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
      return syncActiveBag(normalizeSiteMeasures(draft));
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
      const incoming = bags[id] ?? emptyProjectJob(extractProjectJob(s));
      const next = normalizeSiteMeasures(
        applyProjectJob({ ...s, projectBags: bags, activeProjectId: id }, incoming),
      );
      bags[id] = extractProjectJob(next);
      return { ...next, projectBags: bags };
    });
  }, []);

  const createProject = useCallback((name: string) => {
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
        lessOffWidthMm: null,
        lessOffHeightMm: null,
      };
      const job = emptyProjectJob(extractProjectJob(s));
      bags[id] = job;
      return normalizeSiteMeasures(
        applyProjectJob(
          {
            ...s,
            projects: [...s.projects, meta],
            activeProjectId: id,
            projectBags: bags,
          },
          job,
        ),
      );
    });
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
    }));
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
