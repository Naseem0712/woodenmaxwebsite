/**
 * Fabricator cut + hardware BOM rules (Settings-driven rates/sections).
 * Outer frame sides, shutter parts, rails, mesh sizing, wheel auto-pick by weight.
 */
import type {
  AppState,
  GlassType,
  HardwareItem,
  Material,
  MeshTypeId,
  ProfileMember,
  ProfileSku,
  SeriesDefinition,
  SlidingJob,
  WindowType,
} from '../types';
import { profileRatePerM, slidingMemberCount } from './calcs';
import { isUpvcOnlyMemberClass } from './materialContext';
import {
  defaultRailCount,
  fullMeshSizeMm,
  glassShutterWidthMm,
  isTrackMemberClass,
  sideFactor,
  slidingMeshSizeMm,
} from './memberFactors';

export type FabricatorSide = 'top' | 'bottom' | 'left' | 'right' | 'rail' | 'shutter' | 'mesh' | 'meeting';

export interface FabricatorCutLine {
  key: string;
  name: string;
  detail: string;
  side: FabricatorSide;
  pieces: number;
  cutMm: number;
  metres: number;
  ratePerM: number;
  profileSkuId?: string;
  stockLengthM: number;
}

export interface FabricatorHardwareLine {
  key: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
}

export interface FabricatorBomResult {
  cuts: FabricatorCutLine[];
  hardware: FabricatorHardwareLine[];
}

function trackRailCount(member: ProfileMember): number {
  if (member.railCount != null && member.railCount > 0) return Math.floor(member.railCount);
  return defaultRailCount(member.memberClass);
}

function skuForSide(
  member: ProfileMember,
  side: 'top' | 'bottom' | 'left' | 'right',
): string | undefined {
  if (side === 'top') {
    return member.topProfileSkuId || member.horizontalProfileSkuId || member.profileSkuId;
  }
  if (side === 'bottom') {
    return member.bottomProfileSkuId || member.horizontalProfileSkuId || member.profileSkuId;
  }
  if (side === 'left') {
    return member.leftProfileSkuId || member.verticalProfileSkuId || member.profileSkuId;
  }
  return member.rightProfileSkuId || member.verticalProfileSkuId || member.profileSkuId;
}

function resolveSku(
  profiles: ProfileSku[],
  material: Material,
  skuId: string | undefined,
  fallbackNameHints: string[],
): ProfileSku | undefined {
  if (skuId) {
    const hit = profiles.find((p) => p.id === skuId && p.material === material);
    if (hit) return hit;
  }
  const candidates = profiles.filter((p) => p.material === material);
  for (const hint of fallbackNameHints) {
    const h = hint.toLowerCase();
    const hit = candidates.find((p) => p.name.toLowerCase().includes(h));
    if (hit) return hit;
  }
  return candidates[0];
}

function stockOf(sku: ProfileSku | undefined, _material: Material, fallbackM: number): number {
  if (sku && sku.stockLengthM > 0) return sku.stockLengthM;
  return fallbackM;
}

function rateOf(
  member: ProfileMember,
  sku: ProfileSku | undefined,
  state: AppState,
): number {
  if (sku) {
    const r = profileRatePerM(sku, state.allowances);
    if (r > 0) return r;
  }
  return member.ratePerM;
}

/** Glass kg ≈ thickness_mm × 2.5 kg/m²/mm × area_m² (Settings thickness only). */
export function estimateGlassWeightKg(
  glass: GlassType | undefined,
  widthMm: number,
  heightMm: number,
): number {
  const thick = glass?.thicknessMm ?? 5;
  const areaM2 = Math.max(0, widthMm) * Math.max(0, heightMm) / 1_000_000;
  return thick * 2.5 * areaM2;
}

/** Section kg from linked Alu kg/m × perimeter metres (UPVC → 0 section weight). */
export function estimateSectionWeightKg(
  sku: ProfileSku | undefined,
  perimeterM: number,
): number {
  if (!sku || !(sku.kgPerMAluminium > 0)) return 0;
  return sku.kgPerMAluminium * Math.max(0, perimeterM);
}

/**
 * Auto-pick nearest roller/wheel by weight capacity from catalogue.
 * Prefers capacity ≥ required; else heaviest listed. Rate from catalogue.
 */
