import type { CasementJob, SeriesDefinition, SlidingJob } from '../types';
import { ensureSeriesHardwareDefaults, rateForSize } from './hardwareKind';

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
  const s = ensureSeriesHardwareDefaults(series);
  const frictionStaySizeMm = s.frictionStaySizeMm;
  const frictionStayRate = rateForSize(s.frictionStayRates, frictionStaySizeMm, s.frictionStayRate);
  const laminationArmSizeMm = s.laminationArmSizeMm;
  const laminationArmRate = rateForSize(s.laminationArmRates, laminationArmSizeMm, 0);
  const isDoor = s.kind === 'door';
  const doorLeaves = isDoor ? Math.max(1, casement.doorLeaves || casement.openablePanels || 1) : 0;

  return {
    ...casement,
    seriesId: s.id,
    material: s.material,
    panels: s.defaultPanels || casement.panels,
    openablePanels: s.defaultOpenable || casement.openablePanels,
    doorLeaves,
    glassInsetMm: s.glassInsetMm,
    frictionStaySizeMm,
    frictionStayRate,
    frictionStaySetsPerOpenable: s.frictionStaySetsPerOpenable,
    hingeQty: s.hingeQtyPerOpenable * Math.max(1, s.defaultOpenable || casement.openablePanels || 1),
    hingeRate: s.hingeRate,
    doorConnectorQty: isDoor ? s.doorConnectorQtyPerDoor * Math.max(1, doorLeaves) : 0,
    doorConnectorRate: s.doorConnectorRate,
    laminationArmSizeMm,
    laminationArmRate,
    lockGuideRate: s.lockGuideRate,
    brushRate: s.brushRate,
    epdmRate: s.epdmRate,
    lockRate: s.lockRate,
    doorCloserRate: isDoor ? s.doorCloserRate : 0,
    floorSpringRate: isDoor ? s.floorSpringRate : 0,
    doorSetRate: isDoor ? s.doorSetRate : 0,
    swingHandleRate: isDoor ? s.swingHandleRate : 0,
    swingLockRate: isDoor ? s.swingLockRate : 0,
    handleRate: s.handleRate,
    otherHardware: s.otherHardware,
    meshAreaShare: s.meshAreaShare,
    meshNetPerSqft: s.meshNetPerSqft,
  };
}
