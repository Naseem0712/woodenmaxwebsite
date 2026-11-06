import { useMemo, useState } from 'react';
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
  downloadClientStatementExcel,
  downloadClientStatementPdf,
} from '../engine/ledgerExport';
import { listClientLedgers, lookupClientLedger } from '../engine/ledgerStore';
import {
  addClientCharge,
  addClientDiscount,
  addClientPayment,
  findClientByHandle,
  normalizeHandle,
  postActiveQuoteToClient,
  postSavedQuoteToClient,
  summarizeClientAccount,
  upsertClientAccount,
} from '../engine/ledgers';
import { useApp } from '../store/AppContext';
import type {
  ClientDiscountKind,
  ClientPaymentType,
} from '../types';

export function ClientAccountsPage() {
  const { state, patch } = useApp();
  const accounts = state.clientAccounts ?? [];
  const savedQuotes = state.savedQuotes ?? [];
  const [activeId, setActiveId] = useState<string>(accounts[0]?.id || '');
  const [lookupHandle, setLookupHandle] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [advanceOnImport, setAdvanceOnImport] = useState(0);
  const [msg, setMsg] = useState('');

  const account = accounts.find((a) => a.id === activeId) || accounts[0] || null;
  const summary = useMemo(
    () => (account ? summarizeClientAccount(account) : null),
    [account],
  );

  const replaceAccount = (next: NonNullable<typeof account>) => {
    const list = upsertClientAccount(accounts, next);
    patch('clientAccounts', list);
    setActiveId(next.id);
  };

  const finalizeActiveQuote = () => {
    const { accounts: next, account: row } = postActiveQuoteToClient(state, accounts);
    patch('clientAccounts', next);
    setActiveId(row.id);
    setMsg(`Finalized quote ${row.works.at(-1)?.quoteNo} → ${row.customerName}`);
  };

  const importSavedQuote = () => {
    const quote =
      savedQuotes.find((q) => q.id === selectedQuoteId) || savedQuotes[savedQuotes.length - 1];
    if (!quote) {
      setMsg('Save a quote first (Billing or Quotation), then import here.');
      return;
    }
    const { accounts: next, account: row } = postSavedQuoteToClient(
      quote,
      accounts,
      advanceOnImport,
    );
    patch('clientAccounts', next);
    setActiveId(row.id);
    setMsg(`Posted ${quote.quoteNo} with advance ${advanceOnImport}`);
  };

  const reopenByHandle = () => {
    const key = normalizeHandle(lookupHandle);
    if (!key) {
      setMsg('Enter a client handle, phone, or email.');
      return;
    }
    const live = findClientByHandle(accounts, key);
    const stored = lookupClientLedger(key) || listClientLedgers().find(
      (a) =>
        normalizeHandle(a.handle) === key ||
        normalizeHandle(a.phone) === key ||
        normalizeHandle(`ph-${a.phone.replace(/\D/g, '')}`) === key,
    );
    const found = live || stored;
    if (!found) {
      setMsg(`No client account for handle “${key}”.`);
      return;
    }
    if (!live && stored) {
      patch('clientAccounts', upsertClientAccount(accounts, stored));
    }
    setActiveId(found.id);
    setMsg(`Opened ${found.customerName} (${found.handle})`);
  };

  const addPayment = () => {
    if (!account) return;
    const today = new Date().toISOString().slice(0, 10);
    replaceAccount(
      addClientPayment(account, {
        id: uid(),
        date: today,
        amount: 0,
        type: 'cash',
        cashName: '',
        note: '',
      }),
    );
  };

  const addCharge = () => {
    if (!account) return;
    replaceAccount(
      addClientCharge(account, {
        id: uid(),
        date: new Date().toISOString().slice(0, 10),
        description: 'Extra charge',
        amount: 0,
      }),
    );
  };

  const addDiscount = (kind: ClientDiscountKind) => {
    if (!account) return;
    replaceAccount(
      addClientDiscount(account, {
        id: uid(),
        kind,
        value: kind === 'percent' ? 5 : kind === 'fixed' ? 0 : 0,
        note: '',
        appliedAt: new Date().toISOString(),
      }),
    );
  };

  const updatePayment = (
    id: string,
    patchRow: Partial<(typeof account.payments)[number]>,
  ) => {
    if (!account) return;
    const payments = account.payments.map((p) => (p.id === id ? { ...p, ...patchRow } : p));
    // Re-apply advances from scratch when amounts change
    let works = account.works.map((w) => ({
      ...w,
      advanceRemaining: w.advanceRecorded,
    }));
    for (const p of payments) {
      let left = Math.max(0, p.amount || 0);
      works = works.map((w) => {
        if (left <= 0 || !(w.advanceRemaining > 0)) return w;
        const take = Math.min(w.advanceRemaining, left);
        left -= take;
        return { ...w, advanceRemaining: Math.max(0, w.advanceRemaining - take) };
      });
    }
    replaceAccount({ ...account, payments, works, updatedAt: new Date().toISOString() });
  };

  const removePayment = (id: string) => {
    if (!account) return;
    updatePayment(id, { amount: 0 });
    const payments = account.payments.filter((p) => p.id !== id);
    let works = account.works.map((w) => ({
      ...w,
      advanceRemaining: w.advanceRecorded,
    }));
    for (const p of payments) {
      let left = Math.max(0, p.amount || 0);
      works = works.map((w) => {
        if (left <= 0 || !(w.advanceRemaining > 0)) return w;
        const take = Math.min(w.advanceRemaining, left);
        left -= take;
        return { ...w, advanceRemaining: Math.max(0, w.advanceRemaining - take) };
      });
    }
    replaceAccount({ ...account, payments, works });
  };

  const exportPdf = async () => {
    if (!account) return;
    await downloadClientStatementPdf(state, account);
    setMsg(`Exported client PDF for ${account.customerName}`);
  };

  const exportXlsx = async () => {
    if (!account) return;
    await downloadClientStatementExcel(state, account);
    setMsg(`Exported client Excel for ${account.customerName}`);
  };

  return (
    <div>
      <PageHeader
        title="Client Accounts"
        subtitle="Per-client handle: finalized quotes, advances, charges, payment types (cash / bank / UPI), final discounts. Durable store + full statement PDF/Excel."
      />
      <Toolbar>
        <Btn onClick={finalizeActiveQuote}>Finalize active quote</Btn>
        <Select
          value={selectedQuoteId}
          onChange={(e) => setSelectedQuoteId(e.target.value)}
          style={{ minWidth: 200 }}
        >
          <option value="">Saved quote…</option>
          {savedQuotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.quoteNo} · {q.customerName}
            </option>
          ))}
        </Select>
        <NumberInput
          value={advanceOnImport}
          onCommit={(n) => setAdvanceOnImport(n ?? 0)}
          title="Advance on import"
        />
        <Btn variant="ghost" onClick={importSavedQuote}>
          Import saved quote
        </Btn>
        <Btn variant="ghost" disabled={!account} onClick={() => void exportPdf()}>
          PDF
        </Btn>
        <Btn variant="ghost" disabled={!account} onClick={() => void exportXlsx()}>
          Excel
        </Btn>
      </Toolbar>

      <Card title="Reopen client by handle">
        <div className="grid grid-3">
          <Field label="Handle / phone / email">
            <Input
              value={lookupHandle}
              onChange={(e) => setLookupHandle(e.target.value)}
              placeholder="ph-98… or em-name@…"
            />
          </Field>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <Btn onClick={reopenByHandle}>Open</Btn>
            <Select
              value={account?.id || ''}
              onChange={(e) => setActiveId(e.target.value)}
              style={{ minWidth: 220 }}
            >
              {accounts.length === 0 ? <option value="">No clients yet</option> : null}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.customerName} · {a.handle}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {msg ? <p className="muted">{msg}</p> : null}
      </Card>

      {!account ? (
        <Card title="Get started">
          <p className="muted">
            Finalize the active quote or import a saved quote to open a client account.
          </p>
        </Card>
      ) : (
        <>
          <Card title="Client handle">
            <div className="grid grid-4">
              <Field label="Customer">
                <Input
                  value={account.customerName}
                  onChange={(e) =>
                    replaceAccount({ ...account, customerName: e.target.value })
                  }
                />
              </Field>
              <Field label="Handle">
                <Input
                  value={account.handle}
                  onChange={(e) =>
                    replaceAccount({
                      ...account,
                      handle: normalizeHandle(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={account.phone}
                  onChange={(e) => replaceAccount({ ...account, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={account.email}
                  onChange={(e) => replaceAccount({ ...account, email: e.target.value })}
                />
              </Field>
              <Field label="GSTIN">
                <Input
                  value={account.gstin}
                  onChange={(e) => replaceAccount({ ...account, gstin: e.target.value })}
                />
              </Field>
              <Field label="Site">
                <Input
                  value={account.siteAddress}
                  onChange={(e) =>
                    replaceAccount({ ...account, siteAddress: e.target.value })
                  }
                />
              </Field>
            </div>
          </Card>

          {summary ? (
            <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
              <Kpi label="Works" value={<Money n={summary.worksTotal} />} />
              <Kpi label="Payments" value={<Money n={summary.paymentsTotal} />} />
              <Kpi label="Advance left" value={<Money n={summary.advanceRemaining} />} />
              <Kpi label="Balance" value={<Money n={summary.balance} />} />
            </div>
          ) : null}

          <Card title="Works / quote details">
            {account.works.length === 0 ? (
              <p className="muted">No works posted yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Quote</th>
                      <th>Project</th>
                      <th>Material</th>
                      <th>Amount</th>
                      <th>Advance</th>
                      <th>Adv left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.works.map((w) => (
                      <tr key={w.id}>
                        <td>{w.finalizedAt.slice(0, 10)}</td>
                        <td>{w.quoteNo}</td>
                        <td>{w.projectName}</td>
                        <td>{w.material}</td>
                        <td>
                          <Money n={w.quoteAmount} />
                        </td>
                        <td>
                          <Money n={w.advanceRecorded} />
                        </td>
                        <td>
                          <Money n={w.advanceRemaining} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Charges"
            actions={<Btn variant="ghost" onClick={addCharge}>+ Charge</Btn>}
          >
            {account.charges.map((c) => (
              <div key={c.id} className="grid grid-4" style={{ marginBottom: 8 }}>
                <Field label="Date">
                  <Input
                    type="date"
                    value={c.date}
                    onChange={(e) =>
                      replaceAccount({
                        ...account,
                        charges: account.charges.map((x) =>
                          x.id === c.id ? { ...x, date: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={c.description}
                    onChange={(e) =>
                      replaceAccount({
                        ...account,
                        charges: account.charges.map((x) =>
                          x.id === c.id ? { ...x, description: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Amount ₹">
                  <NumberInput
                    value={c.amount}
                    onCommit={(n) =>
                      replaceAccount({
                        ...account,
                        charges: account.charges.map((x) =>
                          x.id === c.id ? { ...x, amount: n ?? 0 } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      replaceAccount({
                        ...account,
                        charges: account.charges.filter((x) => x.id !== c.id),
                      })
                    }
                  >
                    Remove
                  </Btn>
                </div>
              </div>
            ))}
          </Card>

          <Card
            title="Final discounts"
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => addDiscount('percent')}>
                  + % off
                </Btn>
                <Btn variant="ghost" onClick={() => addDiscount('gst_off')}>
                  + GST off
                </Btn>
                <Btn variant="ghost" onClick={() => addDiscount('fixed')}>
                  + Fixed less
                </Btn>
              </div>
            }
          >
            {account.discounts.map((d) => (
              <div key={d.id} className="grid grid-4" style={{ marginBottom: 8 }}>
                <Field label="Kind">
                  <Select
                    value={d.kind}
                    onChange={(e) =>
                      replaceAccount({
                        ...account,
                        discounts: account.discounts.map((x) =>
                          x.id === d.id
                            ? { ...x, kind: e.target.value as ClientDiscountKind }
                            : x,
                        ),
                      })
                    }
                  >
                    <option value="percent">Percent</option>
                    <option value="gst_off">GST off</option>
                    <option value="fixed">Fixed amount less</option>
                  </Select>
                </Field>
                <Field label={d.kind === 'percent' ? 'Percent' : 'Amount ₹'}>
                  <NumberInput
                    value={d.value}
                    disabled={d.kind === 'gst_off'}
                    onCommit={(n) =>
                      replaceAccount({
                        ...account,
                        discounts: account.discounts.map((x) =>
                          x.id === d.id ? { ...x, value: n ?? 0 } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Note">
                  <Input
                    value={d.note}
                    onChange={(e) =>
                      replaceAccount({
                        ...account,
                        discounts: account.discounts.map((x) =>
                          x.id === d.id ? { ...x, note: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      replaceAccount({
                        ...account,
                        discounts: account.discounts.filter((x) => x.id !== d.id),
                      })
                    }
                  >
                    Remove
                  </Btn>
                </div>
              </div>
            ))}
          </Card>

          <Card
            title="Payments"
            actions={<Btn variant="ghost" onClick={addPayment}>+ Payment</Btn>}
          >
            {account.payments.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--border, #d8dee6)',
                  borderRadius: 8,
                  padding: '0.75rem',
                  marginBottom: 8,
                }}
              >
                <div className="grid grid-4">
                  <Field label="Date">
                    <Input
                      type="date"
                      value={p.date}
                      onChange={(e) => updatePayment(p.id, { date: e.target.value })}
                    />
                  </Field>
                  <Field label="Amount ₹">
                    <NumberInput
                      value={p.amount}
                      onCommit={(n) => updatePayment(p.id, { amount: n ?? 0 })}
                    />
                  </Field>
                  <Field label="Type">
                    <Select
                      value={p.type}
                      onChange={(e) =>
                        updatePayment(p.id, { type: e.target.value as ClientPaymentType })
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank transfer</option>
                      <option value="upi">UPI</option>
                    </Select>
                  </Field>
                  <Field label="Note">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        value={p.note}
                        onChange={(e) => updatePayment(p.id, { note: e.target.value })}
                      />
                      <Btn variant="ghost" onClick={() => removePayment(p.id)}>
                        ×
                      </Btn>
                    </div>
                  </Field>
                </div>
                {p.type === 'cash' ? (
                  <Field label="Cash name">
                    <Input
                      value={p.cashName || ''}
                      onChange={(e) => updatePayment(p.id, { cashName: e.target.value })}
                    />
                  </Field>
                ) : null}
                {p.type === 'bank' ? (
                  <div className="grid grid-2">
                    <Field label="Account name">
                      <Input
                        value={p.bankAccountName || ''}
                        onChange={(e) =>
                          updatePayment(p.id, { bankAccountName: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Account no">
                      <Input
                        value={p.bankAccountNo || ''}
                        onChange={(e) =>
                          updatePayment(p.id, { bankAccountNo: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                ) : null}
                {p.type === 'upi' ? (
                  <Field label="UPI id">
                    <Input
                      value={p.upiId || ''}
                      onChange={(e) => updatePayment(p.id, { upiId: e.target.value })}
                    />
                  </Field>
                ) : null}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
