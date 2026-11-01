import type { AppState, ProjectMeta, SiteMeasureLine } from '../types';

export function activeProject(state: AppState): ProjectMeta | undefined {
  return state.projects.find((p) => p.id === state.activeProjectId);
}

/** Resolve less-off mm: row override → project default → Settings. */
export function resolveLessOffMm(
  state: AppState,
  line?: Pick<SiteMeasureLine, 'lessOffWidthMm' | 'lessOffHeightMm'> | null,
): { widthMm: number; heightMm: number } {
  const proj = activeProject(state);
  const widthMm =
    line?.lessOffWidthMm != null && line.lessOffWidthMm !== (undefined as unknown as null)
      ? Number(line.lessOffWidthMm)
      : proj?.lessOffWidthMm != null
        ? proj.lessOffWidthMm
        : state.allowances.lessOffWidthMm;
  const heightMm =
    line?.lessOffHeightMm != null
      ? Number(line.lessOffHeightMm)
      : proj?.lessOffHeightMm != null
        ? proj.lessOffHeightMm
        : state.allowances.lessOffHeightMm;
  return {
    widthMm: Number.isFinite(widthMm) ? widthMm : 0,
    heightMm: Number.isFinite(heightMm) ? heightMm : 0,
  };
}

export function computeNetSize(
  siteW: number,
  siteH: number,
  lessW: number,
  lessH: number,
): { netWidth: number; netHeight: number; warnNegative: boolean; rawW: number; rawH: number } {
  const rawW = siteW - lessW;
  const rawH = siteH - lessH;
  return {
    rawW,
    rawH,
    netWidth: Math.max(0, rawW),
    netHeight: Math.max(0, rawH),
    warnNegative: rawW < 0 || rawH < 0,
  };
}

export function withPersistedNet(
  state: AppState,
  line: SiteMeasureLine,
): SiteMeasureLine {
  const less = resolveLessOffMm(state, line);
  const net = computeNetSize(line.width, line.height, less.widthMm, less.heightMm);
  return { ...line, netWidth: net.netWidth, netHeight: net.netHeight };
}
