import type {
  Allowances,
  AppState,
  CasementJob,
  GlassType,
  OpeningLine,
  ProfileMember,
  ProfileSku,
  SlidingJob,
  WindowType,
} from '../types';
import { computeNetSize, resolveLessOffMm } from './lessOff';
import { meshLineAmount, resolveMeshCosting } from './meshCosting';
import {
  applyLineDiscount,
  calcCustomQuoteLines,
  gstOnGrand,
} from './quoteEnhancements';

const MM_TO_SQFT = 92903.04;

export function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(Math.round((value / step) * 1e6) / 1e6) * step;
}

export function toSqft(width: number, height: number, unit: 'mm' | 'inch' | 'ft'): number {
  if (unit === 'mm') return (width * height) / MM_TO_SQFT;
  if (unit === 'inch') return (width * height) / 144;
  return width * height;
}

export function lookupWindowType(types: WindowType[], id: string): WindowType | undefined {
  return types.find((t) => t.id === id);
}

export function lookupGlass(types: GlassType[], id: string): GlassType | undefined {
  return types.find((g) => g.id === id);
}

export function profileRatePerM(p: ProfileSku, a: Allowances): number {
  if (p.kgPerMAluminium > 0) {
    return p.kgPerMAluminium * (a.aluminiumRatePerKg + a.coatingPerKg);
  }
  return p.ratePerMUpvc;
}

/**
 * Excel Tool 02 member count (K) — mesh frames follow meshDoors qty.
 * Track matching: 2-track (no mesh typical), 2.5-track / 3-track (mesh materials).
 * If a series has no explicit 2.5-track member, 2.5 jobs fall back to 3-track rows.
 */
export function slidingMemberCount(
  memberClass: string,
  job: Pick<SlidingJob, 'material' | 'tracks' | 'glassShutters' | 'mesh' | 'meshDoors'>,
  seriesMembers?: Array<Pick<ProfileMember, 'memberClass'>>,
): number {
  const meshDoors = job.meshDoors ?? (job.mesh === 'Yes' ? 1 : 0);
  const tracks = Number(job.tracks) || 0;
  const use2Track = tracks > 0 && tracks < 2.45;
  const use25Track = tracks >= 2.45 && tracks < 2.75;
  const use3Track = tracks >= 2.75 && tracks < 4;
  const has25Member = seriesMembers?.some((m) => m.memberClass === '2.5-track') ?? false;
  switch (memberClass) {
    case '2-track':
      return use2Track ? 1 : 0;
    case '2.5-track':
      return use25Track ? 1 : 0;
    case '3-track':
      if (use3Track) return 1;
      // Legacy series without a 2.5-track row still supply outer for 2.5 jobs
      if (use25Track && !has25Member) return 1;
      return 0;
    case 'Shutter':
      return job.glassShutters;
    case 'Meeting':
      return Math.max(0, job.glassShutters - 1);
    case 'Mesh':
      return Math.max(0, meshDoors);
    case 'UPVC only':
      return job.material === 'UPVC' ? 1 : 0;
    case 'UPVC shutter':
      return job.material === 'UPVC' ? job.glassShutters : 0;
    default:
      return 1;
  }
}

export function slidingMemberMetres(
  m: ProfileMember,
  job: SlidingJob,
  seriesMembers?: Array<Pick<ProfileMember, 'memberClass'>>,
): { count: number; metres: number; cost: number } {
  const count = slidingMemberCount(m.memberClass, job, seriesMembers);
  const metres = ((m.wFactor * job.widthMm + m.hFactor * job.heightMm) / 1000) * count;
  return { count, metres, cost: metres * m.ratePerM };
}

/** Excel Tool 03 member count (M) — mesh panels follow meshDoors / vents. */
export function casementMemberCount(
  memberClass: string,
  job: Pick<
    CasementJob,
    'material' | 'panels' | 'openablePanels' | 'mesh' | 'meshDoors' | 'hasVent' | 'ventCount'
  >,
): number {
  const meshDoors =
    job.meshDoors ??
    (job.mesh === 'Yes'
      ? job.hasVent === 'Yes'
        ? Math.max(1, job.ventCount || job.openablePanels)
        : job.openablePanels
      : 0);
  switch (memberClass) {
    case 'Mullion':
      return Math.max(0, job.panels - 1);
    case 'Openable panel':
      return job.openablePanels;
    case 'Panel':
      return job.panels;
    case 'Mesh panel':
      return Math.max(0, meshDoors);
    case 'UPVC only':
      return job.material === 'UPVC' ? 1 : 0;
    case 'UPVC mullion':
      return job.material === 'UPVC' ? Math.max(0, job.panels - 1) : 0;
    case 'UPVC openable':
      return job.material === 'UPVC' ? job.openablePanels : 0;
    default:
      return 1;
  }
}

