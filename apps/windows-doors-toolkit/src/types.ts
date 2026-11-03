export type Material = 'UPVC' | 'Aluminium';
export type Unit = 'mm' | 'inch' | 'ft';
export type YesNo = 'Yes' | 'No';
export type SeriesKind = 'sliding' | 'casement' | 'door' | 'other';

/**
 * Mesh product type for costing (Settings rates — never hardcoded in formulas).
 * - rolling / collapsible: typically full window-size area
 * - fixed: outer / vent mesh (casement profiles often carry vents)
 * - door-side: openable door-leaf sized mesh
 */
/**
 * Mesh product type for costing + quote narrative.
 * rolling / collapsible / sliding / swing / fixed / door-side — Settings rates, never hardcoded.
 */
export type MeshTypeId =
  | 'none'
  | 'rolling'
  | 'collapsible'
  | 'fixed'
  | 'door-side'
  | 'sliding'
  | 'swing';

/** Door/casement quote extra — closer OR floor spring, never both. */
export type DoorExtraKind = 'none' | 'door-closer' | 'floor-spring';

/** Editable Settings default for a track count (sliding). */
export interface TrackMeshDefault {
  /** Track count — support 2, 2.5, 3, 4, 6, etc. */
  tracks: number;
  glassDoors: number;
  meshDoors: number;
  meshType: MeshTypeId;
  /** When false (typical 2-track), UI still allows override but seeds mesh off */
  meshAllowed: boolean;
}

/**
 * Door / mesh costing masters (Settings).
 * Sample seeds only — shops overwrite rates; formulas read these.
 */
export interface MeshCostingSettings {
  trackDefaults: TrackMeshDefault[];
  rollingPerSqft: number;
  collapsiblePerSqft: number;
  fixedPerSqft: number;
  doorSidePerSqft: number;
  /** Sliding-mesh shutter ₹/sqft (Settings — sample seed) */
  slidingPerSqft: number;
  /** Swing-mesh / hinged mesh ₹/sqft (Settings — sample seed) */
  swingPerSqft: number;
  /** Editable mesh thickness shown on quote PDF narrative */
  defaultThicknessMm: number;
  /** Editable mesh colour shown on quote PDF narrative */
  defaultColour: string;
  /**
   * Openable default when user selects door-side mesh:
   * mesh doors seed from openable panel count.
   */
  openableDefaultMeshType: MeshTypeId;
  /** Casement/openable vent + fixed mesh defaults */
  ventDefaultMeshType: MeshTypeId;
}

export const DEFAULT_MESH_COSTING: MeshCostingSettings = {
  trackDefaults: [
    { tracks: 2, glassDoors: 2, meshDoors: 0, meshType: 'none', meshAllowed: false },
    { tracks: 2.5, glassDoors: 2, meshDoors: 1, meshType: 'rolling', meshAllowed: true },
    { tracks: 3, glassDoors: 2, meshDoors: 1, meshType: 'rolling', meshAllowed: true },
    { tracks: 4, glassDoors: 4, meshDoors: 1, meshType: 'rolling', meshAllowed: true },
    { tracks: 6, glassDoors: 6, meshDoors: 2, meshType: 'rolling', meshAllowed: true },
  ],
  rollingPerSqft: 90,
  collapsiblePerSqft: 110,
  fixedPerSqft: 75,
  doorSidePerSqft: 95,
  slidingPerSqft: 85,
  swingPerSqft: 100,
  defaultThicknessMm: 0.5,
  defaultColour: 'Black',
  openableDefaultMeshType: 'door-side',
  ventDefaultMeshType: 'fixed',
};

/**
 * Project customer mode — shapes quote UX / discounts presentation.
 * Shop rates always stay Settings-driven (never hardcoded into formulas).
 */
export type CustomerModeId = 'home-owner' | 'architects' | 'builder' | 'vendor';

