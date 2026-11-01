export type Material = 'UPVC' | 'Aluminium';
export type Unit = 'mm' | 'inch' | 'ft';
export type YesNo = 'Yes' | 'No';

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
}

export interface WindowType {
  id: string;
  name: string;
  material: Material;
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
  kind: 'sliding' | 'casement' | 'door' | 'other';
  defaultTracks: number;
  defaultShutters: number;
  defaultPanels: number;
  defaultOpenable: number;
  glassInsetMm: number;
  rollersPerShutter: number;
  rollerRate: number;
  lockHandleSet: number;
  otherHardware: number;
  frictionStayRate: number;
  handleRate: number;
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
}

export interface ProfileSku {
  id: string;
  name: string;
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
  mesh: YesNo;
  widthMm: number;
  heightMm: number;
  qty: number;
  glassTypeId: string;
  glassInsetMm: number;
  frictionStayRate: number;
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
  notes: string;
  customerName: string;
  siteAddress: string;
  quoteNo: string;
  quoteDate: string;
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

export interface AppState {
  business: BusinessInfo;
  allowances: Allowances;
  windowTypes: WindowType[];
  series: SeriesDefinition[];
  glassTypes: GlassType[];
  hardware: HardwareItem[];
  profiles: ProfileSku[];
  hardwareBom: HardwareBomLine[];
  jobMeta: JobMeta;
  openings: OpeningLine[];
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
