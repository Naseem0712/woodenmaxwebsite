/**
 * Smoke: BusyWin-style Tax Invoice PDF vs sample 12.pdf structure.
 * Writes sample PDF + side-by-side notes (no shop rates hardcoded into engine).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createSeedState } from '../src/data/seed.ts';
import {
  amountInWordsInr,
  buildTaxInvoicePdfBytes,
  invoicePrintModel,
} from '../src/engine/taxInvoice.ts';
import { resolveTaxSplit } from '../src/engine/gstTax.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isPdf(buf) {
  return buf.length > 5 && Buffer.from(buf).slice(0, 5).toString('utf8') === '%PDF-';
}

/** Extract plain text via PyMuPDF (compressed streams hide strings in raw bytes). */
function pdfText(pdfPath) {
  const py = `
import fitz, sys
doc = fitz.open(sys.argv[1])
print('__PAGES__', doc.page_count)
for i, p in enumerate(doc):
    print(f'__PAGE_{i+1}__')
    print(p.get_text('text'))
`;
  const r = spawnSync('python', ['-c', py, pdfPath], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`pdf extract failed: ${r.stderr || r.stdout}`);
  return r.stdout;
}

const seed = createSeedState();

// Seller TS (36) like sample — Settings-driven letterhead, not rates
const business = {
  ...seed.business,
  companyName: 'WoodenMax Architectural Elements',
  address: '5-6-246/3/1/B Aghapura,Nampally, HYDERABAD T.S-500001',
  phone: '+917895328080',
  email: 'info@woodenmax.com',
  gstin: '36ARWPA9740L1Z3',
  pan: 'ARWPA9740L',
  udyamNo: 'TS-02-0367576',
  invoiceTagline: 'Premium Windows | Matel Louvers | Luxury Pergola | Customised Items',
  bankAccountName: 'Woodenmax Architectural Elements',
  bankAccountNo: '50200092938110',
  bankIfsc: 'HDFC0001996',
  bankName: 'HDFC, Hyderguda, Hyderabad',
  jurisdictionState: 'Telangana',
  billSeriesPrefix: 'WA2627',
  billNextSeq: 11013,
};

const inv = {
  id: 'smoke-inv-12',
  invoiceNo: 'WA2627/11012',
  date: '2026-07-21',
  customer: 'Pranav Kumar',
  phone: '',
  jobType: 'Shower',
  amount: 33614.88,
  gst: 6050.68,
  total: 39665.56,
  paid: 0,
  note: '',
  dueDate: '2026-07-21',
  quoteNo: 'WMX/20260706/6982',
  customerGstin: '', // missing → IGST (inter-state style like sample)
  billingAddress: 'B 706, Irish Pearls, Atul Marg, GH-04\nTechzone 4, Greater Noida - 201318',
  shippingAddress: 'B 706, Irish Pearls, Atul Marg, GH-04\nTechzone 4, Greater Noida - 201318',
  eWayBillNo: '',
  vehicleNo: '',
  transportName: 'BY ROAD',
  station: 'Delhi',
  reverseCharge: 'N',
  grRrNo: '',
  taxMode: resolveTaxSplit(business.gstin, ''),
  lines: [
    {
      id: 'l1',
      description:
        'PROFILE BATHROOM SHOWER\n16X45MM Slim BLK Pro\n6MM CLR Tuff Glass Shower Profiles',
      hsn: '7604',
      qty: 34.44,
      unit: 'Sqft',
      rate: 902,
      amount: 31064.88,
      gstPercent: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    },
    {
      id: 'l2',
      description: 'PROFILE BATHROOM SHOWER\n1 Profiles Extra 2 Feet',
      hsn: '7604',
      qty: 1,
      unit: 'Sqft',
      rate: 750,
      amount: 750,
      gstPercent: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    },
    {
      id: 'l3',
      description: 'TRANPORTATION CHARGES',
      hsn: '9967',
      qty: 0,
      unit: '',
      rate: 0,
      amount: 1800,
      gstPercent: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    },
  ],
  status: 'issued',
};

const state = { ...seed, business, quote: { ...seed.quote, bankDetails: '' } };
assert(inv.taxMode === 'igst', 'sample-like missing customer GSTIN → IGST');

const model = invoicePrintModel(state, inv);
assert(model.taxMode === 'igst', 'model igst');
assert(model.placeOfSupply.includes('36') || model.placeOfSupply.includes('Telangana'), 'POS');
assert(model.igst > 0, 'igst amount');
assert(model.cgst === 0 && model.sgst === 0, 'no cgst/sgst');
assert(amountInWordsInr(model.total).includes('Rupees'), 'words');

const pdf = await buildTaxInvoicePdfBytes(state, inv);
assert(isPdf(pdf), 'PDF magic');