export interface CustomerModeDef {
  id: CustomerModeId;
  label: string;
  /** Short UX hint — never encodes shop rates */
  description: string;
  /** Architect / Builder / Vendor need name + professional ID + GST before unlock */
  requiresVerification: boolean;
}

export const CUSTOMER_MODES: readonly CustomerModeDef[] = [
  {
    id: 'home-owner',
    label: 'Home owner',
    description: 'Single-screen configurator → quote tabs; retail (homeowner) pricing.',
    requiresVerification: false,
  },
  {
    id: 'architects',
    label: 'Architects',
    description: 'Same configurator; cost shown with Settings-driven architect discount vs retail.',
    requiresVerification: true,
  },
  {
    id: 'builder',
    label: 'Builder',
    description: 'Same quote path; Settings threshold unlocks builder % off vs homeowner.',
    requiresVerification: true,
  },
  {
    id: 'vendor',
    label: 'Vendor',
    description: 'Full software access — all fab tools editable; verification required.',
    requiresVerification: true,
  },
] as const;

/** UI product type chips on the customer configurator (maps to SeriesKind). */
export type ConfiguratorProductType = 'sliding' | 'openable' | 'fix' | 'door';

export const CONFIGURATOR_PRODUCT_TYPES: readonly {
  id: ConfiguratorProductType;
  label: string;
  kind: SeriesKind;
}[] = [
  { id: 'sliding', label: 'Sliding', kind: 'sliding' },
  { id: 'openable', label: 'Openable', kind: 'casement' },
  { id: 'fix', label: 'Fix', kind: 'other' },
  { id: 'door', label: 'Door', kind: 'door' },
] as const;

/** Colour / finish master — Settings-editable surcharge (₹/sqft). */
export interface ColourOption {
  id: string;
  name: string;
  material: Material | 'Both';
  /** Extra ₹/sqft on top of window-type rate (Settings — sample seed only) */
  rateAdjPerSqft: number;
  note: string;
}

/**
 * Mode pricing rules (Settings). Example seed: margin 20% × factor 0.5 → architects see 10% below retail.
 * Builder: when homeowner quote total ≥ threshold, apply builderDiscountPercent off retail.
 */
export interface ModePricingSettings {
  /** Retail margin % used only for the architect half-of-margin rule (e.g. 20) */
  architectRetailMarginPercent: number;
  /** Fraction of that margin given as discount (e.g. 0.5 → half of 20% = 10% off retail) */
  architectDiscountFactor: number;
  /** Builder quote total (homeowner/retail ₹) that unlocks builder discount */
  builderThresholdInr: number;
  /** % off vs homeowner/retail when threshold is crossed */
  builderDiscountPercent: number;
}

export const DEFAULT_MODE_PRICING: ModePricingSettings = {
  architectRetailMarginPercent: 20,
  architectDiscountFactor: 0.5,
  builderThresholdInr: 5_000_000,
  builderDiscountPercent: 15,
};

/**
 * Private vendor rate overrides layered on top of the shared master catalogue.
 * Shared Settings masters stay untouched; Vendor mode applies these on read.
 */
export interface VendorRateOverrides {
  /** windowTypeId → ratePerSqft */
  windowTypeRates: Record<string, number>;
  /** glassTypeId → ratePerSqft */
  glassRates: Record<string, number>;
  /** colourId → rateAdjPerSqft */
  colourAdjRates: Record<string, number>;
  /** hardwareId → rate */
  hardwareRates: Record<string, number>;
  /** profileSkuId → ratePerMUpvc */
  profileRatePerMUpvc: Record<string, number>;
  /** `${seriesId}::${memberId}` → ratePerM */
  seriesMemberRates: Record<string, number>;
}

export const EMPTY_VENDOR_OVERRIDES: VendorRateOverrides = {
  windowTypeRates: {},
  glassRates: {},
  colourAdjRates: {},
  hardwareRates: {},
  profileRatePerMUpvc: {},
  seriesMemberRates: {},
};