export function casementMemberMetres(
  m: ProfileMember,
  job: CasementJob,
): { count: number; metres: number; cost: number } {
  const count = casementMemberCount(m.memberClass, job);
  const panelClasses = new Set(['Openable panel', 'Panel', 'Mesh panel', 'UPVC openable']);
  const widthForMember =
    panelClasses.has(m.memberClass) && job.panels > 0 ? job.widthMm / job.panels : job.widthMm;
  const metres = ((m.wFactor * widthForMember + m.hFactor * job.heightMm) / 1000) * count;
  return { count, metres, cost: metres * m.ratePerM };
}

export interface OpeningCalc {
  line: OpeningLine;
  typeName: string;
  actualSqftUnit: number;
  actualSqft: number;
  chargeableSqft: number;
  rate: number;
  estimate: number;
  discountPercent: number;
  discountAmount: number;
  selling: number;
  hasDiscount: boolean;
}

export function calcOpenings(state: AppState): {
  rows: OpeningCalc[];
  totalActual: number;
  totalChargeable: number;
  totalEstimate: number;
  totalSelling: number;
  totalLineDiscount: number;
  totalWindows: number;
} {
  const unit = state.allowances.unit;
  const min = state.allowances.minChargeableSqft;
  const rows = state.openings.map((line) => {
    const t = lookupWindowType(state.windowTypes, line.windowTypeId);
    const actualSqftUnit = toSqft(line.width, line.height, unit);
    const actualSqft = actualSqftUnit * line.qty;
    const chargeableSqft = Math.max(actualSqftUnit, min) * line.qty;
    const rate = t?.ratePerSqft ?? 0;
    const estimate = chargeableSqft * rate;
    const disc = applyLineDiscount(estimate, line.discountPercent);
    return {
      line,
      typeName: t?.name ?? '—',
      actualSqftUnit,
      actualSqft,
      chargeableSqft,
      rate,
      estimate,
      discountPercent: disc.discountPercent,
      discountAmount: disc.discountAmount,
      selling: disc.selling,
      hasDiscount: disc.hasDiscount,
    };
  });
  return {
    rows,
    totalActual: rows.reduce((s, r) => s + r.actualSqft, 0),
    totalChargeable: rows.reduce((s, r) => s + r.chargeableSqft, 0),
    totalEstimate: rows.reduce((s, r) => s + r.estimate, 0),
    totalSelling: rows.reduce((s, r) => s + r.selling, 0),
    totalLineDiscount: rows.reduce((s, r) => s + r.discountAmount, 0),
    totalWindows: state.openings.reduce((s, o) => s + o.qty, 0),
  };
}

export interface ConfigCostResult {
  windowSqft: number;
  members: Array<ProfileMember & { count: number; metres: number; cost: number }>;
  profileMetres: number;
  profileCost: number;
  glassSqft: number;
  glassRate: number;
  glassCost: number;
  wastage: number;
  hardware: number;
  meshNet: number;
  fabInstall: number;
  transportShare: number;
  silicone: number;
  costPerWindow: number;
  costPerSqft: number;
  pricePerSqft: number;
  pricePerWindow: number;
  totalAll: number;
  profitAll: number;
  marginAtQuoted: number;
  quoteStatus: string;
}

