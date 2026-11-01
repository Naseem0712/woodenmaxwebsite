import type { Allowances, CasementJob, SeriesDefinition, SlidingJob } from '../types';
import { ensureSeriesHardwareDefaults, rateForSize } from './hardwareKind';
import {
  resolveMeshCosting,
  suggestOpenableMesh,
  suggestSlidingMeshFromTracks,
  syncMeshYesNo,
} from './meshCosting';

export function applySeriesToSliding(
  series: SeriesDefinition,
  sliding: SlidingJob,
  allowances?: Allowances,
): SlidingJob {
  const tracks = series.defaultTracks || sliding.tracks;
  const meshSettings = resolveMeshCosting(allowances);
  const sug = suggestSlidingMeshFromTracks(meshSettings, tracks);
  return {
    ...sliding,
    seriesId: series.id,
    material: series.material,
    tracks,
    glassShutters: sug.glassDoors || series.defaultShutters || sliding.glassShutters,
    meshDoors: sug.meshDoors,
    meshType: sug.meshType,
    mesh: sug.mesh,
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

  const meshSettings = resolveMeshCosting(undefined);
  const openable = s.defaultOpenable || casement.openablePanels;
  // Preserve existing mesh choice when re-applying series; only seed if still none
  const keepMesh = (casement.meshDoors ?? 0) > 0 || casement.mesh === 'Yes';
  const sug = keepMesh
    ? {
        meshDoors: casement.meshDoors ?? (casement.mesh === 'Yes' ? openable : 0),
        meshType: casement.meshType ?? 'door-side',
        mesh: syncMeshYesNo(
          casement.meshDoors ?? (casement.mesh === 'Yes' ? openable : 0),
          casement.meshType ?? 'door-side',
        ),
        ventCount: casement.ventCount ?? 0,
      }
    : suggestOpenableMesh(meshSettings, {
        openablePanels: openable,
        hasVent: casement.hasVent ?? 'No',
        doorSide: false,
      });

  return {
    ...casement,
    seriesId: s.id,
    material: s.material,
    panels: s.defaultPanels || casement.panels,
    openablePanels: openable,
    doorLeaves,
    meshDoors: sug.meshDoors,
    meshType: sug.meshType,
    mesh: sug.mesh,
    hasVent: casement.hasVent ?? 'No',
    ventCount: sug.ventCount ?? casement.ventCount ?? 0,
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
