/**
 * Side-factor helpers for series profile members.
 * Coarse Factor V/H remain the fallback; T/B/L/R win when set.
 */
import type { ProfileMember, ShutterPart } from '../types';

export function hasSideFactors(m: Pick<ProfileMember, 'topFactor' | 'bottomFactor' | 'leftFactor' | 'rightFactor'>): boolean {
  return (
    m.topFactor != null ||
    m.bottomFactor != null ||
    m.leftFactor != null ||
    m.rightFactor != null
  );
}

/** Effective horizontal (width) factor = top+bottom when sides set, else wFactor. */
export function effectiveWFactor(m: Pick<ProfileMember, 'wFactor' | 'topFactor' | 'bottomFactor'>): number {
  if (m.topFactor != null || m.bottomFactor != null) {
    return (Number(m.topFactor) || 0) + (Number(m.bottomFactor) || 0);
  }
  return Number(m.wFactor) || 0;
}

/** Effective vertical (height) factor = left+right when sides set, else hFactor. */
export function effectiveHFactor(m: Pick<ProfileMember, 'hFactor' | 'leftFactor' | 'rightFactor'>): number {
  if (m.leftFactor != null || m.rightFactor != null) {
    return (Number(m.leftFactor) || 0) + (Number(m.rightFactor) || 0);
  }
  return Number(m.hFactor) || 0;
}

export function sideFactor(
  m: ProfileMember,
  side: 'top' | 'bottom' | 'left' | 'right',
): number {
  if (side === 'top') {
    if (m.topFactor != null) return Number(m.topFactor) || 0;
    return hasSideFactors(m) ? 0 : (Number(m.wFactor) || 0) / 2;
  }
  if (side === 'bottom') {
    if (m.bottomFactor != null) return Number(m.bottomFactor) || 0;
    return hasSideFactors(m) ? 0 : (Number(m.wFactor) || 0) / 2;
  }
  if (side === 'left') {
    if (m.leftFactor != null) return Number(m.leftFactor) || 0;
    return hasSideFactors(m) ? 0 : (Number(m.hFactor) || 0) / 2;
  }
  if (m.rightFactor != null) return Number(m.rightFactor) || 0;
  return hasSideFactors(m) ? 0 : (Number(m.hFactor) || 0) / 2;
}

/**
 * Classic sliding shutter width:
 * 2 or 4 glass shutters → half window; otherwise equal split.
 */
export function glassShutterWidthMm(windowWidthMm: number, glassShutters: number): number {
  const n = Math.max(1, Number(glassShutters) || 1);
  if (n === 2 || n === 4) return windowWidthMm / 2;
  return windowWidthMm / n;
}

/** Sliding mesh shutter: half window × full height (like one glass shutter). */
export function slidingMeshSizeMm(
  windowWidthMm: number,
  windowHeightMm: number,
): { widthMm: number; heightMm: number } {
  return { widthMm: windowWidthMm / 2, heightMm: windowHeightMm };
}

/** Rolling / collapsible / other mesh types: full window size. */
export function fullMeshSizeMm(
  windowWidthMm: number,
  windowHeightMm: number,
): { widthMm: number; heightMm: number } {
  return { widthMm: windowWidthMm, heightMm: windowHeightMm };
}

export function isTrackMemberClass(memberClass: string): boolean {
  return memberClass === '2-track' || memberClass === '2.5-track' || memberClass === '3-track';
}

export function defaultRailCount(memberClass: string): number {
  if (memberClass === '2-track') return 2;
  if (memberClass === '2.5-track' || memberClass === '3-track') return 3;
  return 0;
}

export function shutterPartLabel(part: ShutterPart | undefined): string {
  switch (part) {
    case 'top':
      return 'Top';
    case 'bottom':
      return 'Bottom';
    case 'handle-side':
      return 'Handle-side';
    case 'center':
      return 'Center vertical';
    case 'interlock':
      return 'Interlock';
    case 'sash':
    default:
      return 'Sash';
  }
}