export function calcSliding(state: AppState): ConfigCostResult {
  const job = state.sliding;
  const series = state.series.find((s) => s.id === job.seriesId);
  const membersSrc = series?.members ?? [];
  const glass = lookupGlass(state.glassTypes, job.glassTypeId);
  const glassRate = glass?.ratePerSqft ?? 0;
  const members = membersSrc.map((m) => ({
    ...m,
    ...slidingMemberMetres(m, job, membersSrc),
  }));
  const profileMetres = members.reduce((s, m) => s + m.metres, 0);
  const profileCost = members.reduce((s, m) => s + m.cost, 0);
  const windowSqft = toSqft(job.widthMm, job.heightMm, 'mm');
  const glassSqft = toSqft(
    Math.max(0, job.widthMm - 2 * job.glassInsetMm),
    Math.max(0, job.heightMm - 2 * job.glassInsetMm),
    'mm',
  );
  const glassCost = glassSqft * glassRate;
  const wastage = (profileCost + glassCost) * job.wastage;
  const hardware =
    job.rollersPerShutter * job.glassShutters * job.rollerRate +
    job.lockHandleSet +
    job.otherHardware;
  const meshSettings = resolveMeshCosting(state.allowances);
  const meshDoors = job.meshDoors ?? (job.mesh === 'Yes' ? 1 : 0);
  const meshType = job.meshType ?? (job.mesh === 'Yes' ? 'rolling' : 'none');
  const typedMesh = meshLineAmount(
    {
      width: job.widthMm,
      height: job.heightMm,
      unit: 'mm',
      meshType,
      meshDoors,
      glassDoors: job.glassShutters,
      meshAreaShare: job.meshAreaShare,
    },
    meshSettings,
    1,
    job.meshNetPerSqft,
  );
  // Prefer Settings typed rates; fall back to series meshNet × share when type unset but Yes
  const meshNet =
    meshType !== 'none' && meshDoors > 0
      ? typedMesh.amount
      : job.mesh === 'Yes'
        ? windowSqft * job.meshAreaShare * job.meshNetPerSqft
        : 0;
  const fabInstall = (job.fabricationLabourPerSqft + job.installationLabourPerSqft) * windowSqft;
  const transportShare = job.qty <= 0 ? 0 : job.transportPerJob / job.qty;
  const silicone = job.siliconePerWindow;
  const costPerWindow =
    profileCost + glassCost + wastage + hardware + meshNet + fabInstall + silicone + transportShare;
  const costPerSqft = windowSqft <= 0 ? 0 : costPerWindow / windowSqft;
  const denom = job.targetMargin >= 1 ? 1 : 1 - job.targetMargin;
  const rawPriceSqft = windowSqft <= 0 ? 0 : costPerWindow / denom / windowSqft;
  const pricePerSqft = roundUpToStep(rawPriceSqft, job.priceRoundUpStep);
  const pricePerWindow = pricePerSqft * windowSqft;
  const totalAll = pricePerWindow * job.qty;
  const profitAll = (pricePerWindow - costPerWindow) * job.qty;
  const marginAtQuoted =
    job.quotedRatePerSqft <= 0 ? 0 : (job.quotedRatePerSqft - costPerSqft) / job.quotedRatePerSqft;
  let quoteStatus = '';
  if (job.quotedRatePerSqft > 0) {
    if (job.quotedRatePerSqft < costPerSqft) quoteStatus = 'Price below cost';
    else if (job.quotedRatePerSqft < pricePerSqft) quoteStatus = 'Below target margin';
    else quoteStatus = 'On target';
  }
  return {
    windowSqft,
    members,
    profileMetres,
    profileCost,
    glassSqft,
    glassRate,
    glassCost,
    wastage,
    hardware,
    meshNet,
    fabInstall,
    transportShare,
    silicone,
    costPerWindow,
    costPerSqft,
    pricePerSqft,
    pricePerWindow,
    totalAll,
    profitAll,
    marginAtQuoted,
    quoteStatus,
  };
}