/** Shareable market/standard rates snapshot (shared master layer). */
export interface SharedMasterSnapshot {
  exportedAt: string;
  label: string;
  windowTypes: WindowType[];
  series: SeriesDefinition[];
  glassTypes: GlassType[];
  colourOptions: ColourOption[];
  hardware: HardwareItem[];
  profiles: ProfileSku[];
  hardwareBom: HardwareBomLine[];
}

/** Professional verification — unlocks Architect / Builder / Vendor modes. */
export interface ModeVerification {
  modeId: Exclude<CustomerModeId, 'home-owner'>;
  name: string;
  /** Professional / business email — login key for restore (personal email allowed). */
  email: string;
  /** Deterministic customer ID derived from email (shared account database). */
  customerId: string;
  mobile: string;
  /** Area / locality */
  area: string;
  city: string;
  gstNo: string;
  verifiedAt: string;
}

/** Payload submitted from the mode verification gate. */
export interface ModeVerificationInput {
  name: string;
  email: string;
  mobile: string;
  area: string;
  city: string;
  gstNo: string;
  /** When true, restore projects/quotes previously saved under this email. */
  restoreSaved?: boolean;
}

/** One line on the customer-facing quote cart (per project). */
export interface ConfiguratorLine {
  id: string;
  location: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  productType: ConfiguratorProductType;
  material: Material;
  windowTypeId: string;
  glassTypeId: string;
  colourId: string;
  tracks?: number;
  glassDoors?: number;
  meshDoors?: number;
  meshType?: MeshTypeId;
  hasVent?: YesNo;
  ventCount?: number;
  /** Optional override of series lock/handle quote label */
  lockHandleLabel?: string;
  /** Door/casement — closer OR floor spring */
  doorExtraKind?: DoorExtraKind;
  /** Per-line customer / site note */
  notes?: string;
  /** Optional % discount on this cart line. Empty / 0 = no discount line. */
  discountPercent?: number | null;
}

/** Custom quote products outside window tools (doors, pergolas, furniture, louvers…). */
export type CustomQuoteUnit = 'pc' | 'rft' | 'sft' | 'kg';

export interface CustomQuoteLine {
  id: string;
  name: string;
  sizeLabel: string;
  /** Numeric measure for rft/sft/kg (pc → 1). Amount = rate × qty × measure. */
  measure: number;
  rate: number;
  unit: CustomQuoteUnit;
  qty: number;
  discountPercent?: number | null;
  notes?: string;
}

/** Size-driven catalogue line (mm). Rates edited in Settings — never hardcoded in formulas. */
export interface SizedRate {
  sizeMm: number;
  rate: number;
  label?: string;
}

/** Hardware catalogue class — sliding never mixes with casement/door. */
export type HardwareClass = 'sliding' | 'casement' | 'door' | 'shared';

export type SlidingMemberClass =
  | '2-track'
  | '2.5-track'
  | '3-track'
  | 'Shutter'
  | 'Meeting'
  | 'Mesh'
  | 'UPVC only'
  | 'UPVC shutter'
  | 'Window';

/** Settings UX role for a series profile member (calc still keys off memberClass). */
export type MemberRole = 'track' | 'shutter' | 'mesh' | 'other';

/**
 * Shutter part variants — interlock maps to Meeting count rules.
 * `center` = meeting/center vertical of a glass shutter (not the slim interlock bar).
 */
export type ShutterPart = 'sash' | 'top' | 'bottom' | 'handle-side' | 'center' | 'interlock';

/** Interlock cut/hardware style for Meeting members (Settings-driven). */
export type InterlockStyle = 'slim' | 'cap' | 'same-section';

export type CasementMemberClass =
  | 'Window'
  | 'Mullion'
  | 'Openable panel'
  | 'Panel'
  | 'Mesh panel'
  | 'UPVC only'
  | 'UPVC mullion'
  | 'UPVC openable';

