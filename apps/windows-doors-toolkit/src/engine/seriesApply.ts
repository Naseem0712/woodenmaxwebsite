import type { CasementJob, SeriesDefinition, SlidingJob } from '../types';

export function applySeriesToSliding(series: SeriesDefinition, sliding: SlidingJob): SlidingJob {
  return {
    ...sliding,
    seriesId: series.id,
    material: series.material,
    tracks: series.defaultTracks || sliding.tracks,
    glassShutters: series.defaultShutters || sliding.glassShutters,
    glassInsetMm: series.glassInsetMm,
    rollersPerShutter: series.rollersPerShutter,
    rollerRate: series.rollerRate,
    lockHandleSet: series.lockHandleSet,
    otherHardware: series.otherHardware,
    meshAreaShare: series.meshAreaShare,
    meshNetPerSqft: series.meshNetPerSqft,
  };
}

export function applySeriesToCasement(series: SeriesDefinition, casement: CasementJob): CasementJob {
  return {
    ...casement,
    seriesId: series.id,
    material: series.material,
    panels: series.defaultPanels || casement.panels,
    openablePanels: series.defaultOpenable || casement.openablePanels,
    glassInsetMm: series.glassInsetMm,
    frictionStayRate: series.frictionStayRate,
    handleRate: series.handleRate,
    otherHardware: series.otherHardware,
    meshAreaShare: series.meshAreaShare,
    meshNetPerSqft: series.meshNetPerSqft,
  };
}
