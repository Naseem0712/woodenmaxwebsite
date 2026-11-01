import type {
  AppState,
  ColourOption,
  ConfiguratorLine,
  CustomerModeId,
  ModePricingSettings,
  ModeVerification,
} from '../types';
import { CUSTOMER_MODES, DEFAULT_MODE_PRICING } from '../types';
import { lookupGlass, lookupWindowType, round, toSqft } from './calcs';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import { meshLineAmount, resolveMeshCosting } from './meshCosting';

export function modeRequiresVerification(mode: CustomerModeId): boolean {
  return CUSTOMER_MODES.find((m) => m.id === mode)?.requiresVerification ?? false;
}

export function isModeVerified(state: AppState, mode: CustomerModeId): boolean {
  if (!modeRequiresVerification(mode)) return true;
  return state.modeVerifications.some((v) => v.modeId === mode && v.name.trim() && v.professionalId.trim() && v.gstNo.trim());
}

export function resolveModePricing(state: AppState): ModePricingSettings {
  return { ...DEFAULT_MODE_PRICING, ...state.modePricing };
}

/** Architect discount % off retail = margin% × factor (seed 20 × 0.5 = 10). */
export function architectDiscountPercent(pricing: ModePricingSettings): number {
  return Math.max(0, pricing.architectRetailMarginPercent * pricing.architectDiscountFactor);
}

export function lookupColour(colours: ColourOption[], id: string): ColourOption | undefined {
  return colours.find((c) => c.id === id);
}

export interface ConfiguratorLineCalc {
  line: ConfiguratorLine;
  typeName: string;
  glassName: string;
  colourName: string;
  actualSqftUnit: number;
  actualSqft: number;
  chargeableSqft: number;
  /** Homeowner / retail ₹ per sqft (window type + colour adj from shared master / vendor override) */
  retailRatePerSqft: number;
  retailAmount: number;
  glassRatePerSqft: number;
  glassAmount: number;
  meshAmount: number;
  meshRatePerSqft: number;
  meshSqft: number;
}

export function calcConfiguratorLine(state: AppState, line: ConfiguratorLine): ConfiguratorLineCalc {
  const unit = state.allowances.unit;
  const min = state.allowances.minChargeableSqft;
  const cat = resolveEffectiveCatalogue(state);
  const t = lookupWindowType(cat.windowTypes, line.windowTypeId);
  const g = lookupGlass(cat.glassTypes, line.glassTypeId);
  const c = lookupColour(cat.colourOptions, line.colourId);
  const actualSqftUnit = toSqft(line.widthMm, line.heightMm, unit);
  const actualSqft = actualSqftUnit * line.qty;
  const chargeableSqft = Math.max(actualSqftUnit, min) * line.qty;
  const retailRatePerSqft = (t?.ratePerSqft ?? 0) + (c?.rateAdjPerSqft ?? 0);
  const retailAmount = chargeableSqft * retailRatePerSqft;
  const glassRatePerSqft = g?.ratePerSqft ?? 0;
  const glassAmount = chargeableSqft * glassRatePerSqft;
  const meshSettings = resolveMeshCosting(state.allowances);
  const meshDoors = line.meshDoors ?? 0;
  const meshType = line.meshType ?? 'none';
  const meshCalc = meshLineAmount(
    {
      width: line.widthMm,
      height: line.heightMm,
      unit,
      meshType,
      meshDoors,
      glassDoors: line.glassDoors ?? 0,
      hasVent: line.hasVent ?? 'No',
      ventCount: line.ventCount ?? 0,
    },
    meshSettings,
    line.qty,
    state.allowances.meshPerSqft,
  );
  return {
    line,
    typeName: t?.name ?? '—',
    glassName: g?.name ?? '—',
    colourName: c?.name ?? '—',
    actualSqftUnit,
    actualSqft,
    chargeableSqft,
    retailRatePerSqft,
    retailAmount,
    glassRatePerSqft,
    glassAmount,
    meshAmount: meshCalc.amount,
    meshRatePerSqft: meshCalc.rate,
    meshSqft: meshCalc.sqft,
  };
}