export interface BusinessInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  /** Logo image URL or data: URL from Settings upload */
  logoUrl: string;
  gstin: string;
  gstEnabled: boolean;
  gstPercent: number;
  warrantyNote: string;
}

export interface Allowances {
  minChargeableSqft: number;
  unit: Unit;
  sawAllowanceMm: number;
  endTrimMm: number;
  aluminiumRatePerKg: number;
  coatingPerKg: number;
  glassRoundUpInchStep: number;
  glassMinSqftPerPane: number;
  glassWastage: number;
  defaultProfileWastage: number;
  defaultTargetMargin: number;
  priceRoundUpStep: number;
  fabricationLabourPerSqft: number;
  installationLabourPerSqft: number;
  transportPerJob: number;
  siliconePerWindow: number;
  /** Site-measure add-ons (Settings — sample seeds only) */
  meshPerSqft: number;
  toughenedExtraPerSqft: number;
  siteInstallPerSqft: number;
  /** Door/mesh costing masters (tracks → glass/mesh qty + typed ₹/sqft) */
  meshCosting: MeshCostingSettings;
  /**
   * Default less-off (site → fabrication) for UPVC jobs.
   * Overridable per project / per row. Aluminium uses lessOffAlu* when project material is Aluminium.
   */
  lessOffWidthMm: number;
  lessOffHeightMm: number;
  /** Aluminium less-off defaults (Excel kits share cut allowance; shops often use a tighter Alu gap). */
  lessOffAluWidthMm: number;
  lessOffAluHeightMm: number;
}

export interface WindowType {
  id: string;
  name: string;
  material: Material;
  /** Class isolation: sliding / casement / door / other */
  kind: SeriesKind;
  ratePerSqft: number;
  note: string;
  seriesId?: string;
}

export interface ProfileMember {
  id: string;
  name: string;
  /**
   * Calc discriminator: track class (2 / 2.5 / 3), Shutter, Meeting, Mesh, …
   * One series may list multiple track classes; quote/BOM pick the matching row.
   */
  memberClass: string;
  /** Optional Settings label for shutter top/bottom/handle-side/center/interlock/sash. */
  shutterPart?: ShutterPart;
  /**
   * Width / V factor (horizontal pieces × width). Editable qty master.
   * Used when side factors (top/bottom) are unset.
   */
  wFactor: number;
  /**
   * Height / H factor (vertical pieces × height). Editable qty master.
   * Used when side factors (left/right) are unset.
   */
  hFactor: number;
  ratePerM: number;
  /**
   * Optional per-side qty factors (fabricator detail).
   * When any side factor is set, BOM/metres prefer sides over coarse V/H for that axis.
   */
  topFactor?: number | null;
  bottomFactor?: number | null;
  leftFactor?: number | null;
  rightFactor?: number | null;
  /** Default linked Profiles-stock SKU for this member. */
  profileSkuId?: string;
  /** Horizontal section SKU (top + bottom group). */
  horizontalProfileSkuId?: string;
  /** Vertical section SKU (left + right group). */
  verticalProfileSkuId?: string;
  /** Optional per-side SKU overrides (win when set). */
  topProfileSkuId?: string;
  bottomProfileSkuId?: string;
  leftProfileSkuId?: string;
  rightProfileSkuId?: string;
  /** Meeting / interlock style — slim bar vs caps on verticals vs same-section all sides. */
  interlockStyle?: InterlockStyle;
  /**
   * Bottom track rails only (full window width).
   * null/undefined = derive from track class (2-track→2, 2.5/3-track→3).
   */
  railCount?: number | null;
  /** Mesh shutter uses same section + adapter on all sides (2V + 2H adapters). */
  meshAdapter?: boolean;
}