export function pickWheelByWeight(
  hardware: HardwareItem[],
  requiredKg: number,
): HardwareItem | undefined {
  const wheels = hardware.filter(
    (h) =>
      h.hardwareClass === 'sliding' &&
      (h.category.toLowerCase().includes('roller') ||
        /\b(wheel|roller)\b/i.test(h.name)) &&
      (h.weightCapacityKg ?? 0) > 0,
  );
  if (!wheels.length) return undefined;
  const sorted = [...wheels].sort(
    (a, b) => (a.weightCapacityKg ?? 0) - (b.weightCapacityKg ?? 0),
  );
  const fit = sorted.find((w) => (w.weightCapacityKg ?? 0) >= requiredKg);
  return fit ?? sorted[sorted.length - 1];
}

function findHw(
  hardware: HardwareItem[],
  predicate: (h: HardwareItem) => boolean,
): HardwareItem | undefined {
  return hardware.find(predicate);
}

function pushCut(
  out: FabricatorCutLine[],
  line: Omit<FabricatorCutLine, 'metres'> & { metres?: number },
) {
  if (line.pieces <= 0 || line.cutMm <= 0) return;
  const metres = line.metres ?? (line.pieces * line.cutMm) / 1000;
  if (metres <= 0) return;
  out.push({ ...line, metres });
}

function membersForMaterial(series: SeriesDefinition): ProfileMember[] {
  return series.members.filter((m) => {
    if (series.material === 'Aluminium' && isUpvcOnlyMemberClass(m.memberClass)) return false;
    return true;
  });
}

/**
 * Build detailed fabricator cuts + hardware for one sliding opening.
 * Rates / SKUs / capacities come from Settings masters only.
 */
