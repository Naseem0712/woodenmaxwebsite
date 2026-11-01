import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeedState } from '../data/seed';
import type { AppState } from '../types';

const STORAGE_KEY = 'wd-toolkit-v1';

type Ctx = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  resetSeed: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

function mergeLoaded(parsed: Partial<AppState>): AppState {
  const seed = createSeedState();
  return {
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
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeLoaded(JSON.parse(raw) as Partial<AppState>);
  } catch {
    /* ignore */
  }
  return createSeedState();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const patch = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

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

  const value = useMemo(
    () => ({ state, setState, patch, resetSeed, exportJson, importJson }),
    [state, patch, resetSeed, exportJson, importJson],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