export interface SeriesDefinition {
  id: string;
  name: string;
  material: Material;
  kind: SeriesKind;
  /** Sliding layout defaults (hidden when kind ≠ sliding) */
  defaultTracks: number;
  defaultShutters: number;
  /** Casement / door panel defaults (hidden when kind = sliding) */
  defaultPanels: number;
  defaultOpenable: number;
  glassInsetMm: number;
  /** Sliding hardware (hidden for casement / door-openable) */
  rollersPerShutter: number;
  rollerRate: number;
  lockHandleSet: number;
  /**
   * Quote narrative lock / handle type (e.g. Metro Type Matt black lock).
   * Editable master — never hardcode into PDF formatter.
   */
  lockHandleLabel: string;
  otherHardware: number;
  /**
   * Legacy / resolved friction-stay set ₹ for selected size.
   * Prefer frictionStayRates[size] — kept for older jobs & applySeries.
   */
  frictionStayRate: number;
  handleRate: number;
  /** Casement / openable / door-style hardware masters (Settings-editable) */
  frictionStaySizeMm: number;
  /** Catalogue: size mm → ₹ per set (2 pc). Sample seeds only. */
  frictionStayRates: SizedRate[];
  /** Sets per openable/door — default 1 set = 2 pc */
  frictionStaySetsPerOpenable: number;
  hingeQtyPerOpenable: number;
  hingeRate: number;
  /** Door connector pcs per door — default 4 */
  doorConnectorQtyPerDoor: number;
  doorConnectorRate: number;
  laminationArmSizeMm: number;
  laminationArmRates: SizedRate[];
  lockGuideRate: number;
  brushRate: number;
  epdmRate: number;
  lockRate: number;
  doorCloserRate: number;
  /** Swing door hardware — separate from sliding rollers */
  floorSpringRate: number;
  /**
   * Door/casement quote extra — door closer OR floor spring (exclusive).
   * Rates for the non-selected kind are cleared when switching in Settings.
   */
  doorExtraKind: DoorExtraKind;
  doorCloserBrand: string;
  doorCloserColour: string;
  doorCloserWeightKg: number;
  floorSpringBrand: string;
  floorSpringColour: string;
  floorSpringWeightKg: number;
  doorSetRate: number;
  swingHandleRate: number;
  swingLockRate: number;
  meshAreaShare: number;
  meshNetPerSqft: number;
  members: ProfileMember[];
  note: string;
}

export interface GlassType {
  id: string;
  name: string;
  thicknessMm: number;
  ratePerSqft: number;
  useNote: string;
  /** Brand for quote narrative — e.g. Saint-Gobain (Settings-editable) */
  brand: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  rate: number;
  /** Class isolation — sliding catalogue never offered for casement series */
  hardwareClass: HardwareClass;
  /** Brand for quote narrative (lock/handle, closer, floor spring) */
  brand: string;
  /** Finish / colour for quote narrative */
  colour: string;
  /** Weight capacity kg — door closer / floor spring */
  weightCapacityKg: number;
}

export interface ProfileSku {
  id: string;
  name: string;
  material: Material;
  kind: SeriesKind;
  stockLengthM: number;
  ratePerMUpvc: number;
  kgPerMAluminium: number;
}

export interface HardwareBomLine {
  id: string;
  windowTypeId: string;
  hardwareItemId: string;
  qtyPerWindow: number;
}

export interface OpeningLine {
  id: string;
  location: string;
  windowTypeId: string;
  width: number;
  height: number;
  qty: number;
  /** Sliding track count (0 = N/A / openable) — drives glass/mesh defaults */
  tracks?: number;
  /** Glass doors / shutters (sliding) or glass panels (openable) */
  glassDoors?: number;
  /** Mesh door / shutter count required for costing */
  meshDoors?: number;
  meshType?: MeshTypeId;
  hasVent?: YesNo;
  ventCount?: number;
  glassTypeId?: string;
  colourId?: string;
  lockHandleLabel?: string;
  doorExtraKind?: DoorExtraKind;
  /** Per-opening customer / site note */
  notes?: string;
  discountPercent?: number | null;
}

