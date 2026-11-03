import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import {
  Btn,
  Card,
  Field,
  Input,
  Kpi,
  Money,
  NumberInput,
  PageHeader,
  Select,
  Toolbar,
} from '../components/ui';
import {
  billingRateList,
  calcBillingPnL,
  createBillFromSavedQuote,
  draftInvoiceFromQuote,
  dueDateFrom,
  invoiceBalance,
  nextInvoiceNo,
  syncInvoicePaid,
} from '../engine/billing';
import { assertBillNoReusable, ensureBusinessBillSeries, peekNextBillNo } from '../engine/billSeries';
import { normalizeGstSlab, resolveTaxSplit } from '../engine/gstTax';
import {
  clearQuoteBilled,
  snapshotActiveQuote,
  upsertSavedQuote,
  markQuoteBilled,
} from '../engine/savedQuotes';
import {
  downloadTaxInvoiceExcel,
  downloadTaxInvoicePdf,
  recomputeInvoiceTaxes,
} from '../engine/taxInvoice';
import { useApp } from '../store/AppContext';
import type { BillingExpense, BillingInvoice, BillingInvoiceLine, BillingPayment } from '../types';

type Tab = 'tax' | 'rates' | 'register' | 'payments' | 'expenses' | 'pnl';

export function BillingPage() {
  const { state, patch, setState } = useApp();
  const [tab, setTab] = useState<Tab>('tax');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('');
  const [billMsg, setBillMsg] = useState<string>('');

  const business = ensureBusinessBillSeries(state.business);
  const rates = useMemo(() => billingRateList(state), [state]);
  const pnl = useMemo(() => calcBillingPnL(state), [state]);
  const invoices = useMemo(
    () => syncInvoicePaid(state.billingInvoices, state.billingPayments),
    [state.billingInvoices, state.billingPayments],
  );
  const savedQuotes = state.savedQuotes ?? [];
  const activeInvoice =
    invoices.find((i) => i.id === activeInvoiceId) ||
    invoices[invoices.length - 1] ||
    null;

  const saveActiveQuote = () => {
    const snap = snapshotActiveQuote(state);
    setState((s) => ({
      ...s,
      savedQuotes: upsertSavedQuote(s.savedQuotes ?? [], snap),
    }));
    setSelectedQuoteId(snap.id);
    setBillMsg(`Saved quote ${snap.quoteNo} (${snap.lineCount} lines)`);
    setTab('tax');
  };

  const createBillFromSelected = () => {
    const quote =
      savedQuotes.find((q) => q.id === selectedQuoteId) ||
      savedQuotes.find((q) => !q.billedInvoiceId);
    if (!quote) {
      setBillMsg('Save a quote first, then pick it here.');
      return;
    }
    const result = createBillFromSavedQuote(state, quote);
    if (result.ok === false) {
      setBillMsg(result.reason);
      return;
    }
    setState((s) => ({
      ...s,
      business: result.business,
      billingInvoices: [...s.billingInvoices, result.invoice],
      savedQuotes: markQuoteBilled(s.savedQuotes ?? [], quote.quoteNo, result.invoice.id),
    }));
    setActiveInvoiceId(result.invoice.id);
    setBillMsg(`Created Tax Invoice ${result.invoice.invoiceNo}`);
    setTab('tax');
  };

  const clearBilled = (quoteNo: string) => {
    setState((s) => ({
      ...s,
      savedQuotes: clearQuoteBilled(s.savedQuotes ?? [], quoteNo),
    }));
    setBillMsg(`Cleared billed status for ${quoteNo}`);
  };

  const createFromActiveQuote = () => {
    const { draft, business: nextBusiness } = draftInvoiceFromQuote(state);
    const inv: BillingInvoice = { id: uid(), ...draft };
    const snap = snapshotActiveQuote(state);
    setState((s) => ({
      ...s,
      business: nextBusiness,
      billingInvoices: [...s.billingInvoices, inv],
      savedQuotes: markQuoteBilled(
        upsertSavedQuote(s.savedQuotes ?? [], snap),
        snap.quoteNo,
        inv.id,
      ),
    }));
    setActiveInvoiceId(inv.id);
    setBillMsg(`Created Tax Invoice ${inv.invoiceNo} from active quote`);
    setTab('tax');
  };

  const patchInvoice = (id: string, patchInv: Partial<BillingInvoice>) => {
    setState((s) => {
      const seller = ensureBusinessBillSeries(s.business).gstin;
      const billingInvoices = s.billingInvoices.map((x) => {
        if (x.id !== id) return x;
        let next = { ...x, ...patchInv };
        if (patchInv.invoiceNo != null && patchInv.invoiceNo !== x.invoiceNo) {
          const check = assertBillNoReusable(s.billingInvoices, patchInv.invoiceNo, id);
          if (check.ok === false) {
            setBillMsg(check.reason);
            return x;
          }
        }
        next = recomputeInvoiceTaxes(next, seller);
        return next;
      });
      return { ...s, billingInvoices };
    });
  };

  const patchLine = (invId: string, lineId: string, patchLine: Partial<BillingInvoiceLine>) => {
    setState((s) => {
      const seller = ensureBusinessBillSeries(s.business).gstin;
      return {
        ...s,
        billingInvoices: s.billingInvoices.map((inv) => {
          if (inv.id !== invId) return inv;
          const lines = (inv.lines ?? []).map((l) =>
            l.id === lineId ? { ...l, ...patchLine } : l,
          );
          return recomputeInvoiceTaxes({ ...inv, lines }, seller);
        }),
      };
    });
  };

  const addBlankInvoice = () => {
    const today = new Date().toISOString().slice(0, 10);
    const no = nextInvoiceNo(state.billingInvoices, business);
    const inv: BillingInvoice = {
      id: uid(),
      invoiceNo: no,
      date: today,
      customer: state.quote.customerName || state.jobMeta.customerName || '',
      phone: state.quote.phone || '',
      jobType: 'UPVC windows',
      amount: 0,
      gst: 0,
      total: 0,
      paid: 0,
      note: '',
      dueDate: dueDateFrom(today, state.billingSettings.paymentDueDays),
      customerGstin: state.quote.customerGstin || '',
      billingAddress: state.quote.billingAddress || '',
      shippingAddress: state.quote.shippingAddress || '',
      eWayBillNo: '',
      vehicleNo: '',
      transportName: '',
      taxMode: resolveTaxSplit(business.gstin, state.quote.customerGstin || ''),
      lines: [],
      status: 'draft',
    };
    setState((s) => ({
      ...s,
      business: {
        ...ensureBusinessBillSeries(s.business),
        billNextSeq: ensureBusinessBillSeries(s.business).billNextSeq + 1,
      },
      billingInvoices: [...s.billingInvoices, inv],
    }));
    setActiveInvoiceId(inv.id);
    setTab('tax');
  };

  const addPayment = () => {
    const last = invoices[invoices.length - 1];
    const row: BillingPayment = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      invoiceNo: last?.invoiceNo ?? '',
      amount: last ? invoiceBalance(last) : 0,
      mode: state.billingSettings.payModes[0] ?? 'UPI',
      note: '',
      customer: last?.customer ?? '',
      jobType: last?.jobType ?? '',
    };
    patch('billingPayments', [...state.billingPayments, row]);
    setTab('payments');
  };

  const addExpense = () => {
    const row: BillingExpense = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      head: state.billingSettings.expenseHeads[0] ?? 'Other',
      amount: 0,
      mode: state.billingSettings.payModes[0] ?? 'UPI',
      note: '',
    };
    patch('billingExpenses', [...state.billingExpenses, row]);
    setTab('expenses');
  };

  const taxPreview = activeInvoice
    ? recomputeInvoiceTaxes(activeInvoice, business.gstin)
    : null;

  return (
    <div>
      <PageHeader
        title="Billing & Profit"
        subtitle="Tax Invoice from saved quotes · CGST+SGST / IGST · bill series · P&L"
        badge="Shop"
      />

      <div className="grid grid-4" style={{ marginBottom: '0.85rem' }}>
        <Kpi label="Billed this month" value={<Money n={pnl.billedThisMonth} />} />
        <Kpi label="Collected this month" value={<Money n={pnl.collectedThisMonth} />} />
        <Kpi label="Dues" value={<Money n={pnl.dues} />} />
        <Kpi label="Net this month" value={<Money n={pnl.netThisMonth} />} />
      </div>

      <div className="chip-row" style={{ marginBottom: '0.85rem' }}>
        {(
          [
            ['tax', 'Tax Invoice'],
            ['pnl', 'Dashboard / P&L'],
            ['rates', 'Rate list'],
            ['register', 'Invoice register'],
            ['payments', 'Payments'],
            ['expenses', 'Expenses'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip ${tab === id ? 'chip-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {billMsg ? (
        <p className="tiny" data-testid="billing-msg" style={{ marginBottom: '0.65rem' }}>
          {billMsg}
        </p>
      ) : null}

      {tab === 'tax' ? (
        <div className="grid grid-2" style={{ alignItems: 'start', gap: '0.85rem' }}>
          <Card
            title="Quote → Bill"
            actions={
              <Toolbar>
                <Btn variant="ghost" onClick={saveActiveQuote} data-testid="save-quote-for-bill">
                  Save active quote
                </Btn>
                <Btn onClick={createBillFromSelected} data-testid="create-bill-from-quote">
                  Create Tax Invoice
                </Btn>
              </Toolbar>
            }
          >
            <p className="muted tiny" style={{ marginBottom: '0.5rem' }}>
              One quote → one bill. Already-billed quotes stay locked until you clear billed
              status. Next bill: <strong>{peekNextBillNo(business)}</strong>
            </p>
            <table className="data" data-testid="saved-quotes-table">
              <thead>
                <tr>
                  <th />
                  <th>Quote</th>
                  <th>Customer</th>
                  <th>Taxable</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {savedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted tiny">
                      No saved quotes yet — click Save active quote, or{' '}
                      <Btn variant="ghost" onClick={createFromActiveQuote}>
                        bill active quote now
                      </Btn>
                    </td>
                  </tr>
                ) : (
                  savedQuotes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <input
                          type="radio"
                          name="saved-quote"
                          checked={selectedQuoteId === q.id}
                          onChange={() => setSelectedQuoteId(q.id)}
                          data-testid={`pick-quote-${q.quoteNo}`}
                        />
                      </td>
                      <td>
                        {q.quoteNo}
                        <div className="tiny muted">{q.quoteDate}</div>
                      </td>
                      <td>{q.customerName || '—'}</td>
                      <td>
                        <Money n={q.taxableAmount} />
                      </td>
                      <td>
                        {q.billedInvoiceId ? (
                          <span className="tiny">Billed</span>
                        ) : (
                          <span className="tiny muted">Open</span>
                        )}
                      </td>
                      <td>
                        {q.billedInvoiceId ? (
                          <Btn variant="ghost" onClick={() => clearBilled(q.quoteNo)}>
                            Clear billed
                          </Btn>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ marginTop: '0.65rem' }}>
              <Btn variant="ghost" onClick={addBlankInvoice}>
                Blank draft invoice
              </Btn>
              <Link className="tiny" to="/settings/business" style={{ marginLeft: '0.75rem' }}>
                Bill series / GST slabs in Settings
              </Link>
            </div>
          </Card>

          <Card
            title="Tax Invoice editor"
            actions={
              activeInvoice ? (
                <Toolbar>
                  <Btn
                    variant="ghost"
                    data-testid="export-tax-invoice-pdf"
                    onClick={() => void downloadTaxInvoicePdf(state, activeInvoice)}
                  >
                    PDF
                  </Btn>
                  <Btn
                    variant="ghost"
                    data-testid="export-tax-invoice-excel"
                    onClick={() => void downloadTaxInvoiceExcel(state, activeInvoice)}
                  >
                    Excel
                  </Btn>
                </Toolbar>
              ) : null
            }
          >
            {!activeInvoice ? (
              <p className="muted tiny">Create or select an invoice to edit header / export.</p>
            ) : (
              <div data-testid="tax-invoice-editor">
                <Field label="Active invoice">
                  <Select
                    value={activeInvoice.id}
                    onChange={(e) => setActiveInvoiceId(e.target.value)}
                  >
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} · {inv.customer || '—'}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-2" style={{ marginTop: '0.5rem' }}>
                  <Field label="Bill no">
                    <Input
                      value={activeInvoice.invoiceNo}
                      data-testid="bill-no-input"
                      onChange={(e) => patchInvoice(activeInvoice.id, { invoiceNo: e.target.value })}
                    />
                  </Field>
                  <Field label="Date">
                    <Input
                      type="date"
                      value={activeInvoice.date}
                      onChange={(e) => patchInvoice(activeInvoice.id, { date: e.target.value })}
                    />
                  </Field>
                  <Field label="Customer">
                    <Input
                      value={activeInvoice.customer}
                      onChange={(e) => patchInvoice(activeInvoice.id, { customer: e.target.value })}
                    />
                  </Field>
                  <Field label="Customer GSTIN" hint="First 2 digits = state">
                    <Input
                      value={activeInvoice.customerGstin || ''}
                      data-testid="customer-gstin"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { customerGstin: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Billing address">
                    <Input
                      value={activeInvoice.billingAddress || ''}
                      data-testid="billing-address"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { billingAddress: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Shipping address">
                    <Input
                      value={activeInvoice.shippingAddress || ''}
                      data-testid="shipping-address"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { shippingAddress: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="E-way bill no">
                    <Input
                      value={activeInvoice.eWayBillNo || ''}
                      data-testid="eway-bill"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { eWayBillNo: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Vehicle no">
                    <Input
                      value={activeInvoice.vehicleNo || ''}
                      data-testid="vehicle-no"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { vehicleNo: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Transport">
                    <Input
                      value={activeInvoice.transportName || ''}
                      data-testid="transport-name"
                      onChange={(e) =>
                        patchInvoice(activeInvoice.id, { transportName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Place of supply">
                    <Input value={taxPreview?.placeOfSupply || '—'} readOnly />
                  </Field>
                </div>

                <p className="tiny" style={{ marginTop: '0.65rem' }} data-testid="tax-mode-label">
                  Company GST {business.gstin || '—'} · Tax mode:{' '}
                  <strong>
                    {(taxPreview?.taxMode || 'igst') === 'cgst_sgst' ? 'CGST + SGST' : 'IGST'}
                  </strong>
                </p>

                <table className="data" style={{ marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Taxable</th>
                      <th>Slab %</th>
                      <th>Tax</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(taxPreview?.lines || []).map((line) => (
                      <tr key={line.id}>
                        <td>
                          <input
                            value={line.description}
                            onChange={(e) =>
                              patchLine(activeInvoice.id, line.id, {
                                description: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={line.qty}
                            onCommit={(n) => {
                              const qty = n ?? 1;
                              const amount = Math.round(qty * line.rate);
                              patchLine(activeInvoice.id, line.id, { qty, amount });
                            }}
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={line.rate}
                            onCommit={(n) => {
                              const rate = n ?? 0;
                              const amount = Math.round(line.qty * rate);
                              patchLine(activeInvoice.id, line.id, { rate, amount });
                            }}
                          />
                        </td>
                        <td className="calc">
                          <Money n={line.amount} />
                        </td>
                        <td>
                          <Select
                            value={String(line.gstPercent)}
                            onChange={(e) =>
                              patchLine(activeInvoice.id, line.id, {
                                gstPercent: normalizeGstSlab(
                                  Number(e.target.value),
                                  business.gstSlabs,
                                  business.defaultGstSlab,
                                ),
                              })
                            }
                          >
                            {business.gstSlabs.map((s) => (
                              <option key={s} value={s}>
                                {s}%
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="calc">
                          <Money n={line.cgst + line.sgst + line.igst} />
                        </td>
                        <td className="calc">
                          <Money n={line.total} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-3" style={{ marginTop: '0.65rem' }}>
                  <Kpi label="Taxable" value={<Money n={taxPreview?.taxableAmount ?? 0} />} />
                  {(taxPreview?.taxMode || 'igst') === 'cgst_sgst' ? (
                    <>
                      <Kpi label="CGST" value={<Money n={taxPreview?.cgst ?? 0} />} />
                      <Kpi label="SGST" value={<Money n={taxPreview?.sgst ?? 0} />} />
                    </>
                  ) : (
                    <Kpi label="IGST" value={<Money n={taxPreview?.igst ?? 0} />} />
                  )}
                  <Kpi label="Grand total" value={<Money n={taxPreview?.total ?? 0} />} />
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'rates' ? (
        <Card
          title="Rate list (from Settings → Window types)"
          actions={
            <Link className="tiny" to="/settings/window-types">
              Edit rates in Settings
            </Link>
          }
        >
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Window / work</th>
                <th>Material</th>
                <th>Unit</th>
                <th>Rate ₹</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.material}</td>
                  <td>{r.unit}</td>
                  <td className="calc">
                    <Money n={r.rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === 'register' ? (
        <Card title="Invoice register">
          <table className="data">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Taxable</th>
                <th>GST</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <button type="button" className="linkish" onClick={() => {
                      setActiveInvoiceId(inv.id);
                      setTab('tax');
                    }}>
                      {inv.invoiceNo}
                    </button>
                  </td>
                  <td>{inv.date}</td>
                  <td>{inv.customer}</td>
                  <td className="calc">
                    <Money n={inv.amount} />
                  </td>
                  <td className="calc">
                    <Money n={inv.gst} />
                  </td>
                  <td className="calc">
                    <Money n={inv.total} />
                  </td>
                  <td className="calc">
                    <Money n={inv.paid} />
                  </td>
                  <td className="calc">
                    <Money n={invoiceBalance(inv)} />
                  </td>
                  <td>
                    <Btn
                      variant="danger"
                      onClick={() =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.filter((x) => x.id !== inv.id),
                        )
                      }
                    >
                      Del
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === 'payments' ? (
        <Card title="Payments" actions={<Btn onClick={addPayment}>+ Payment</Btn>}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Mode</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.billingPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="date"
                      value={p.date}
                      onChange={(e) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, date: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={p.invoiceNo}
                      onChange={(e) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, invoiceNo: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={p.customer}
                      onChange={(e) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, customer: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={p.amount}
                      onCommit={(n) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, amount: n ?? 0 } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Select
                      value={p.mode}
                      onChange={(e) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, mode: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      {state.billingSettings.payModes.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Btn
                      variant="danger"
                      onClick={() =>
                        patch(
                          'billingPayments',
                          state.billingPayments.filter((x) => x.id !== p.id),
                        )
                      }
                    >
                      Del
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === 'expenses' ? (
        <Card title="Expenses" actions={<Btn onClick={addExpense}>+ Expense</Btn>}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Head</th>
                <th>Amount</th>
                <th>Mode</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.billingExpenses.map((e) => (
                <tr key={e.id}>
                  <td>
                    <input
                      type="date"
                      value={e.date}
                      onChange={(ev) =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.map((x) =>
                            x.id === e.id ? { ...x, date: ev.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Select
                      value={e.head}
                      onChange={(ev) =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.map((x) =>
                            x.id === e.id ? { ...x, head: ev.target.value } : x,
                          ),
                        )
                      }
                    >
                      {state.billingSettings.expenseHeads.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <NumberInput
                      value={e.amount}
                      onCommit={(n) =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.map((x) =>
                            x.id === e.id ? { ...x, amount: n ?? 0 } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Select
                      value={e.mode}
                      onChange={(ev) =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.map((x) =>
                            x.id === e.id ? { ...x, mode: ev.target.value } : x,
                          ),
                        )
                      }
                    >
                      {state.billingSettings.payModes.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Btn
                      variant="danger"
                      onClick={() =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.filter((x) => x.id !== e.id),
                        )
                      }
                    >
                      Del
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === 'pnl' ? (
        <Card title="Monthly P&L">
          <table className="data">
            <thead>
              <tr>
                <th>Month</th>
                <th>Billed</th>
                <th>GST</th>
                <th>Collected</th>
                <th>Expenses</th>
                <th>Net</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {pnl.months.slice(-12).map((m) => (
                <tr key={m.month}>
                  <td>{m.month}</td>
                  <td className="calc">
                    <Money n={m.billed} />
                  </td>
                  <td className="calc">
                    <Money n={m.gst} />
                  </td>
                  <td className="calc">
                    <Money n={m.collected} />
                  </td>
                  <td className="calc">
                    <Money n={m.allExpenses} />
                  </td>
                  <td className="calc">
                    <Money n={m.netProfit} />
                  </td>
                  <td>{(m.marginPct * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