export function buildSlidingFabricatorBom(
  state: AppState,
  series: SeriesDefinition,
  job: Pick<
    SlidingJob,
    | 'material'
    | 'tracks'
    | 'glassShutters'
    | 'mesh'
    | 'meshDoors'
    | 'meshType'
    | 'widthMm'
    | 'heightMm'
    | 'qty'
    | 'glassTypeId'
    | 'glassInsetMm'
    | 'rollersPerShutter'
    | 'rollerRate'
    | 'lockHandleSet'
    | 'otherHardware'
  >,
  profiles: ProfileSku[],
  hardware: HardwareItem[],
  glass: GlassType | undefined,
  defaultStockM: number,
): FabricatorBomResult {
  const cuts: FabricatorCutLine[] = [];
  const hwOut: FabricatorHardwareLine[] = [];
  const material = series.material;
  const matProfiles = profiles.filter((p) => p.material === material);
  const members = membersForMaterial(series);
  const qty = Math.max(1, job.qty || 1);
  const W = job.widthMm;
  const H = job.heightMm;
  const glassShutters = Math.max(0, job.glassShutters || 0);
  const meshDoors = job.meshDoors ?? (job.mesh === 'Yes' ? 1 : 0);
  const shutterW = glassShutterWidthMm(W, Math.max(2, glassShutters || 2));

  // —— Outer track / frame sides ——
  for (const m of members) {
    if (!isTrackMemberClass(m.memberClass)) continue;
    const count = slidingMemberCount(m.memberClass, job, members);
    if (count <= 0) continue;

    const sides: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
    for (const side of sides) {
      const factor = sideFactor(m, side);
      if (factor <= 0) continue;
      const cutMm = side === 'top' || side === 'bottom' ? W : H;
      const pieces = factor * count * qty;
      const sku = resolveSku(matProfiles, material, skuForSide(m, side), [
        m.name,
        side === 'top' || side === 'bottom' ? 'track' : 'vertical',
        'frame',
      ]);
      pushCut(cuts, {
        key: `${m.id}:${side}`,
        name: `${m.name} · ${side}`,
        detail: `Outer frame ${side}`,
        side,
        pieces,
        cutMm,
        ratePerM: rateOf(m, sku, state),
        profileSkuId: sku?.id,
        stockLengthM: stockOf(sku, material, defaultStockM),
      });
    }

    const rails = trackRailCount(m);
    if (rails > 0) {
      const sku = resolveSku(matProfiles, material, m.bottomProfileSkuId || m.horizontalProfileSkuId || m.profileSkuId, [
        'rail',
        'track',
        m.name,
      ]);
      pushCut(cuts, {
        key: `${m.id}:rail`,
        name: `${m.name} · bottom rail`,
        detail: `${rails} rail(s) × full width (bottom only)`,
        side: 'rail',
        pieces: rails * count * qty,
        cutMm: W,
        ratePerM: rateOf(m, sku, state),
        profileSkuId: sku?.id,
        stockLengthM: stockOf(sku, material, defaultStockM),
      });
    }
  }

  // —— Glass shutters (handle / center / top / bottom) ——
  const shutterMembers = members.filter((m) => m.memberClass === 'Shutter' || m.memberClass === 'UPVC shutter');
  const byPart = (part: string) => shutterMembers.find((m) => m.shutterPart === part);
  const sash = byPart('sash') ?? shutterMembers.find((m) => !m.shutterPart || m.shutterPart === 'sash');
  const handleM = byPart('handle-side') ?? sash;
  const centerM = byPart('center') ?? sash;
  const topM = byPart('top') ?? sash;
  const bottomM = byPart('bottom') ?? sash;

  if (glassShutters > 0 && sash) {
    const perShutter = [
      { part: 'handle-side' as const, member: handleM, cutMm: H, piecesEach: 1, side: 'left' as const },
      { part: 'center' as const, member: centerM, cutMm: H, piecesEach: 1, side: 'right' as const },
      { part: 'top' as const, member: topM, cutMm: shutterW, piecesEach: 1, side: 'top' as const },
      { part: 'bottom' as const, member: bottomM, cutMm: shutterW, piecesEach: 1, side: 'bottom' as const },
    ];
    for (const row of perShutter) {
      if (!row.member) continue;
      const sku = resolveSku(
        matProfiles,
        material,
        skuForSide(row.member, row.side) || row.member.profileSkuId,
        [row.member.name, 'shutter', 'sash'],
      );
      pushCut(cuts, {
        key: `${row.member.id}:shutter:${row.part}`,
        name: `${row.member.name} · ${row.part}`,
        detail: `Glass shutter × ${glassShutters}`,
        side: 'shutter',
        pieces: row.piecesEach * glassShutters * qty,
        cutMm: row.cutMm,
        ratePerM: rateOf(row.member, sku, state),
        profileSkuId: sku?.id,
        stockLengthM: stockOf(sku, material, defaultStockM),
      });
    }

    // 4 glass shutters → +1 vertical meeting section
    if (glassShutters >= 4) {
      const meetMember =
        members.find((m) => m.memberClass === 'Meeting') ?? centerM ?? sash;
      if (meetMember) {
        const sku = resolveSku(matProfiles, material, meetMember.verticalProfileSkuId || meetMember.profileSkuId, [
          'meeting',
          'interlock',
          meetMember.name,
        ]);
        pushCut(cuts, {
          key: `${meetMember.id}:extra-meeting`,
          name: `${meetMember.name} · meeting vertical`,
          detail: '4 glass shutters — extra meeting section',
          side: 'meeting',
          pieces: 1 * qty,
          cutMm: H,
          ratePerM: rateOf(meetMember, sku, state),
          profileSkuId: sku?.id,
          stockLengthM: stockOf(sku, material, defaultStockM),
        });
      }
    }
  }

  // —— Interlock ——
  const interlock = members.find(
    (m) => m.memberClass === 'Meeting' || m.shutterPart === 'interlock',
  );
  if (interlock && glassShutters > 0) {
    const style = interlock.interlockStyle ?? 'slim';
    const count = slidingMemberCount('Meeting', job, members);
    if (style === 'slim' || style === 'same-section') {
      // Slim / same-section: vertical interlock bars (Meeting count)
      if (count > 0) {
        const sku = resolveSku(matProfiles, material, interlock.verticalProfileSkuId || interlock.profileSkuId, [
          'interlock',
          interlock.name,
        ]);
        // >2 glass: middle door gets interlock both vertical sides
        const bothSidesExtra = glassShutters > 2 ? Math.max(0, glassShutters - 2) : 0;
        const pieces = (count + bothSidesExtra) * qty;
        pushCut(cuts, {
          key: `${interlock.id}:interlock`,
          name: `${interlock.name} · interlock`,
          detail: style === 'slim' ? 'Slim interlock vertical' : 'Same-section interlock vertical',
          side: 'meeting',
          pieces,
          cutMm: H,
          ratePerM: rateOf(interlock, sku, state),
          profileSkuId: sku?.id,
          stockLengthM: stockOf(sku, material, defaultStockM),
        });
        if (style === 'same-section') {
          // Same section all sides: also top/bottom of interlock zone at shutter width
          pushCut(cuts, {
            key: `${interlock.id}:interlock-h`,
            name: `${interlock.name} · interlock top/bottom`,
            detail: 'Same-section interlock horizontals',
            side: 'meeting',
            pieces: 2 * count * qty,
            cutMm: shutterW,
            ratePerM: rateOf(interlock, sku, state),
            profileSkuId: sku?.id,
            stockLengthM: stockOf(sku, material, defaultStockM),
          });
        }
      }
    }
    // Cap style → hardware caps on shutter verticals (below)
  }

  // —— Mesh shutter ——
  const meshMember = members.find((m) => m.memberClass === 'Mesh');
  if (meshMember && meshDoors > 0) {
    const meshType = (job.meshType ?? 'none') as MeshTypeId;
    const size =
      meshType === 'sliding'
        ? slidingMeshSizeMm(W, H)
        : meshType === 'rolling' ||
            meshType === 'collapsible' ||
            meshType === 'fixed' ||
            meshType === 'door-side' ||
            meshType === 'swing'
          ? fullMeshSizeMm(W, H)
          : slidingMeshSizeMm(W, H);

    const sku = resolveSku(matProfiles, material, meshMember.profileSkuId, [
      'mesh',
      meshMember.name,
    ]);
    // Mesh frame like one shutter: 2V + 2H
    pushCut(cuts, {
      key: `${meshMember.id}:mesh-v`,
      name: `${meshMember.name} · vertical`,
      detail: `Mesh shutter × ${meshDoors}`,
      side: 'mesh',
      pieces: 2 * meshDoors * qty,
      cutMm: size.heightMm,
      ratePerM: rateOf(meshMember, sku, state),
      profileSkuId: sku?.id,
      stockLengthM: stockOf(sku, material, defaultStockM),
    });
    pushCut(cuts, {
      key: `${meshMember.id}:mesh-h`,
      name: `${meshMember.name} · horizontal`,
      detail: `Mesh shutter × ${meshDoors}`,
      side: 'mesh',
      pieces: 2 * meshDoors * qty,
      cutMm: size.widthMm,
      ratePerM: rateOf(meshMember, sku, state),
      profileSkuId: sku?.id,
      stockLengthM: stockOf(sku, material, defaultStockM),
    });

    if (meshMember.meshAdapter) {
      pushCut(cuts, {
        key: `${meshMember.id}:adapter-v`,
        name: `${meshMember.name} · mesh adapter V`,
        detail: 'Mesh adapter all sides (2V)',
        side: 'mesh',
        pieces: 2 * meshDoors * qty,
        cutMm: size.heightMm,
        ratePerM: rateOf(meshMember, sku, state),
        profileSkuId: sku?.id,
        stockLengthM: stockOf(sku, material, defaultStockM),
      });
      pushCut(cuts, {
        key: `${meshMember.id}:adapter-h`,
        name: `${meshMember.name} · mesh adapter H`,
        detail: 'Mesh adapter all sides (2H)',
        side: 'mesh',
        pieces: 2 * meshDoors * qty,
        cutMm: size.widthMm,
        ratePerM: rateOf(meshMember, sku, state),
        profileSkuId: sku?.id,
        stockLengthM: stockOf(sku, material, defaultStockM),
      });
    }
  }

  // —— Hardware (per shutter / window) ——
  const shutterPerimeterM = (2 * shutterW + 2 * H) / 1000;
  const glassW = Math.max(0, shutterW - 2 * (job.glassInsetMm || 0));
  const glassH = Math.max(0, H - 2 * (job.glassInsetMm || 0));
  const glassKg = estimateGlassWeightKg(glass, glassW, glassH);
  const sashSku = resolveSku(matProfiles, material, sash?.profileSkuId, ['shutter', 'sash']);
  const sectionKg = estimateSectionWeightKg(sashSku, shutterPerimeterM);
  const shutterKg = glassKg + sectionKg;

  const wheel = pickWheelByWeight(hardware, shutterKg);
  const wheelsPerShutter = job.rollersPerShutter > 0 ? job.rollersPerShutter : 2;
  if (glassShutters > 0) {
    const wheelQty = wheelsPerShutter * glassShutters * qty;
    const wheelRate = wheel?.rate ?? job.rollerRate;
    const wheelName = wheel
      ? `${wheel.name} (≤${wheel.weightCapacityKg} kg)`
      : `Roller / wheel (${series.name})`;
    if (wheelQty > 0 && wheelRate >= 0) {
      hwOut.push({
        key: `${series.id}:wheel`,
        name: wheelName,
        unit: 'pc',
        qty: wheelQty,
        rate: wheelRate,
      });
    }
  }

  const connector =
    findHw(
      hardware,
      (h) =>
        h.hardwareClass === 'sliding' || h.hardwareClass === 'shared' || h.hardwareClass === 'door'
          ? /connector/i.test(h.name)
          : false,
    ) ?? findHw(hardware, (h) => /connector/i.test(h.name));
  if (glassShutters > 0) {
    const connQty = 4 * glassShutters * qty;
    hwOut.push({
      key: `${series.id}:connector`,
      name: connector?.name ?? 'Shutter connector',
      unit: 'pc',
      qty: connQty,
      rate: connector?.rate ?? series.doorConnectorRate ?? 0,
    });
  }

  const interlockStyle = interlock?.interlockStyle ?? 'slim';
  if (interlockStyle === 'cap' && glassShutters > 0) {
    // Cap on each shutter vertical (1–1 → 2 caps per shutter)
    const cap =
      findHw(hardware, (h) => /interlock\s*cap|end\s*cap/i.test(h.name)) ??
      findHw(hardware, (h) => /end cap/i.test(h.name));
    hwOut.push({
      key: `${series.id}:interlock-cap`,
      name: cap?.name ?? 'Interlock cap',
      unit: 'pc',
      qty: 2 * glassShutters * qty,
      rate: cap?.rate ?? 0,
    });
  }

  if (job.lockHandleSet > 0) {
    hwOut.push({
      key: `${series.id}:lock`,
      name: series.lockHandleLabel || 'Lock / handle set',
      unit: 'set',
      qty: qty,
      rate: job.lockHandleSet,
    });
  }

  // Brush + EPDM dual layer all sides of shutters
  const dualPerimeterM = 2 * shutterPerimeterM * glassShutters * qty;
  const brush =
    findHw(hardware, (h) => /wool\s*pile|brush/i.test(h.name) && h.unit === 'm') ??
    findHw(hardware, (h) => /brush|pile/i.test(h.name));
  const epdm =
    findHw(hardware, (h) => /epdm|gasket/i.test(h.name) && h.unit === 'm') ??
    findHw(hardware, (h) => /epdm|gasket/i.test(h.name));
  if (glassShutters > 0 && dualPerimeterM > 0) {
    hwOut.push({
      key: `${series.id}:brush`,
      name: brush?.name ?? 'Brush / wool pile (dual layer)',
      unit: 'm',
      qty: dualPerimeterM,
      rate: brush?.rate ?? series.brushRate ?? 0,
    });
    hwOut.push({
      key: `${series.id}:epdm`,
      name: epdm?.name ?? 'EPDM (dual layer)',
      unit: 'm',
      qty: dualPerimeterM,
      rate: epdm?.rate ?? series.epdmRate ?? 0,
    });
  }

  if (job.otherHardware > 0) {
    hwOut.push({
      key: `${series.id}:other`,
      name: `Other hardware (${series.name})`,
      unit: 'set',
      qty,
      rate: job.otherHardware,
    });
  }

  return { cuts, hardware: hwOut };
}

/** Guard: window type / series material must match project material. */
export function materialMatchesProject(
  wt: WindowType | undefined,
  series: SeriesDefinition | undefined,
  projectMaterial: Material,
): boolean {
  if (wt && wt.material !== projectMaterial) return false;
  if (series && series.material !== projectMaterial) return false;
  return true;
}