export interface SlidingJob {
  seriesId: string;
  material: Material;
  tracks: number;
  glassShutters: number;
  /** Legacy Yes/No — kept in sync with meshDoors / meshType */
  mesh: YesNo;
  /** How many mesh doors/shutters (0 = none) */
  meshDoors: number;
  meshType: MeshTypeId;
  widthMm: number;
  heightMm: number;
  qty: number;
  glassTypeId: string;
  glassInsetMm: number;
  rollersPerShutter: number;
  rollerRate: number;
  lockHandleSet: number;
  otherHardware: number;
  meshAreaShare: number;
  meshNetPerSqft: number;
  fabricationLabourPerSqft: number;
  installationLabourPerSqft: number;
  siliconePerWindow: number;
  transportPerJob: number;
  wastage: number;
  targetMargin: number;
  priceRoundUpStep: number;
  quotedRatePerSqft: number;
}

export interface CasementJob {
  seriesId: string;
  material: Material;
  panels: number;
  openablePanels: number;
  /** Treat as door leaf count for connector / swing qty (0 = use openablePanels when series is door) */
  doorLeaves: number;
  /** Legacy Yes/No — kept in sync with meshDoors / meshType */
  mesh: YesNo;
  meshDoors: number;
  meshType: MeshTypeId;
  /** Vent + fixed outer mesh (casement profiles) */
  hasVent: YesNo;
  ventCount: number;
  widthMm: number;
  heightMm: number;
  qty: number;
  glassTypeId: string;
  glassInsetMm: number;
  frictionStaySizeMm: number;
  /** ₹ per set (2 pc) for selected size — linked from series catalogue */
  frictionStayRate: number;
  frictionStaySetsPerOpenable: number;
  hingeQty: number;
  hingeRate: number;
  doorConnectorQty: number;
  doorConnectorRate: number;
  laminationArmSizeMm: number;
  laminationArmRate: number;
  lockGuideRate: number;
  brushRate: number;
  epdmRate: number;
  lockRate: number;
  doorCloserRate: number;
  floorSpringRate: number;
  doorSetRate: number;
  swingHandleRate: number;
  swingLockRate: number;
  handleRate: number;
  otherHardware: number;
  meshAreaShare: number;
  meshNetPerSqft: number;
  fabricationLabourPerSqft: number;
  installationLabourPerSqft: number;
  siliconePerWindow: number;
  transportPerJob: number;
  wastage: number;
  targetMargin: number;
  priceRoundUpStep: number;
  quotedRatePerSqft: number;
}

export interface DoorLine {
  id: string;
  location: string;
  doorType: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  glassTypeId: string;
  ratePerSqft: number;
}

export interface CutLine {
  id: string;
  windowLabel: string;
  profileId: string;
  cutMm: number;
  pieces: number;
  /** Optional link to series stock row for deduction */
  seriesId?: string;
  stockLineId?: string;
  siteMeasureId?: string;
}

export interface GlassPaneLine {
  id: string;
  windowLabel: string;
  glassTypeId: string;
  widthMm: number;
  heightMm: number;
  panes: number;
}

export interface MeshGrillLine {
  id: string;
  kind: 'mesh' | 'grill';
  location: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  ratePerSqft: number;
}

export interface LabourSettings {
  fabPerSqft: number;
  installPerSqft: number;
  fabPerWindow: number;
  installPerWindow: number;
}

export interface QuoteExtras {
  discountAmount: number;
  advanceAmount: number;
  /** When > 0, advance ₹ = grand × percent / 100 (yellow override still allowed) */
  advancePercent: number;
  validDays: number;
  notes: string;
  customerName: string;
  siteAddress: string;
  quoteNo: string;
  quoteDate: string;
  phone: string;
  /** Quote-level GST toggle. undefined = follow Settings gstEnabled. Off = no GST. */
  applyGst?: boolean;
  description?: string;
  terms?: string;
  bankDetails?: string;
}

