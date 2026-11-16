import type {
  ClientAccount,
  VendorLabourMember,
  VendorLabourPayout,
  VendorLabourTeam,
} from '../types';
import { normalizeHandle } from './ledgers';

export const CLIENT_LEDGER_STORAGE_KEY = 'wd-toolkit-client-ledgers-v1';
export const VENDOR_LEDGER_STORAGE_KEY = 'wd-toolkit-vendor-ledgers-v1';

export interface ClientLedgerDb {
  byHandle: Record<string, ClientAccount>;
  updatedAt: string;
}

export interface VendorLedgerDb {
  teams: VendorLabourTeam[];
  members: VendorLabourMember[];
  payouts: VendorLabourPayout[];
  updatedAt: string;
}

function emptyClientDb(): ClientLedgerDb {
  return { byHandle: {}, updatedAt: new Date().toISOString() };
}

function emptyVendorDb(): VendorLedgerDb {
  return { teams: [], members: [], payouts: [], updatedAt: new Date().toISOString() };
}

export function loadClientLedgerDb(): ClientLedgerDb {
  try {
    const raw = localStorage.getItem(CLIENT_LEDGER_STORAGE_KEY);
    if (!raw) return emptyClientDb();
    const parsed = JSON.parse(raw) as ClientLedgerDb;
    if (!parsed?.byHandle || typeof parsed.byHandle !== 'object') return emptyClientDb();
    return parsed;
  } catch {
    return emptyClientDb();
  }
}

export function saveClientLedgerDb(db: ClientLedgerDb): void {
  localStorage.setItem(
    CLIENT_LEDGER_STORAGE_KEY,
    JSON.stringify({ ...db, updatedAt: new Date().toISOString() }),
  );
}

export function loadVendorLedgerDb(): VendorLedgerDb {
  try {
    const raw = localStorage.getItem(VENDOR_LEDGER_STORAGE_KEY);
    if (!raw) return emptyVendorDb();
    const parsed = JSON.parse(raw) as VendorLedgerDb;
    return {
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      payouts: Array.isArray(parsed.payouts) ? parsed.payouts : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyVendorDb();
  }
}

export function saveVendorLedgerDb(db: VendorLedgerDb): void {
  localStorage.setItem(
    VENDOR_LEDGER_STORAGE_KEY,
    JSON.stringify({ ...db, updatedAt: new Date().toISOString() }),
  );
}

/** Upsert every client account into the durable handle map (reopen anytime). */
export function syncClientLedgers(accounts: ClientAccount[]): void {
  const db = loadClientLedgerDb();
  for (const a of accounts) {
    const handle = normalizeHandle(a.handle);
    if (!handle) continue;
    db.byHandle[handle] = { ...a, handle };
  }
  saveClientLedgerDb(db);
}

export function syncVendorLedgers(
  teams: VendorLabourTeam[],
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
): void {
  saveVendorLedgerDb({
    teams: [...teams],
    members: [...members],
    payouts: [...payouts],
    updatedAt: new Date().toISOString(),
  });
}

export function lookupClientLedger(handle: string): ClientAccount | null {
  const key = normalizeHandle(handle);
  if (!key) return null;
  return loadClientLedgerDb().byHandle[key] ?? null;
}

export function listClientLedgers(): ClientAccount[] {
  return Object.values(loadClientLedgerDb().byHandle).sort((a, b) =>
    a.customerName.localeCompare(b.customerName),
  );
}

/**
 * Merge AppState client accounts with durable ledger store so reopen works
 * even after a partial state restore.
 */
export function mergeClientAccountsWithStore(accounts: ClientAccount[]): ClientAccount[] {
  const stored = listClientLedgers();
  const byHandle = new Map<string, ClientAccount>();
  for (const a of stored) byHandle.set(normalizeHandle(a.handle), a);
  for (const a of accounts) {
    const key = normalizeHandle(a.handle);
    const prev = byHandle.get(key);
    if (!prev) {
      byHandle.set(key, a);
      continue;
    }
    const prevTs = Date.parse(prev.updatedAt || '') || 0;
    const nextTs = Date.parse(a.updatedAt || '') || 0;
    byHandle.set(key, nextTs >= prevTs ? a : prev);
  }
  return [...byHandle.values()];
}

export function mergeVendorLedgersWithStore(input: {
  teams: VendorLabourTeam[];
  members: VendorLabourMember[];
  payouts: VendorLabourPayout[];
}): {
  teams: VendorLabourTeam[];
  members: VendorLabourMember[];
  payouts: VendorLabourPayout[];
} {
  const stored = loadVendorLedgerDb();
  if (!input.teams.length && stored.teams.length) {
    return {
      teams: stored.teams,
      members: stored.members,
      payouts: stored.payouts,
    };
  }
  return input;
}