const outDir = path.join(root, 'tools', '_tax-invoice-layout-out');
fs.mkdirSync(outDir, { recursive: true });
const outPdf = path.join(outDir, 'smoke-tax-invoice-vs-12.pdf');
fs.writeFileSync(outPdf, pdf);

// Same-state CGST+SGST variant
const localInv = {
  ...inv,
  id: 'smoke-local',
  invoiceNo: 'WA2627/11013',
  customerGstin: '36BBBBB0000B1Z5',
  taxMode: undefined,
  station: 'Hyderabad',
};
const localPdf = await buildTaxInvoicePdfBytes(state, localInv);
assert(isPdf(localPdf), 'local PDF');
const localModel = invoicePrintModel(state, localInv);
assert(localModel.taxMode === 'cgst_sgst', 'same state CGST+SGST');
assert(localModel.cgst > 0 && localModel.sgst > 0, 'cgst sgst');
fs.writeFileSync(path.join(outDir, 'smoke-tax-invoice-cgst-sgst.pdf'), localPdf);

const extracted = pdfText(outPdf);
assert(extracted.includes('__PAGES__ 2'), 'Original + Duplicate pages');
const must = [
  'TAX INVOICE',
  'Original Copy',
  'Duplicate Copy',
  'WoodenMax Architectural Elements',
  'Invoice No.',
  'Place of Supply',
  'Billed to',
  'Shipped to',
  'HSN/SAC',
  'Add : IGST',
  'Grand Total',
  'Bank Details',
  'Terms & Conditions',
  'Authorised Signatory',
  'PROFILE BATHROOM SHOWER',
  '7604',
  '9967',
  'Rupees Thirty Nine Thousand',
];
for (const s of must) {
  assert(extracted.includes(s), `PDF missing "${s}"`);
}
assert(!extracted.includes('Add : CGST'), 'IGST copy has no Add CGST');

const localPath = path.join(outDir, 'smoke-tax-invoice-cgst-sgst.pdf');
const localExtracted = pdfText(localPath);
assert(localExtracted.includes('Add : CGST'), 'local has Add CGST');
assert(localExtracted.includes('Add : SGST'), 'local has Add SGST');

const notes = `# Tax Invoice layout smoke vs D:\\\\Downloads\\\\12.pdf

## Sample (12.pdf)
- BusyWin print · A4 · 2 pages: **Original Copy** + **Duplicate Copy**
- Centered TAX INVOICE letterhead (PAN / Udyam / GSTIN / Tel / email / tagline)
- Meta grid: Invoice No / Dated / Place of Supply / Reverse Charge / GR/RR ‖ Transport / Vehicle / Station / E-Way / Order No
- Billed to ‖ Shipped to (State + GSTIN/UIN)
- Lines: S.N. | Description | HSN/SAC Code | Qty | Unit | Price | Amount
- Taxable + Add : IGST @ % · Grand Total · Units
- HSN summary (Tax Rate / Taxable / IGST / Total Tax)
- Amount in words · Bank Details · Terms & Conditions · Authorised Signatory

## Generated smoke PDF
- File: \`${outPdf}\`
- Pages: Original + Duplicate (pdf-lib)
- Tax mode IGST (seller 36, customer GSTIN blank — matches sample interstate pattern)
- CGST+SGST twin: \`${path.join(outDir, 'smoke-tax-invoice-cgst-sgst.pdf')}\`
- Place of supply label: ${model.placeOfSupply}
- Taxable ${model.taxable} · IGST ${model.igst} · Grand ${model.total}
- Words: ${amountInWordsInr(model.total)}

## Side-by-side
| Area | 12.pdf | Ours |
|---|---|---|
| Copies | Original + Duplicate | Same |
| Columns | SN Desc HSN Qty Unit Price Amount | Same |
| GST breakup | Add IGST + HSN table | Same; CGST/SGST when state codes match |
| Header extras | PAN Udyam tagline bank terms | Settings-driven (Business letterhead) |
| Series / slabs | Busy | Settings bill series + gstSlabs |
| Typography | Busy fonts | Helvetica family (pdf-lib StandardFonts) |

OK ${new Date().toISOString()}
`;
fs.writeFileSync(path.join(outDir, 'SIDE-BY-SIDE.md'), notes);

console.log(
  JSON.stringify(
    {
      ok: true,
      outPdf,
      pdfBytes: pdf.length,
      taxMode: model.taxMode,
      placeOfSupply: model.placeOfSupply,
      taxable: model.taxable,
      igst: model.igst,
      total: model.total,
      words: amountInWordsInr(model.total),
      localTaxMode: localModel.taxMode,
      localCgst: localModel.cgst,
      localSgst: localModel.sgst,
    },
    null,
    2,
  ),
);
