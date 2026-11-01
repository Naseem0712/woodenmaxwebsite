export type Material = 'UPVC' | 'Aluminium';
export type Unit = 'mm' | 'inch' | 'ft';
export type YesNo = 'Yes' | 'No';
export type SeriesKind = 'sliding' | 'casement' | 'door' | 'other';

/** Project customer mode — shapes UX / labels / quote presentation; rates stay in Settings. */
export type CustomerModeId = 'home-owner' | 'architects';

export interface CustomerModeDef {
  id: CustomerModeId;
  label: string;
  /** Short UX hint — never encodes shop rates */
  description: string;
}

export const CUSTOMER_MODES: readonly CustomerModeDef[] = [
  {
    id: 'home-owner',
    label: 'Home owner',
    description: 'Plain-language quote labels; simpler schedule wording.',
  },
  {
    id: 'architects',
    label: 'Architects',
    description: 'Technical labels (fab sizes, series/kind) on quote and tools.',
  },
] as const;

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
  | '3-track'
  | 'Shutter'
  | 'Meeting'
  | 'Mesh'
  | 'UPVC only'
  | 'UPVC shutter'
  | 'Window';

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
  memberClass: string;
  wFactor: number;
  hFactor: number;
  ratePerM: number;
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
}

export interface HardwareItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  rate: number;
  /** Class isolation — sliding catalogue never offered for casement series */
  hardwareClass: HardwareClass;
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
}

export interface SlidingJob {
  seriesId: string;
  material: Material;
  tracks: number;
  glassShutters: number;
  mesh: YesNo;
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
  mesh: YesNo;
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
  mesh: YesNo;
  toughened: YesNo;
  measuredBy: string;
  /**
   * Per-row less-off override (mm). null/undefined = use project default, else Settings.
   */
  lessOffWidthMm?: number | null;
  lessOffHeightMm?: number | null;
  /** Persisted fabrication / net size = site − less (clamped ≥ 0) */
  netWidth: number;
  netHeight: number;
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
] as const;

export type ProjectJobKey = (typeof PROJECT_JOB_KEYS)[number];

export interface AppState extends ProjectJobData {
  business: BusinessInfo;
  allowances: Allowances;
  windowTypes: WindowType[];
  series: SeriesDefinition[];
  glassTypes: GlassType[];
  hardware: HardwareItem[];
  profiles: ProfileSku[];
  hardwareBom: HardwareBomLine[];
  /** Global series-wise stock */
  stock: StockLine[];
  stockIssues: StockIssue[];
  projects: ProjectMeta[];
  activeProjectId: string;
  /** Inactive project bags (active project's data lives on the flat keys above) */
  projectBags: Record<string, ProjectJobData>;
}