export function calcCasement(state: AppState): ConfigCostResult {
  const job = state.casement;
  const series = state.series.find((s) => s.id === job.seriesId);
  const membersSrc = series?.members ?? [];
  const glass = lookupGlass(state.glassTypes, job.glassTypeId);
  const glassRate = glass?.ratePerSqft ?? 0;
  const members = membersSrc.map((m) => ({ ...m, ...casementMemberMetres(m, job) }));
  const profileMetres = members.reduce((s, m) => s + m.metres, 0);
  const profileCost = members.reduce((s, m) => s + m.cost, 0);
  const windowSqft = toSqft(job.widthMm, job.heightMm, 'mm');
  const glassSqft = toSqft(
    Math.max(0, job.widthMm - 2 * job.glassInsetMm),
    Math.max(0, job.heightMm - 2 * job.glassInsetMm),
    'mm',
  );
  const glassCost = glassSqft * glassRate;
  const wastage = (profileCost + glassCost) * job.wastage;
  // Casement / openable / door hardware only — never rollers / sliding lock sets.
  // Friction stay: 1 set (2 pc) × setsPerOpenable × openable; rate from size catalogue.
  const staySets =
    (job.frictionStaySetsPerOpenable ?? 1) * Math.max(0, job.openablePanels);
  const frictionStayCost = (job.frictionStayRate ?? 0) * staySets;
  const hingeCost = (job.hingeRate ?? 0) * (job.hingeQty ?? 0);
  const connectorCost = (job.doorConnectorRate ?? 0) * (job.doorConnectorQty ?? 0);
  const armCost = (job.laminationArmRate ?? 0) * Math.max(0, job.openablePanels);
  const catalogueCost =
    (job.lockGuideRate ?? 0) +
    (job.brushRate ?? 0) +
    (job.epdmRate ?? 0) +
    (job.lockRate ?? 0) +
    (job.doorCloserRate ?? 0);
  const swingCost =
    (job.floorSpringRate ?? 0) +
    (job.doorSetRate ?? 0) +
    (job.swingHandleRate ?? 0) +
    (job.swingLockRate ?? 0);
  const hardware =
    frictionStayCost +
    hingeCost +
    connectorCost +
    armCost +
    catalogueCost +
    swingCost +
    (job.handleRate ?? 0) * Math.max(0, job.openablePanels) +
    (job.otherHardware ?? 0);
  const meshSettings = resolveMeshCosting(state.allowances);
  const meshDoors =
    job.meshDoors ??
    (job.mesh === 'Yes'
      ? job.hasVent === 'Yes'
        ? Math.max(1, job.ventCount || job.openablePanels)
        : job.openablePanels
      : 0);
  const meshType =
    job.meshType ??
    (job.mesh === 'Yes' ? (job.hasVent === 'Yes' ? 'fixed' : 'door-side') : 'none');
  const typedMesh = meshLineAmount(
    {
      width: job.widthMm,
      height: job.heightMm,
      unit: 'mm',
      meshType,
      meshDoors,
      panels: job.panels,
      glassDoors: job.openablePanels,
      hasVent: job.hasVent ?? 'No',
      ventCount: job.ventCount ?? 0,
      meshAreaShare: job.meshAreaShare,
    },
    meshSettings,
    1,
    job.meshNetPerSqft,
  );
  const meshNet =
    meshType !== 'none' && meshDoors > 0
      ? typedMesh.amount
      : job.mesh === 'Yes'
        ? windowSqft * job.meshAreaShare * job.meshNetPerSqft
        : 0;
  const fabInstall = (job.fabricationLabourPerSqft + job.installationLabourPerSqft) * windowSqft;
  const transportShare = job.qty <= 0 ? 0 : job.transportPerJob / job.qty;
  const silicone = job.siliconePerWindow;
  const costPerWindow =
    profileCost + glassCost + wastage + hardware + meshNet + fabInstall + silicone + transportShare;
  const costPerSqft = windowSqft <= 0 ? 0 : costPerWindow / windowSqft;
  const denom = job.targetMargin >= 1 ? 1 : 1 - job.targetMargin;
  const rawPriceSqft = windowSqft <= 0 ? 0 : costPerWindow / denom / windowSqft;
  const pricePerSqft = roundUpToStep(rawPriceSqft, job.priceRoundUpStep);
  const pricePerWindow = pricePerSqft * windowSqft;
  const totalAll = pricePerWindow * job.qty;
  const profitAll = (pricePerWindow - costPerWindow) * job.qty;
  const marginAtQuoted =
    job.quotedRatePerSqft <= 0 ? 0 : (job.quotedRatePerSqft - costPerSqft) / job.quotedRatePerSqft;
  let quoteStatus = '';
  if (job.quotedRatePerSqft > 0) {
    if (job.quotedRatePerSqft < costPerSqft) quoteStatus = 'Price below cost';
    else if (job.quotedRatePerSqft < pricePerSqft) quoteStatus = 'Below target margin';
    else quoteStatus = 'On target';
  }
  return {
    windowSqft,
    members,
    profileMetres,
    profileCost,
    glassSqft,
    glassRate,
    glassCost,
    wastage,
    hardware,
    meshNet,
    fabInstall,
    transportShare,
    silicone,
    costPerWindow,
    costPerSqft,
    pricePerSqft,
    pricePerWindow,
    totalAll,
    profitAll,
    marginAtQuoted,
    quoteStatus,
  };
}

