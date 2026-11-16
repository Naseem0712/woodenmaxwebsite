/**
 * Editable master defaults for profile stock bar lengths.
 * Formulas must read stockLengthM from Settings profiles — never hardcode lengths inline.
 * These constants only seed / fill empty masters and Settings "Add profile".
 */
import type { Material, ProfileSku } from '../types';

/** Exact feet → metres factor used across cutting / BOQ displays. */
export const FT_TO_M = 0.3048;

/** UPVC standard bar length (metres). */
export const UPVC_DEFAULT_STOCK_LENGTH_M = 5.8;

/** Aluminium standard bar length (feet). Stored as metres on ProfileSku.stockLengthM. */
export const ALUMINIUM_DEFAULT_STOCK_LENGTH_FT = 16;

export const ALUMINIUM_DEFAULT_STOCK_LENGTH_M =
  ALUMINIUM_DEFAULT_STOCK_LENGTH_FT * FT_TO_M;

/** Material → default stock length in metres (Settings / seed masters only). */
export function defaultStockLengthM(material: Material): number {
  return material === 'Aluminium'
    ? ALUMINIUM_DEFAULT_STOCK_LENGTH_M
    : UPVC_DEFAULT_STOCK_LENGTH_M;
}

/** True when stock length is missing, NaN, or not a positive number. */
export function isMissingStockLength(stockLengthM: unknown): boolean {
  if (stockLengthM == null || stockLengthM === '') return true;
  const n = Number(stockLengthM);
  return !Number.isFinite(n) || n <= 0;
}

/**
 * Fill empty / missing stock length from material default.
 * Does NOT overwrite a user-set positive length (12/10/15 ft etc.).
 */
export function ensureProfileStockLength<T extends Pick<ProfileSku, 'material' | 'stockLengthM'>>(
  profile: T,
): T {
  if (!isMissingStockLength(profile.stockLengthM)) return profile;
  return { ...profile, stockLengthM: defaultStockLengthM(profile.material) };
}

/**
 * When material changes in Settings: keep custom lengths; if empty or still the
 * previous material's default, switch to the new material default.
 */
export function stockLengthAfterMaterialChange(
  previousMaterial: Material,
  nextMaterial: Material,
  currentStockLengthM: number,
): number {
  if (previousMaterial === nextMaterial) return currentStockLengthM;
  if (isMissingStockLength(currentStockLengthM)) {
    return defaultStockLengthM(nextMaterial);
  }
  const prevDefault = defaultStockLengthM(previousMaterial);
  // Treat near-equality so float 16ft ↔ m conversions don't leave stale defaults.
  if (Math.abs(Number(currentStockLengthM) - prevDefault) < 1e-6) {
    return defaultStockLengthM(nextMaterial);
  }
  return currentStockLengthM;
}
