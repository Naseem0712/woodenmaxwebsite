/**
 * Unit smoke for quote enhancements (GST / discount / custom / footer).
 * Run: npx vite-node tools/_smoke-quote-enhance-unit.mjs
 */
import { createSeedState } from '../src/data/seed.ts';
import {
  buildQuoteDocument,
  buildConfiguratorQuoteDocument,
  buildSiteMeasureQuoteDocument,
  documentToCsv,
} from '../src/engine/exportDocs.ts';
import { calcQuote } from '../src/engine/calcs.ts';
import { calcModeQuote } from '../src/engine/modePricing.ts';

const state = createSeedState();
state.quote.applyGst = false;
state.quote.description = 'Desc A';
state.quote.terms = 'Terms B';
state.quote.bankDetails = 'Bank C';
state.openings[0].discountPercent = 10;
state.customQuoteLines = [
  {
    id: 'c1',
    name: 'Chair set',
    sizeLabel: 'set',
    measure: 1,
    rate: 5000,
    unit: 'pc',
    qty: 2,
    discountPercent: 5,
    notes: '',
  },
];

const q = calcQuote(state);
if (q.gst !== 0) throw new Error(`GST should be 0 when off, got ${q.gst}`);
if (!(q.customSelling > 0)) throw new Error('custom selling missing');
if (!(q.openings.rows[0].hasDiscount && q.openings.rows[0].selling < q.openings.rows[0].estimate)) {
  throw new Error('opening discount not applied');
}

state.quote.applyGst = true;
const qOn = calcQuote(state);
if (!(qOn.gst > 0)) throw new Error('GST on failed');
if (Math.abs(qOn.grand - (qOn.afterDiscount + qOn.gst)) > 0.05) {
  throw new Error('grand != afterDiscount + gst');
}

const mode = calcModeQuote(state);
if (typeof mode.afterLineDiscounts !== 'number') throw new Error('mode afterLineDiscounts missing');

for (const [name, builder] of [
  ['quote', buildQuoteDocument],
  ['config', buildConfiguratorQuoteDocument],
  ['site', buildSiteMeasureQuoteDocument],
]) {
  const doc = builder(state, 'include');
  if (!doc.footerSections?.some((s) => s.title === 'Description' && s.body.includes('Desc A'))) {
    throw new Error(`${name}: missing description footer`);
  }
  if (!doc.footerSections?.some((s) => s.title === 'Bank details' && s.body.includes('Bank C'))) {
    throw new Error(`${name}: missing bank footer`);
  }
  if (!doc.openingBlocks?.some((b) => /Chair set/i.test(b.text))) {
    throw new Error(`${name}: custom product missing`);
  }
  const csv = documentToCsv(doc);
  if (!csv.includes('Desc A') || !csv.includes('Bank C')) throw new Error(`${name}: CSV footer`);
  console.log('ok', name, 'blocks', doc.openingBlocks?.length, 'footer', doc.footerSections?.length);
}

console.log('unit smoke OK', { gstOff: q.gst, gstOn: qOn.gst, custom: q.customSelling });