export function calcDoors(state: AppState) {
  const rows = state.doors.map((d) => {
    const sqft = toSqft(d.widthMm, d.heightMm, 'mm');
    const chargeable = Math.max(sqft, state.allowances.minChargeableSqft) * d.qty;
    const glass = lookupGlass(state.glassTypes, d.glassTypeId);
    return {
      ...d,
      sqft,
      chargeable,
      glassName: glass?.name ?? '—',
      amount: chargeable * d.ratePerSqft,
    };
  });
  return {
    rows,
    total: rows.reduce((s, r) => s + r.amount, 0),
  };
}

export function calcCutting(state: AppState) {
  const allowance = state.allowances.sawAllowanceMm;
  const rows = state.cuts.map((c) => {
    const profile = state.profiles.find((p) => p.id === c.profileId);
    const metres = ((c.cutMm + allowance) * c.pieces) / 1000;
    const rate = profile ? profileRatePerM(profile, state.allowances) : 0;
    return {
      ...c,
      profileName: profile?.name ?? '—',
      stockLengthM: profile?.stockLengthM ?? 0,
      metres,
      rate,
      cost: metres * rate,
    };
  });

  const byProfile = new Map<
    string,
    { name: string; stockLengthM: number; pieces: number; metres: number; rate: number }
  >();
  for (const r of rows) {
    const cur = byProfile.get(r.profileId) ?? {
      name: r.profileName,
      stockLengthM: r.stockLengthM,
      pieces: 0,
      metres: 0,
      rate: r.rate,
    };
    cur.pieces += r.pieces;
    cur.metres += r.metres;
    byProfile.set(r.profileId, cur);
  }

  const buyRows = [...byProfile.entries()].map(([id, v]) => {
    const usable = Math.max(0.01, v.stockLengthM - state.allowances.endTrimMm / 1000);
    const lengthsToBuy = Math.ceil(v.metres / usable);
    const boughtMetres = lengthsToBuy * v.stockLengthM;
    const offcut = Math.max(0, boughtMetres - v.metres);
    return {
      profileId: id,
      ...v,
      lengthsToBuy,
      boughtMetres,
      offcut,
      cost: lengthsToBuy * v.stockLengthM * v.rate,
    };
  });

  return {
    rows,
    buyRows,
    totalMetres: rows.reduce((s, r) => s + r.metres, 0),
    totalCost: buyRows.reduce((s, r) => s + r.cost, 0),
    lengthsToBuy: buyRows.reduce((s, r) => s + r.lengthsToBuy, 0),
    offcutMetres: buyRows.reduce((s, r) => s + r.offcut, 0),
  };
}

export function calcGlassPanes(state: AppState) {
  const step = state.allowances.glassRoundUpInchStep || 1;
  const minPane = state.allowances.glassMinSqftPerPane;
  const wastage = state.allowances.glassWastage;
  const rows = state.glassPanes.map((g) => {
    const glass = lookupGlass(state.glassTypes, g.glassTypeId);
    const wInch = (g.widthMm / 25.4);
    const hInch = (g.heightMm / 25.4);
    const wRound = Math.ceil(wInch / step) * step;
    const hRound = Math.ceil(hInch / step) * step;
    const paneSqft = Math.max((wRound * hRound) / 144, minPane);
    const chargeable = paneSqft * g.panes;
    const rate = glass?.ratePerSqft ?? 0;
    const cost = chargeable * rate * (1 + wastage);
    return {
      ...g,
      glassName: glass?.name ?? '—',
      wRound,
      hRound,
      paneSqft,
      chargeable,
      rate,
      cost,
    };
  });
  return {
    rows,
    totalCost: rows.reduce((s, r) => s + r.cost, 0),
    totalSqft: rows.reduce((s, r) => s + r.chargeable, 0),
  };
}