export function calcConfiguratorCart(state: AppState) {
  const rows = (state.configuratorLines ?? []).map((line) => calcConfiguratorLine(state, line));
  const retailWindows = rows.reduce((s, r) => s + r.retailAmount, 0);
  const glassTotal = rows.reduce((s, r) => s + r.glassAmount, 0);
  const meshTotal = rows.reduce((s, r) => s + r.meshAmount, 0);
  const retailSubtotal = retailWindows + glassTotal + meshTotal;
  return {
    rows,
    retailWindows,
    glassTotal,
    meshTotal,
    retailSubtotal,
    totalChargeable: rows.reduce((s, r) => s + r.chargeableSqft, 0),
    totalActual: rows.reduce((s, r) => s + r.actualSqft, 0),
    totalQty: rows.reduce((s, r) => s + r.line.qty, 0),
  };
}

export interface ModeQuoteResult {
  mode: CustomerModeId;
  retailSubtotal: number;
  /** Discount % applied to retail for this mode (0 for homeowner / vendor retail view) */
  discountPercent: number;
  discountAmount: number;
  afterModeDiscount: number;
  gst: number;
  grand: number;
  architectDiscountPct: number;
  builderThresholdMet: boolean;
  builderDiscountPct: number;
  pricingNote: string;
}

export function calcModeQuote(state: AppState, mode?: CustomerModeId): ModeQuoteResult {
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const customerMode = mode ?? project?.customerMode ?? 'home-owner';
  const pricing = resolveModePricing(state);
  const cart = calcConfiguratorCart(state);
  const retailSubtotal = cart.retailSubtotal;
  const archPct = architectDiscountPercent(pricing);
  const builderMet = retailSubtotal >= pricing.builderThresholdInr;

  let discountPercent = 0;
  let pricingNote = 'Homeowner retail (Settings window-type + colour + glass rates).';

  if (customerMode === 'architects') {
    discountPercent = archPct;
    pricingNote = `Architect: ${round(archPct, 2)}% below retail (${pricing.architectRetailMarginPercent}% × factor ${pricing.architectDiscountFactor}).`;
  } else if (customerMode === 'builder') {
    if (builderMet) {
      discountPercent = pricing.builderDiscountPercent;
      pricingNote = `Builder: quote ≥ ₹${pricing.builderThresholdInr.toLocaleString('en-IN')} → ${pricing.builderDiscountPercent}% off vs homeowner.`;
    } else {
      discountPercent = 0;
      pricingNote = `Builder: retail until total reaches ₹${pricing.builderThresholdInr.toLocaleString('en-IN')} (then ${pricing.builderDiscountPercent}% off).`;
    }
  } else if (customerMode === 'vendor') {
    discountPercent = 0;
    pricingNote = 'Vendor: full tools access; showing retail schedule (edit freely).';
  }

  const discountAmount = retailSubtotal * (discountPercent / 100);
  const afterModeDiscount = Math.max(0, retailSubtotal - discountAmount);
  const gst = state.business.gstEnabled
    ? afterModeDiscount * (state.business.gstPercent / 100)
    : 0;
  const grand = afterModeDiscount + gst;

  return {
    mode: customerMode,
    retailSubtotal,
    discountPercent,
    discountAmount,
    afterModeDiscount,
    gst,
    grand,
    architectDiscountPct: archPct,
    builderThresholdMet: builderMet,
    builderDiscountPct: pricing.builderDiscountPercent,
    pricingNote,
  };
}

/** Line-level customer-facing rate/amount after mode discount (proportional). */
export function modeAdjustedLineAmount(
  retailAmount: number,
  modeQuote: ModeQuoteResult,
): { rateFactor: number; amount: number } {
  const rateFactor =
    modeQuote.retailSubtotal <= 0 ? 1 : modeQuote.afterModeDiscount / modeQuote.retailSubtotal;
  return { rateFactor, amount: retailAmount * rateFactor };
}

export function upsertModeVerification(
  list: ModeVerification[],
  entry: ModeVerification,
): ModeVerification[] {
  const rest = list.filter((v) => v.modeId !== entry.modeId);
  return [...rest, entry];
}