export type LeadStatus = 'New' | 'Site visit' | 'Measured' | 'Quoted' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  leadNo: string;
  date: string;
  name: string;
  phone: string;
  area: string;
  addressNote: string;
  siteType: string;
  source: string;
  need: string;
  windowTypeHint: string;
  openingsCount: number;
  status: LeadStatus;
  followUpDate: string;
  owner: string;
  notes: string;
}

export interface SiteMeasureLine {
  id: string;
  measuredOn: string;
  leadId: string;
  location: string;
  windowTypeId: string;
  /** Site measured size (actual site reading) */
  width: number;
  height: number;
  unit: Unit;
  qty: number;
  /** Selling ₹/sqft — seeded from window-type master, editable per line */
  ratePerSqft: number;
  /**
   * Optional Mesh ₹ lock. null = use calculated mesh add-on from Settings rates.
   * Cleared when size / mesh doors / type change so defaults refill.
   */
  meshAmountOverride?: number | null;
  /**
   * Optional package Amount lock. null = sqft×rate + mesh.
   * Cleared when rate / size / mesh inputs change so defaults refill.
   */
  amountOverride?: number | null;
  /** Legacy Yes/No — synced from meshDoors / meshType for older quote add-on path */
  mesh: YesNo;
  /** Sliding tracks (0 when openable / fix / door without tracks) */
  tracks: number;
  /** Glass doors / shutters — required for sliding costing */
  glassDoors: number;
  /** Mesh door count — required when mesh is used */
  meshDoors: number;
  meshType: MeshTypeId;
  hasVent: YesNo;
  ventCount: number;
  toughened: YesNo;
  /** Optional glass / colour for quote narrative (Settings masters) */
  glassTypeId?: string;
  colourId?: string;
  lockHandleLabel?: string;
  doorExtraKind?: DoorExtraKind;
  measuredBy: string;
  /**
   * Per-row less-off override (mm). null/undefined = use project default, else Settings.
   */
  lessOffWidthMm?: number | null;
  lessOffHeightMm?: number | null;
  /** Persisted fabrication / net size = site − less (clamped ≥ 0) */
  netWidth: number;
  netHeight: number;
  /** Per-opening customer / site note */
  notes?: string;
  discountPercent?: number | null;
}

export interface CompareLine {
  id: string;
  location: string;
  widthMm: number;
  heightMm: number;
  qty: number;
  upvcTypeId: string;
  aluTypeId: string;
}

export interface BuilderLine {
  id: string;
  block: string;
  windowTypeId: string;
  widthMm: number;
  heightMm: number;
  qtyPerFlat: number;
  flats: number;
}

export interface PriceRevision {
  id: string;
  item: string;
  oldRate: number;
  newRate: number;
  weightPercent: number;
}

export interface JobMeta {
  customerName: string;
  siteAddress: string;
  jobLabel: string;
}

/** Project shell — material locks the job; less-off overrides Settings when set (null = inherit). */
export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  /** Once set, all tools / selectors for this project stay on this material. */
  material: Material;
  /** Customer mode — UX / quote presentation only; rates stay Settings-driven. */
  customerMode: CustomerModeId;
  lessOffWidthMm: number | null;
  lessOffHeightMm: number | null;
}

/** Billing & Profit kit — shop-level (global), rates still from Settings window types. */
export interface BillingInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  phone: string;
  jobType: string;
  /** Amount before GST */
  amount: number;
  gst: number;
  /** amount + gst */
  total: number;
  paid: number;
  note: string;
  dueDate: string;
  /** Optional link to project / quote */
  projectId?: string;
  quoteNo?: string;
}

export interface BillingPayment {
  id: string;
  date: string;
  invoiceNo: string;
  amount: number;
  mode: string;
  note: string;
  customer: string;
  jobType: string;
}