export function calcHardwareJob(state: AppState) {
  const openings = calcOpenings(state);
  const qtyByType = new Map<string, number>();
  for (const o of state.openings) {
    qtyByType.set(o.windowTypeId, (qtyByType.get(o.windowTypeId) ?? 0) + o.qty);
  }
  const rows = state.hardwareBom.map((line) => {
    const type = lookupWindowType(state.windowTypes, line.windowTypeId);
    const hw = state.hardware.find((h) => h.id === line.hardwareItemId);
    const perWindowCost = line.qtyPerWindow * (hw?.rate ?? 0);
    const windows = qtyByType.get(line.windowTypeId) ?? 0;
    return {
      ...line,
      typeName: type?.name ?? '—',
      itemName: hw?.name ?? '—',
      category: hw?.category ?? '—',
      unit: hw?.unit ?? 'pc',
      rate: hw?.rate ?? 0,
      perWindowCost,
      windows,
      jobCost: perWindowCost * windows,
    };
  });
  return {
    rows,
    total: rows.reduce((s, r) => s + r.jobCost, 0),
    openings,
  };
}

export function calcMeshGrill(state: AppState) {
  const rows = state.meshGrill.map((m) => {
    const sqft = toSqft(m.widthMm, m.heightMm, 'mm') * m.qty;
    return { ...m, sqft, amount: sqft * m.ratePerSqft };
  });
  const mesh = rows.filter((r) => r.kind === 'mesh').reduce((s, r) => s + r.amount, 0);
  const grill = rows.filter((r) => r.kind === 'grill').reduce((s, r) => s + r.amount, 0);
  return { rows, mesh, grill, total: mesh + grill };
}

export function calcLabour(state: AppState) {
  const openings = calcOpenings(state);
  const fab =
    openings.totalActual * state.labour.fabPerSqft +
    openings.totalWindows * state.labour.fabPerWindow;
  const install =
    openings.totalActual * state.labour.installPerSqft +
    openings.totalWindows * state.labour.installPerWindow;
  return { fab, install, total: fab + install, openings };
}

export function calcSiteMeasure(state: AppState) {
  const min = state.allowances.minChargeableSqft;
  const meshSettings = resolveMeshCosting(state.allowances);
  const legacyMeshRate = state.allowances.meshPerSqft;
  const toughExtra = state.allowances.toughenedExtraPerSqft;
  const install = state.allowances.siteInstallPerSqft;
  const rows = state.siteMeasures.map((line) => {
    const t = lookupWindowType(state.windowTypes, line.windowTypeId);
    const lead = state.leads.find((l) => l.id === line.leadId);
    const less = resolveLessOffMm(state, line);
    const net = computeNetSize(line.width, line.height, less.widthMm, less.heightMm);
    // Quote / chargeable from site measured size; fabrication uses net.
    const actualSqftUnit = toSqft(line.width, line.height, line.unit);
    const fabSqftUnit = toSqft(net.netWidth, net.netHeight, line.unit);
    const chargeableEach = Math.max(actualSqftUnit, min);
    const totalSqft = chargeableEach * line.qty;
    const meshDoors = line.meshDoors ?? (line.mesh === 'Yes' ? 1 : 0);
    const meshType = line.meshType ?? (line.mesh === 'Yes' ? 'rolling' : 'none');
    const meshCalc = meshLineAmount(
      {
        width: line.width,
        height: line.height,
        unit: line.unit,
        meshType,
        meshDoors,
        glassDoors: line.glassDoors ?? 0,
        hasVent: line.hasVent ?? 'No',
        ventCount: line.ventCount ?? 0,
      },
      meshSettings,
      line.qty,
      legacyMeshRate,
    );
    // Typed mesh is a line amount (not folded into ₹/sqft) so door qty drives cost correctly.
    const legacyMeshPerSqft =
      meshType === 'none' && line.mesh === 'Yes' ? legacyMeshRate : 0;
    const addOns = install + legacyMeshPerSqft + (line.toughened === 'Yes' ? toughExtra : 0);
    const effectiveRate = line.ratePerSqft + addOns;
    const computedMeshAmount = meshCalc.amount;
    const meshAmount =
      line.meshAmountOverride != null && Number.isFinite(line.meshAmountOverride)
        ? Math.round(line.meshAmountOverride)
        : computedMeshAmount;
    const computedAmount = Math.round(totalSqft * effectiveRate) + meshAmount;
    const amount =
      line.amountOverride != null && Number.isFinite(line.amountOverride)
        ? Math.round(line.amountOverride)
        : computedAmount;
    const disc = applyLineDiscount(amount, line.discountPercent);
    return {
      line,
      typeName: t?.name ?? '—',
      material: t?.material ?? '—',
      leadName: lead?.name ?? '—',
      leadNo: lead?.leadNo ?? '—',
      lessWidthMm: less.widthMm,
      lessHeightMm: less.heightMm,
      netWidth: net.netWidth,
      netHeight: net.netHeight,
      warnNegative: net.warnNegative,
      actualSqftUnit,
      fabSqftUnit,
      chargeableEach,
      totalSqft,
      meshSqft: meshCalc.sqft,
      meshRate: meshCalc.rate,
      computedMeshAmount,
      meshAmount,
      addOns,
      effectiveRate,
      computedAmount,
      amount,
      discountPercent: disc.discountPercent,
      discountAmount: disc.discountAmount,
      selling: disc.selling,
      hasDiscount: disc.hasDiscount,
    };
  });
  return {
    rows,
    totalQty: rows.reduce((s, r) => s + r.line.qty, 0),
    totalSqft: rows.reduce((s, r) => s + r.totalSqft, 0),
    totalMeshAmount: rows.reduce((s, r) => s + r.meshAmount, 0),
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
    totalSelling: rows.reduce((s, r) => s + r.selling, 0),
    totalLineDiscount: rows.reduce((s, r) => s + r.discountAmount, 0),
    warnCount: rows.filter((r) => r.warnNegative).length,
  };
}

