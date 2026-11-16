import { v4 as uid } from 'uuid';
import type { AppState, SavedQuoteLine, SavedQuoteRecord } from '../types';
import { calcQuote, formatNum } from './calcs';
import { normalizeGstSlab } from './gstTax';
import { ensureBusinessBillSeries } from './billSeries';

/** Build line snapshots from the active quote (package amounts, Settings GST slab). */
export function buildSavedQuoteLines(state: AppState): SavedQuoteLine[] {
  const q = calcQuote(state);
  const b = ensureBusinessBillSeries(state.business);
  const slab = normalizeGstSlab(b.defaultGstSlab, b.gstSlabs, 18);
  const lines: SavedQuoteLine[] = [];

  // Prefer site-measure schedule when present (Site Measure → Quotation path).
  if (q.site.rows.length) {
    for (const r of q.site.rows) {
      const amount = Math.round(r.selling);
      const qty = Math.max(1, r.line.qty || 1);
      const rate = qty > 0 ? Math.round((amount / qty) * 100) / 100 : amount;
      const size = `${formatNum(r.line.width)}×${formatNum(r.line.height)}`;
      lines.push({
        id: uid(),
        description: `${r.line.location || 'Opening'} · ${r.typeName || 'Window'} · ${size}`,
        hsn: '7610',
        qty,
        unit: 'nos',
        rate,
        amount,
        gstPercent: slab,
      });
    }
  } else {
    for (const r of q.openings.rows) {
      const amount = Math.round(r.selling);
      const qty = Math.max(1, r.line.qty || 1);
      const rate = qty > 0 ? Math.round((amount / qty) * 100) / 100 : amount;
      const size = `${formatNum(r.line.width)}×${formatNum(r.line.height)}`;
      lines.push({
        id: uid(),
        description: `${r.line.location || 'Opening'} · ${r.typeName || 'Window'} · ${size}`,
        hsn: '7610',
        qty,
        unit: 'nos',
        rate,
        amount,
        gstPercent: slab,
      });
    }
    const meshTotal = Math.round((q.mesh.mesh || 0) + (q.mesh.grill || 0));
    if (meshTotal > 0) {
      lines.push({
        id: uid(),
        description: 'Mesh / grill add-ons',
        hsn: '7610',
        qty: 1,
        unit: 'lot',
        rate: meshTotal,
        amount: meshTotal,
        gstPercent: slab,
      });
    }
  }

  if (q.customSelling > 0) {
    for (const row of q.custom.rows) {
      const qty = Math.max(1, row.line.qty || 1);
      lines.push({
        id: uid(),
        description: row.line.name || 'Custom product',
        hsn: '7610',
        qty,
        unit: row.line.unit || 'nos',
        rate: qty > 0 ? Math.round((row.selling / qty) * 100) / 100 : row.selling,
        amount: Math.round(row.selling),
        gstPercent: slab,
      });
    }
  }

  // Fallback single line when schedule empty but quote has value
  if (!lines.length && q.afterDiscount > 0) {
    lines.push({
      id: uid(),
      description: state.quote.description || 'Windows / doors package',
      hsn: '7610',
      qty: 1,
      unit: 'lot',
      rate: Math.round(q.afterDiscount),
      amount: Math.round(q.afterDiscount),
      gstPercent: slab,
    });
  }

  return lines;
}

export function snapshotActiveQuote(state: AppState): SavedQuoteRecord {
  const q = calcQuote(state);
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const lines = buildSavedQuoteLines(state);
  const taxableAmount = lines.reduce((s, l) => s + l.amount, 0);
  return {
    id: uid(),
    quoteNo: state.quote.quoteNo || '—',
    quoteDate: state.quote.quoteDate || new Date().toISOString().slice(0, 10),
    customerName: state.quote.customerName || state.jobMeta.customerName || '',
    phone: state.quote.phone || '',
    siteAddress: state.quote.siteAddress || state.jobMeta.siteAddress || '',
    customerGstin: state.quote.customerGstin || '',
    billingAddress: state.quote.billingAddress || state.quote.siteAddress || '',
    shippingAddress: state.quote.shippingAddress || state.quote.siteAddress || '',
    projectId: state.activeProjectId,
    projectName: project?.name || '',
    material: project?.material ?? 'UPVC',
    taxableAmount: Math.round(taxableAmount || q.afterDiscount),
    grandTotal: Math.round(q.grand),
    lineCount: lines.length,
    billedInvoiceId: null,
    savedAt: new Date().toISOString(),
    lines,
  };
}

/**
 * Upsert into savedQuotes by quoteNo (same series number replaces prior draft snapshot).
 * Does not clear billedInvoiceId if the prior record was already billed.
 */
export function upsertSavedQuote(
  savedQuotes: SavedQuoteRecord[],
  record: SavedQuoteRecord,
): SavedQuoteRecord[] {
  const key = record.quoteNo.trim().toLowerCase();
  const idx = savedQuotes.findIndex((q) => q.quoteNo.trim().toLowerCase() === key && key !== '—');
  if (idx < 0) return [...savedQuotes, record];
  const prev = savedQuotes[idx];
  const next = {
    ...record,
    id: prev.id,
    billedInvoiceId: prev.billedInvoiceId ?? null,
  };
  const copy = savedQuotes.slice();
  copy[idx] = next;
  return copy;
}

export function markQuoteBilled(
  savedQuotes: SavedQuoteRecord[],
  quoteNo: string,
  invoiceId: string,
): SavedQuoteRecord[] {
  const key = quoteNo.trim().toLowerCase();
  return savedQuotes.map((q) =>
    q.quoteNo.trim().toLowerCase() === key ? { ...q, billedInvoiceId: invoiceId } : q,
  );
}

export function clearQuoteBilled(
  savedQuotes: SavedQuoteRecord[],
  quoteNo: string,
): SavedQuoteRecord[] {
  const key = quoteNo.trim().toLowerCase();
  return savedQuotes.map((q) =>
    q.quoteNo.trim().toLowerCase() === key ? { ...q, billedInvoiceId: null } : q,
  );
}

export function findSavedQuote(
  savedQuotes: SavedQuoteRecord[],
  idOrQuoteNo: string,
): SavedQuoteRecord | undefined {
  const key = idOrQuoteNo.trim().toLowerCase();
  return savedQuotes.find(
    (q) => q.id === idOrQuoteNo || q.quoteNo.trim().toLowerCase() === key,
  );
}
