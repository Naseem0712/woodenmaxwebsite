import type { AppState, ModeVerification, ProjectJobData, ProjectMeta } from '../types';
import { extractProjectJob } from '../store/projectKeys';

export const ACCOUNTS_STORAGE_KEY = 'wd-toolkit-accounts-v1';

/** Loose business/personal email check — format only. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

export function isPersonalEmailDomain(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1] ?? '';
  return /^(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|protonmail|proton|rediffmail)\./i.test(
    domain,
  );
}

/** Deterministic customer ID from email for the shared account database. */
export function customerIdFromEmail(email: string): string {
  const normalized = normalizeEmail(email);
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return `cust_${hex}_${slug}`;
}

export function isVerificationComplete(v: ModeVerification): boolean {
  return Boolean(
    v.modeId &&
      v.name?.trim() &&
      isValidEmail(v.email ?? '') &&
      v.customerId?.trim() &&
      v.mobile?.trim() &&
      v.area?.trim() &&
      v.city?.trim() &&
      v.gstNo?.trim(),
  );
}

/** Migrate legacy professionalId → email when possible. */
export function normalizeModeVerification(raw: Partial<ModeVerification> & { professionalId?: string }): ModeVerification {
  const legacyId = (raw.professionalId ?? '').trim();
  const emailRaw = (raw.email ?? (legacyId.includes('@') ? legacyId : '')).trim();
  const email = normalizeEmail(emailRaw);
  const customerId =
    (raw.customerId ?? '').trim() || (email && isValidEmail(email) ? customerIdFromEmail(email) : '');
  return {
    modeId: raw.modeId as ModeVerification['modeId'],
    name: (raw.name ?? '').trim(),
    email,
    customerId,
    mobile: (raw.mobile ?? '').trim(),
    area: (raw.area ?? '').trim(),
    city: (raw.city ?? '').trim(),
    gstNo: (raw.gstNo ?? '').trim(),
    verifiedAt: raw.verifiedAt ?? new Date().toISOString(),
  };
}

export interface AccountSnapshot {
  customerId: string;
  email: string;
  verifications: ModeVerification[];
  projects: ProjectMeta[];
  projectBags: Record<string, ProjectJobData>;
  activeProjectId: string;
  updatedAt: string;
}

export interface AccountsDb {
  byEmail: Record<string, AccountSnapshot>;
}

function emptyDb(): AccountsDb {
  return { byEmail: {} };
}

export function loadAccountsDb(): AccountsDb {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as AccountsDb;
    if (!parsed?.byEmail || typeof parsed.byEmail !== 'object') return emptyDb();
    return parsed;
  } catch {
    return emptyDb();
  }
}

export function saveAccountsDb(db: AccountsDb): void {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(db));
}

export function lookupAccountByEmail(email: string): AccountSnapshot | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  return loadAccountsDb().byEmail[key] ?? null;
}

export function buildAccountSnapshot(
  state: AppState,
  verifications: ModeVerification[],
  email: string,
): AccountSnapshot {
  const normalized = normalizeEmail(email);
  const bags: Record<string, ProjectJobData> = {
    ...state.projectBags,
    [state.activeProjectId]: extractProjectJob(state),
  };
  const customerId =
    verifications.find((v) => normalizeEmail(v.email) === normalized)?.customerId ||
    customerIdFromEmail(normalized);
  return {
    customerId,
    email: normalized,
    verifications: verifications
      .filter((v) => normalizeEmail(v.email) === normalized)
      .map(normalizeModeVerification),
    projects: state.projects.map((p) => ({ ...p })),
    projectBags: bags,
    activeProjectId: state.activeProjectId,
    updatedAt: new Date().toISOString(),
  };
}

/** Upsert verification profile + project snapshot keyed by email. */
export function upsertAccountFromState(
  state: AppState,
  verifications: ModeVerification[],
  email: string,
): AccountSnapshot {
  const snapshot = buildAccountSnapshot(state, verifications, email);
  const db = loadAccountsDb();
  const prev = db.byEmail[snapshot.email];
  // Keep any modes already stored that are not in the new list (merge by modeId)
  const byMode = new Map<string, ModeVerification>();
  for (const v of prev?.verifications ?? []) byMode.set(v.modeId, normalizeModeVerification(v));
  for (const v of snapshot.verifications) byMode.set(v.modeId, normalizeModeVerification(v));
  const merged: AccountSnapshot = {
    ...snapshot,
    verifications: [...byMode.values()],
    customerId: snapshot.customerId || prev?.customerId || customerIdFromEmail(snapshot.email),
  };
  db.byEmail[snapshot.email] = merged;
  saveAccountsDb(db);
  return merged;
}

/** Sync every verified email’s account snapshot from the live app state. */
export function syncAccountsFromState(state: AppState): void {
  const emails = new Set(
    state.modeVerifications
      .map(normalizeModeVerification)
      .filter(isVerificationComplete)
      .map((v) => normalizeEmail(v.email)),
  );
  for (const email of emails) {
    upsertAccountFromState(state, state.modeVerifications.map(normalizeModeVerification), email);
  }
}

export type RestoreAccountResult = {
  modeVerifications: ModeVerification[];
  projects: ProjectMeta[];
  projectBags: Record<string, ProjectJobData>;
  activeProjectId: string;
  customerId: string;
  email: string;
};

/** Load saved projects / quotes / verifications for a returning email login. */
export function restoreAccountByEmail(email: string): RestoreAccountResult | null {
  const account = lookupAccountByEmail(email);
  if (!account) return null;
  const verifications = account.verifications.map(normalizeModeVerification);
  const activeProjectId =
    account.projects.some((p) => p.id === account.activeProjectId)
      ? account.activeProjectId
      : account.projects[0]?.id ?? '';
  if (!activeProjectId || !account.projects.length) return null;
  return {
    modeVerifications: verifications,
    projects: account.projects,
    projectBags: account.projectBags ?? {},
    activeProjectId,
    customerId: account.customerId,
    email: account.email,
  };
}
