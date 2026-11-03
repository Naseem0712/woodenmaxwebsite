import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import {
  Btn,
  Card,
  Field,
  Kpi,
  Money,
  NumberInput,
  PageHeader,
  Toolbar,
} from '../components/ui';
import {
  billingRateList,
  calcBillingPnL,
  draftInvoiceFromQuote,
  dueDateFrom,
  invoiceBalance,
  nextInvoiceNo,
  syncInvoicePaid,
} from '../engine/billing';
import { useApp } from '../store/AppContext';
import type { BillingExpense, BillingInvoice, BillingPayment } from '../types';

type Tab = 'rates' | 'invoice' | 'register' | 'payments' | 'expenses' | 'pnl';

export function BillingPage() {
  const { state, patch, setState } = useApp();
  const [tab, setTab] = useState<Tab>('pnl');
  const rates = useMemo(() => billingRateList(state), [state]);
  const pnl = useMemo(() => calcBillingPnL(state), [state]);
  const invoices = useMemo(
    () => syncInvoicePaid(state.billingInvoices, state.billingPayments),
    [state.billingInvoices, state.billingPayments],
  );

  const createFromQuote = () => {
    const draft = draftInvoiceFromQuote(state);
    const inv: BillingInvoice = { id: uid(), ...draft };
    setState((s) => ({
      ...s,
      billingInvoices: [...s.billingInvoices, inv],
    }));
    setTab('register');
  };

  const addBlankInvoice = () => {
    const today = new Date().toISOString().slice(0, 10);
    const inv: BillingInvoice = {
      id: uid(),
      invoiceNo: nextInvoiceNo(state.billingInvoices),
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
    };
    patch('billingInvoices', [...state.billingInvoices, inv]);
    setTab('register');
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

  return (
    <div>
      <PageHeader
        title="Billing & Profit"
        subtitle="Rate list from Settings · invoices · payments · expenses · monthly P&L (Billing-Profit Kit)."
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
            ['pnl', 'Dashboard / P&L'],
            ['rates', 'Rate list'],
            ['invoice', 'New from quote'],
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

      {tab === 'rates' ? (
        <Card
          title="Rate list (from Settings → Window types)"
          actions={
            <Link className="tiny" to="/settings/window-types">
              Edit rates in Settings
            </Link>
          }
        >
          <p className="muted tiny" style={{ marginBottom: '0.5rem' }}>
            Never hardcode shop prices here — change ₹/sqft under Settings. Invoice lines pick these names.
          </p>
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

      {tab === 'invoice' ? (
        <Card
          title="Create invoice from active quote"
          actions={
            <Toolbar>
              <Btn onClick={createFromQuote}>Create invoice from quote</Btn>
              <Btn variant="ghost" onClick={addBlankInvoice}>
                Blank invoice
              </Btn>
            </Toolbar>
          }
        >
          <p className="muted tiny">
            Uses customer / date / totals from the active project quote (Site Measure package or 08
            Quotation). GST follows quote toggle + Settings. Due days:{' '}
            <Field label="Payment due days">
              <NumberInput
                value={state.billingSettings.paymentDueDays}
                onCommit={(n) =>
                  patch('billingSettings', {
                    ...state.billingSettings,
                    paymentDueDays: n ?? state.billingSettings.paymentDueDays,
                  })
                }
              />
            </Field>
          </p>
          <div className="grid grid-3" style={{ marginTop: '0.75rem' }}>
            <Kpi label="Customer" value={state.quote.customerName || state.jobMeta.customerName || '—'} />
            <Kpi label="Quote no" value={state.quote.quoteNo || '—'} />
            <Kpi label="Quote date" value={state.quote.quoteDate || '—'} />
          </div>
        </Card>
      ) : null}

      {tab === 'register' ? (
        <Card
          title="Invoice register"
          actions={
            <Toolbar>
              <Btn onClick={addBlankInvoice}>+ Invoice</Btn>
              <Btn variant="ghost" onClick={createFromQuote}>
                From quote
              </Btn>
            </Toolbar>
          }
        >
          <table className="data">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Job</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Due</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <input
                      value={inv.invoiceNo}
                      onChange={(e) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id ? { ...x, invoiceNo: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={inv.date}
                      onChange={(e) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  date: e.target.value,
                                  dueDate: dueDateFrom(
                                    e.target.value,
                                    state.billingSettings.paymentDueDays,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={inv.customer}
                      onChange={(e) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id ? { ...x, customer: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={inv.jobType}
                      onChange={(e) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id ? { ...x, jobType: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={inv.amount}
                      onCommit={(n) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  amount: n ?? 0,
                                  total: (n ?? 0) + x.gst,
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={inv.gst}
                      onCommit={(n) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  gst: n ?? 0,
                                  total: x.amount + (n ?? 0),
                                }
                              : x,
                          ),
                        )
                      }
                    />
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
                    <input
                      type="date"
                      value={inv.dueDate}
                      onChange={(e) =>
                        patch(
                          'billingInvoices',
                          state.billingInvoices.map((x) =>
                            x.id === inv.id ? { ...x, dueDate: e.target.value } : x,
                          ),
                        )
                      }
                    />
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
        <Card
          title="Payments"
          actions={
            <Btn onClick={addPayment}>+ Payment</Btn>
          }
        >
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Note</th>
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
                    <select
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
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={p.note}
                      onChange={(e) =>
                        patch(
                          'billingPayments',
                          state.billingPayments.map((x) =>
                            x.id === p.id ? { ...x, note: e.target.value } : x,
                          ),
                        )
                      }
                    />
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
                <th>Note</th>
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
                    <select
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
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
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
                    <select
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
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={e.note}
                      onChange={(ev) =>
                        patch(
                          'billingExpenses',
                          state.billingExpenses.map((x) =>
                            x.id === e.id ? { ...x, note: ev.target.value } : x,
                          ),
                        )
                      }
                    />
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
        <>
          <Card title="Monthly P&L">
            <table className="data">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Billed</th>
                  <th>GST</th>
                  <th>Collected</th>
                  <th>Material</th>
                  <th>Staff pay</th>
                  <th>Other</th>
                  <th>All expenses</th>
                  <th>Net profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {pnl.months
                  .filter((m) => m.billed || m.collected || m.allExpenses)
                  .slice(-12)
                  .map((m) => (
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
                        <Money n={m.material} />
                      </td>
                      <td className="calc">
                        <Money n={m.staffPay} />
                      </td>
                      <td className="calc">
                        <Money n={m.otherExpenses} />
                      </td>
                      <td className="calc">
                        <Money n={m.allExpenses} />
                      </td>
                      <td className="calc">
                        <Money n={m.netProfit} />
                      </td>
                      <td className="calc">{(m.marginPct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
              12-month turnover <Money n={pnl.turnover12m} /> · Job cost stack also on{' '}
              <Link to="/margin">10 Margin</Link>.
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
