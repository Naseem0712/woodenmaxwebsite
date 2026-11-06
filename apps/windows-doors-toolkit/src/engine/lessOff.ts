import type { AppState, Material, ProjectMeta, SiteMeasureLine } from '../types';
import { activeProjectMeta, projectMaterial } from './materialContext';

export function activeProject(state: AppState): ProjectMeta | undefined {
  return activeProjectMeta(state);
}

/** Settings less-off for a material (UPVC vs Aluminium defaults). */
export function settingsLessOffForMaterial(
  state: AppState,
  material: Material,
): { widthMm: number; heightMm: number } {
  if (material === 'Aluminium') {
    return {
      widthMm: state.allowances.lessOffAluWidthMm ?? state.allowances.lessOffWidthMm,
      heightMm: state.allowances.lessOffAluHeightMm ?? state.allowances.lessOffHeightMm,
    };
  }
  return {
    widthMm: state.allowances.lessOffWidthMm,
    heightMm: state.allowances.lessOffHeightMm,
  };
}

/** Resolve less-off mm: row override → project default → Settings (by project material). */
export function resolveLessOffMm(
  state: AppState,
  line?: Pick<SiteMeasureLine, 'lessOffWidthMm' | 'lessOffHeightMm'> | null,
): { widthMm: number; heightMm: number } {
  const proj = activeProject(state);
  const material = projectMaterial(state);
  const settings = settingsLessOffForMaterial(state, material);
  const widthMm =
    line?.lessOffWidthMm != null && line.lessOffWidthMm !== (undefined as unknown as null)
      ? Number(line.lessOffWidthMm)
      : proj?.lessOffWidthMm != null
        ? proj.lessOffWidthMm
        : settings.widthMm;
  const heightMm =
    line?.lessOffHeightMm != null
      ? Number(line.lessOffHeightMm)
      : proj?.lessOffHeightMm != null
        ? proj.lessOffHeightMm
        : settings.heightMm;
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