export function calcStock(state: AppState) {
  const issuedByStock = new Map<string, number>();
  for (const iss of state.stockIssues) {
    issuedByStock.set(iss.stockLineId, (issuedByStock.get(iss.stockLineId) ?? 0) + iss.metres);
  }
  const rows = state.stock.map((line) => {
    const series = state.series.find((s) => s.id === line.seriesId);
    const issuedM = issuedByStock.get(line.id) ?? 0;
    const remainingM = round(line.openingBalanceM + line.purchasesM - issuedM, 3);
    return {
      ...line,
      seriesName: series?.name ?? '—',
      seriesKind: series?.kind ?? 'other',
      issuedM,
      remainingM,
    };
  });
  const bySeries = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = bySeries.get(r.seriesId) ?? [];
    list.push(r);
    bySeries.set(r.seriesId, list);
  }
  return {
    rows,
    bySeries,
    totalRemaining: rows.reduce((s, r) => s + r.remainingM, 0),
    totalIssued: rows.reduce((s, r) => s + r.issuedM, 0),
  };
}

export function calcQuote(state: AppState) {
  const openings = calcOpenings(state);
  const mesh = calcMeshGrill(state);
  const site = calcSiteMeasure(state);
  const custom = calcCustomQuoteLines(state);
  const windowsSubtotal = openings.totalEstimate;
  const windowsSelling = openings.totalSelling;
  const customSelling = custom.totalSelling;
  const subBeforeDiscount = windowsSelling + mesh.mesh + mesh.grill + customSelling;
  const afterDiscount = Math.max(0, subBeforeDiscount - state.quote.discountAmount);
  const gstInfo = gstOnGrand(afterDiscount, state);
  const gst = gstInfo.gst;
  const grand = gstInfo.grand;
  const advanceFromPercent =
    state.quote.advancePercent > 0 ? Math.round((grand * state.quote.advancePercent) / 100) : 0;
  const advance =
    state.quote.advancePercent > 0 ? advanceFromPercent : state.quote.advanceAmount;
  const balance = Math.max(0, grand - advance);
  let validTill = '';
  if (state.quote.quoteDate && state.quote.validDays > 0) {
    const d = new Date(state.quote.quoteDate);
    d.setDate(d.getDate() + state.quote.validDays);
    validTill = d.toISOString().slice(0, 10);
  }
  return {
    openings,
    mesh,
    site,
    custom,
    windowsSubtotal,
    windowsSelling,
    customSelling,
    measuredValue: site.totalAmount,
    measuredSelling: site.totalSelling,
    subBeforeDiscount,
    afterDiscount,
    gst,
    gstApplied: gstInfo.apply,
    gstPercent: gstInfo.percent,
    grand,
    advance,
    advanceFromPercent,
    balance,
    validTill,
  };
}

