import type { ProjectJobData, AppState } from '../types';
import { PROJECT_JOB_KEYS } from '../types';

export function extractProjectJob(state: AppState | ProjectJobData): ProjectJobData {
  return {
    jobMeta: state.jobMeta,
    openings: state.openings,
    leads: state.leads,
    siteMeasures: state.siteMeasures,
    sliding: state.sliding,
    casement: state.casement,
    doors: state.doors,
    cuts: state.cuts,
    glassPanes: state.glassPanes,
    meshGrill: state.meshGrill,
    labour: state.labour,
    quote: state.quote,
    compare: state.compare,
    builder: state.builder,
    revisions: state.revisions,
    marginExtras: state.marginExtras,
    configuratorLines: state.configuratorLines ?? [],
    customQuoteLines: state.customQuoteLines ?? [],
  };
}

export function applyProjectJob<T extends AppState>(state: T, job: ProjectJobData): T {
  return { ...state, ...job };
}

export function emptyProjectJob(from: ProjectJobData): ProjectJobData {
  return {
    jobMeta: { customerName: '', siteAddress: '', jobLabel: '' },
    openings: [],
    leads: [],
    siteMeasures: [],
    sliding: { ...from.sliding, qty: 1, widthMm: 1200, heightMm: 1200 },
    casement: { ...from.casement, qty: 1, widthMm: 1200, heightMm: 1200 },
    doors: [],
    cuts: [],
    glassPanes: [],
    meshGrill: [],
    labour: { ...from.labour },
    quote: {
      ...from.quote,
      discountAmount: 0,
      advanceAmount: 0,
      advancePercent: 0,
      customerName: '',
      siteAddress: '',
      phone: '',
      quoteNo: '',
      notes: '',
      description: from.quote.description ?? '',
      terms: from.quote.terms ?? '',
      bankDetails: from.quote.bankDetails ?? '',
      applyGst: undefined,
      quoteDate: new Date().toISOString().slice(0, 10),
    },
    compare: [],
    builder: [],
    revisions: [],
    marginExtras: { commissionPercent: 0, otherFees: 0 },
    configuratorLines: [],
    customQuoteLines: [],
  };
}

export function isProjectJobKey(key: string): key is (typeof PROJECT_JOB_KEYS)[number] {
  return (PROJECT_JOB_KEYS as readonly string[]).includes(key);
}