export interface BillingExpense {
  id: string;
  date: string;
  head: string;
  amount: number;
  mode: string;
  note: string;
}

export interface BillingSettings {
  /** Payment due in days from invoice date */
  paymentDueDays: number;
  expenseHeads: string[];
  payModes: string[];
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  paymentDueDays: 15,
  expenseHeads: [
    'Profiles',
    'Glass',
    'Hardware',
    'Reinforcement steel',
    'Gasket and sealant',
    'Transport',
    'Rent',
    'Electricity',
    'Machine upkeep',
    'Marketing',
    'Fabricator pay',
    'Fitter pay',
    'Helper pay',
    'Other',
  ],
  payModes: ['Cash', 'UPI', 'Bank', 'Cheque'],
};

/** Per-project job data (never mixed across projects). */
export interface ProjectJobData {
  jobMeta: JobMeta;
  openings: OpeningLine[];
  leads: Lead[];
  siteMeasures: SiteMeasureLine[];
  sliding: SlidingJob;
  casement: CasementJob;
  doors: DoorLine[];
  cuts: CutLine[];
  glassPanes: GlassPaneLine[];
  meshGrill: MeshGrillLine[];
  labour: LabourSettings;
  quote: QuoteExtras;
  compare: CompareLine[];
  builder: BuilderLine[];
  revisions: PriceRevision[];
  marginExtras: {
    commissionPercent: number;
    otherFees: number;
  };
  /** Customer-facing configurator cart (Home owner / Architect / Builder quote path) */
  configuratorLines: ConfiguratorLine[];
  customQuoteLines: CustomQuoteLine[];
}

/** Series-wise section inventory (global shop stock). */
export interface StockLine {
  id: string;
  seriesId: string;
  /** Editable section / profile name within the series */
  sectionName: string;
  openingBalanceM: number;
  purchasesM: number;
  note: string;
}

export interface StockIssue {
  id: string;
  stockLineId: string;
  projectId: string;
  metres: number;
  date: string;
  note: string;
  source: 'manual' | 'cutting';
  cutLineId?: string;
}

export const PROJECT_JOB_KEYS = [
  'jobMeta',
  'openings',
  'leads',
  'siteMeasures',
  'sliding',
  'casement',
  'doors',
  'cuts',
  'glassPanes',
  'meshGrill',
  'labour',
  'quote',
  'compare',
  'builder',
  'revisions',
  'marginExtras',
  'configuratorLines',
  'customQuoteLines',
] as const;

export type ProjectJobKey = (typeof PROJECT_JOB_KEYS)[number];

export interface AppState extends ProjectJobData {
  business: BusinessInfo;
  allowances: Allowances;
  windowTypes: WindowType[];
  series: SeriesDefinition[];
  glassTypes: GlassType[];
  colourOptions: ColourOption[];
  hardware: HardwareItem[];
  profiles: ProfileSku[];
  hardwareBom: HardwareBomLine[];
  /** Mode pricing rules — Settings-driven, never hardcode into UI */
  modePricing: ModePricingSettings;
  /** Verified professionals per gated mode */
  modeVerifications: ModeVerification[];
  /**
   * Vendor-private rate overrides on top of shared masters (window/glass/colour/hardware/profile/series).
   * Shared catalogue in Settings remains the base; overrides never rewrite it.
   */
  vendorOverrides: VendorRateOverrides;
  /** Global series-wise stock */
  stock: StockLine[];
  stockIssues: StockIssue[];
  /** Billing & Profit (shop-level — mirrors Billing-Profit Kit) */
  billingInvoices: BillingInvoice[];
  billingPayments: BillingPayment[];
  billingExpenses: BillingExpense[];
  billingSettings: BillingSettings;
  projects: ProjectMeta[];
  activeProjectId: string;
  /** Inactive project bags (active project's data lives on the flat keys above) */
  projectBags: Record<string, ProjectJobData>;
}