export function calcMargin(state: AppState) {
  const quote = calcQuote(state);
  const cutting = calcCutting(state);
  const glass = calcGlassPanes(state);
  const hardware = calcHardwareJob(state);
  const mesh = calcMeshGrill(state);
  const labour = calcLabour(state);
  const transport = state.allowances.transportPerJob;
  const other = state.marginExtras.otherFees;
  const commission = quote.afterDiscount * (state.marginExtras.commissionPercent / 100);
  const totalCost =
    cutting.totalCost +
    glass.totalCost +
    hardware.total +
    mesh.total +
    labour.total +
    transport +
    other +
    commission;
  const quoted = quote.afterDiscount;
  const profit = quoted - totalCost;
  const marginPct = quoted <= 0 ? 0 : profit / quoted;
  const targetMargin = state.allowances.defaultTargetMargin;
  const feePct = state.marginExtras.commissionPercent / 100;
  const targetPrice = totalCost / Math.max(0.01, 1 - targetMargin - feePct);
  return {
    quoteAmount: quoted,
    profileCost: cutting.totalCost,
    glassCost: glass.totalCost,
    hardwareCost: hardware.total,
    meshCost: mesh.total,
    labourCost: labour.total,
    transport,
    other,
    commission,
    totalCost,
    profit,
    marginPct,
    targetPrice,
  };
}

export function calcCompare(state: AppState) {
  const rows = state.compare.map((c) => {
    const sqft = Math.max(toSqft(c.widthMm, c.heightMm, 'mm'), state.allowances.minChargeableSqft) * c.qty;
    const upvc = lookupWindowType(state.windowTypes, c.upvcTypeId);
    const alu = lookupWindowType(state.windowTypes, c.aluTypeId);
    const upvcAmt = sqft * (upvc?.ratePerSqft ?? 0);
    const aluAmt = sqft * (alu?.ratePerSqft ?? 0);
    return {
      ...c,
      sqft,
      upvcName: upvc?.name ?? '—',
      aluName: alu?.name ?? '—',
      upvcRate: upvc?.ratePerSqft ?? 0,
      aluRate: alu?.ratePerSqft ?? 0,
      upvcAmt,
      aluAmt,
      diff: upvcAmt - aluAmt,
    };
  });
  return {
    rows,
    upvcTotal: rows.reduce((s, r) => s + r.upvcAmt, 0),
    aluTotal: rows.reduce((s, r) => s + r.aluAmt, 0),
  };
}

export function calcBuilder(state: AppState) {
  const rows = state.builder.map((b) => {
    const t = lookupWindowType(state.windowTypes, b.windowTypeId);
    const unitSqft = Math.max(toSqft(b.widthMm, b.heightMm, 'mm'), state.allowances.minChargeableSqft);
    const totalQty = b.qtyPerFlat * b.flats;
    const sqft = unitSqft * totalQty;
    const rate = t?.ratePerSqft ?? 0;
    return {
      ...b,
      typeName: t?.name ?? '—',
      totalQty,
      sqft,
      rate,
      amount: sqft * rate,
    };
  });
  return {
    rows,
    totalSqft: rows.reduce((s, r) => s + r.sqft, 0),
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
  };
}

export function calcRevisions(state: AppState) {
  const rows = state.revisions.map((r) => {
    const deltaPct = r.oldRate <= 0 ? 0 : (r.newRate - r.oldRate) / r.oldRate;
    const impact = deltaPct * (r.weightPercent / 100);
    return { ...r, deltaPct, impact };
  });
  const blendedImpact = rows.reduce((s, r) => s + r.impact, 0);
  return { rows, blendedImpact };
}

export { applySeriesToSliding, applySeriesToCasement } from './seriesApply';

export function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function formatNum(n: number, d = 2): string {
  return round(n || 0, d).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });
}
