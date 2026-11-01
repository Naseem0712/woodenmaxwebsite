import type {
  AppState,
  Material,
  ProfileSku,
  ProjectMeta,
  SeriesDefinition,
  SeriesKind,
  WindowType,
} from '../types';
import { applySeriesToCasement, applySeriesToSliding } from './seriesApply';

export function activeProjectMeta(state: AppState): ProjectMeta | undefined {
  return state.projects.find((p) => p.id === state.activeProjectId);
}

export function projectMaterial(state: AppState): Material {
  return activeProjectMeta(state)?.material ?? 'UPVC';
}

export function filterSeries(
  series: SeriesDefinition[],
  material: Material,
  kind?: SeriesKind | SeriesKind[],
): SeriesDefinition[] {
  const kinds = kind == null ? null : Array.isArray(kind) ? kind : [kind];
  return series.filter((s) => {
    if (s.material !== material) return false;
    if (!kinds) return true;
    return kinds.includes(s.kind);
  });
}

export function filterWindowTypes(
  types: WindowType[],
  material: Material,
  kind?: SeriesKind | SeriesKind[],
): WindowType[] {
  const kinds = kind == null ? null : Array.isArray(kind) ? kind : [kind];
  return types.filter((t) => {
    if (t.material !== material) return false;
    if (!kinds) return true;
    const tKind = t.kind ?? 'other';
    return kinds.includes(tKind);
  });
}

export function filterProfiles(profiles: ProfileSku[], material: Material): ProfileSku[] {
  return profiles.filter((p) => p.material === material);
}

export function seriesForTool(
  state: AppState,
  kind: 'sliding' | 'casement',
): SeriesDefinition[] {
  const material = projectMaterial(state);
  if (kind === 'sliding') {
    // Sliding rollers / tracks only — swing/door series stay on Tool 03.
    return filterSeries(state.series, material, ['sliding']);
  }
  return filterSeries(state.series, material, ['casement', 'door']);
}

export function inferWindowKind(name: string, series?: SeriesDefinition): SeriesKind {
  if (series?.kind) return series.kind;
  const n = name.toLowerCase();
  if (n.includes('sliding') || n.includes('2-track') || n.includes('3-track') || n.includes('4-track')) {
    return n.includes('door') ? 'door' : 'sliding';
  }
  if (n.includes('casement') || n.includes('tilt') || n.includes('french') || n.includes('ventilator')) {
    return n.includes('door') || n.includes('french') ? 'door' : 'casement';
  }
  if (n.includes('door')) return 'door';
  if (n.includes('partition') || n.includes('fixed')) return 'other';
  return 'other';
}

/** Align sliding/casement jobs to project material + first matching series. */
export function realignJobsToMaterial(state: AppState, material: Material): AppState {
  const slidingSeries =
    filterSeries(state.series, material, ['sliding'])[0] ??
    filterSeries(state.series, material)[0];
  const casementSeries =
    filterSeries(state.series, material, ['casement', 'door'])[0] ??
    filterSeries(state.series, material)[0];

  let sliding = { ...state.sliding, material };
  let casement = { ...state.casement, material };

  if (slidingSeries) {
    sliding = applySeriesToSliding(slidingSeries, sliding, state.allowances);
  } else {
    sliding = { ...sliding, seriesId: '' };
  }
  if (casementSeries) {
    casement = applySeriesToCasement(casementSeries, casement, state.allowances);
  } else {
    casement = { ...casement, seriesId: '' };
  }

  return { ...state, sliding, casement };
}
