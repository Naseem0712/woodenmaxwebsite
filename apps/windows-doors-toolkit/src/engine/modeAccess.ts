import type { AppState, CustomerModeId } from '../types';
import { activeCustomerMode } from './masterCatalogue';

/** Vendor (verified + active) → full fab toolkit. All other modes → quote path only. */
export function isVendorFullAccess(state: AppState, mode?: CustomerModeId): boolean {
  return (mode ?? activeCustomerMode(state)) === 'vendor';
}

export type NavItem = { to: string; label: string; end?: boolean };

/** Home owner / Architect / Builder: quote-path tools only. */
export const QUOTE_PATH_TOOLS: readonly NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/configure', label: 'Configurator' },
  { to: '/leads', label: 'Leads' },
  { to: '/quote', label: '08 Quotation' },
];

export const VENDOR_TOOLS: readonly NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/leads', label: 'Leads' },
  { to: '/site-measure', label: 'Site Measure' },
  { to: '/openings', label: '01 Openings' },
  { to: '/sliding', label: '02 Sliding' },
  { to: '/casement', label: '03 Casement' },
  { to: '/doors', label: '04 Doors' },
  { to: '/cutting', label: '05 Cutting' },
  { to: '/glass', label: '06 Glass' },
  { to: '/hardware', label: '07 Hardware' },
  { to: '/quote', label: '08 Quotation' },
  { to: '/configure', label: 'Configurator' },
  { to: '/compare', label: '09 Compare' },
  { to: '/margin', label: '10 Margin' },
  { to: '/mesh', label: '11 Mesh & Grill' },
  { to: '/labour', label: '12 Labour' },
  { to: '/builder', label: '13 Builder' },
  { to: '/revision', label: '14 Price Revision' },
  { to: '/dashboard', label: '15 Dashboard' },
];

export const QUOTE_PATH_SETTINGS: readonly NavItem[] = [
  { to: '/settings', label: 'Overview' },
  { to: '/settings/master', label: 'Master catalogue' },
  { to: '/settings/colours', label: 'Colours / finish' },
  { to: '/settings/allowances', label: 'Mode pricing' },
  { to: '/settings/data', label: 'Export / Import' },
];

export const VENDOR_SETTINGS: readonly NavItem[] = [
  { to: '/settings', label: 'Overview' },
  { to: '/settings/master', label: 'Master catalogue' },
  { to: '/settings/business', label: 'Business / GST' },
  { to: '/settings/allowances', label: 'Allowances' },
  { to: '/settings/series', label: 'Series & members' },
  { to: '/stock', label: 'Series stock' },
  { to: '/settings/window-types', label: 'Window types' },
  { to: '/settings/glass', label: 'Glass types' },
  { to: '/settings/colours', label: 'Colours / finish' },
  { to: '/settings/hardware', label: 'Hardware catalogue' },
  { to: '/settings/profiles', label: 'Profiles catalogue' },
  { to: '/settings/data', label: 'Export / Import' },
];

/** Paths allowed without Vendor mode (exact or prefix match for settings). */
const QUOTE_PATH_ALLOW = new Set([
  '/',
  '/configure',
  '/leads',
  '/quote',
  '/settings',
  '/settings/master',
  '/settings/colours',
  '/settings/allowances',
  '/settings/data',
]);

export function isQuotePathAllowed(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return QUOTE_PATH_ALLOW.has(path);
}

export function toolsForMode(fullAccess: boolean): readonly NavItem[] {
  return fullAccess ? VENDOR_TOOLS : QUOTE_PATH_TOOLS;
}

export function settingsForMode(fullAccess: boolean): readonly NavItem[] {
  return fullAccess ? VENDOR_SETTINGS : QUOTE_PATH_SETTINGS;
}
