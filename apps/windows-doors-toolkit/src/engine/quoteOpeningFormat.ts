import { formatNum } from './calcs';
import type { Unit } from '../types';

/** Inputs for one opening block on Export Quote PDF / print. */
export interface QuoteOpeningFormatInput {
  /** 1-based opening index → W-01, W-02… */
  index: number;
  location: string;
  width: number;
  height: number;
  unit: Unit;
  qty: number;
  areaSqft: number;
  windowTypeName: string;
  glassDoors?: number | null;
  meshDoors?: number | null;
  colourName?: string | null;
  /** When set (with-rates PDF), append Rate / Amount lines. */
  ratePerSqft?: number | null;
  amount?: number | null;
}

export function formatOpeningCode(index: number): string {
  return `W-${String(Math.max(1, Math.floor(index))).padStart(2, '0')}`;
}

/** Unit label as in customer template (Mm / inch / ft). */
export function formatSizeUnitLabel(unit: Unit): string {
  if (unit === 'mm') return 'Mm';
  if (unit === 'inch') return 'inch';
  return 'ft';
}

/**
 * Shutter/door breakdown from glass + mesh door counts.
 * Example: `2 shutters Glass + 1 shutter mesh`
 */
export function formatShutterDoorBreakdown(
  glassDoors?: number | null,
  meshDoors?: number | null,
): string {
  const g = Math.max(0, Number(glassDoors) || 0);
  const m = Math.max(0, Number(meshDoors) || 0);
  const glassWord = g === 1 ? 'shutter' : 'shutters';
  const meshWord = m === 1 ? 'shutter' : 'shutters';
  return `${g} ${glassWord} Glass + ${m} ${meshWord} mesh`;
}

/**
 * Customer template lines for one opening:
 *
 * ```
 * W-01 location, 00X00 Mm, qty 1, area sft
 * Window ; window door type
 * Shutter/door ; 2 shutters Glass + 1 shutter mesh
 * Color ; Matt Black
 * ```
 */
export function formatQuoteOpeningLines(input: QuoteOpeningFormatInput): string[] {
  const code = formatOpeningCode(input.index);
  const loc = (input.location || '').trim() || '—';
  const unitLabel = formatSizeUnitLabel(input.unit);
  const size = `${input.width}X${input.height} ${unitLabel}`;
  const area = formatNum(input.areaSqft);
  const lines = [
    `${code} ${loc}, ${size}, qty ${input.qty}, area ${area} sft`,
    `Window ; ${(input.windowTypeName || '').trim() || '—'}`,
    `Shutter/door ; ${formatShutterDoorBreakdown(input.glassDoors, input.meshDoors)}`,
    `Color ; ${(input.colourName || '').trim() || '—'}`,
  ];
  if (input.ratePerSqft != null && Number.isFinite(input.ratePerSqft)) {
    lines.push(`Rate ; ${formatNum(input.ratePerSqft, 0)} /sqft`);
  }
  if (input.amount != null && Number.isFinite(input.amount)) {
    lines.push(`Amount ; ${formatNum(input.amount, 0)}`);
  }
  return lines;
}

export function formatQuoteOpeningBlock(input: QuoteOpeningFormatInput): string {
  return formatQuoteOpeningLines(input).join('\n');
}
