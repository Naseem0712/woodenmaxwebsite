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
  downloadVendorLedgerExcel,
  downloadVendorLedgerPdf,
} from '../engine/ledgerExport';
import {
  emptyLabourMember,
  emptyVendorTeam,
  labourBudgetLeft,
  labourEarned,
  labourPayable,
  normalizeHandle,
  summarizeVendorTeam,
} from '../engine/ledgers';
import { useApp } from '../store/AppContext';
import type { LabourRateUnit, VendorLabourPayout } from '../types';

export function VendorLabourLedgerPage() {
  const { state, patch, setState } = useApp();
  const teams = state.vendorLabourTeams ?? [];
  const members = state.vendorLabourMembers ?? [];
  const payouts = state.vendorLabourPayouts ?? [];
  const [activeId, setActiveId] = useState<string>(teams[0]?.id || '');
  const [msg, setMsg] = useState('');

  const team = teams.find((t) => t.id === activeId) || teams[0] || null;
  const summary = useMemo(
    () => (team ? summarizeVendorTeam(team, members, payouts) : null),
    [team, members, payouts],
  );

  const addTeam = () => {
    const row = emptyVendorTeam({
      id: uid(),
      vendorName: 'New vendor',
      teamLeaderName: '',
      handle: `vendor-${teams.length + 1}`,
    });
    patch('vendorLabourTeams', [...teams, row]);
    setActiveId(row.id);
    setMsg(`Added vendor team ${row.vendorName}`);
  };

  const updateTeam = (id: string, patchRow: Partial<typeof teams[0]>) => {
    patch(
      'vendorLabourTeams',
      teams.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patchRow };
        if (patchRow.vendorName && !patchRow.handle) {
          next.handle = normalizeHandle(patchRow.vendorName);
        } else if (patchRow.handle) {
          next.handle = normalizeHandle(patchRow.handle);
        }
        return next;
      }),
    );
  };

  const addLabour = () => {
    if (!team) return;
    const row = emptyLabourMember(team.id, {
      id: uid(),
      name: `Labour ${summary ? summary.memberCount + 1 : 1}`,
      rate: state.labour.fabPerSqft || 0,
      rateUnit: 'sqft',
    });
    patch('vendorLabourMembers', [...members, row]);
    setMsg(`Added ${row.name} under ${team.vendorName}`);
  };

  const updateLabour = (id: string, patchRow: Partial<(typeof members)[0]>) => {
    patch(
      'vendorLabourMembers',
      members.map((m) => (m.id === id ? { ...m, ...patchRow } : m)),
    );
  };

  const removeLabour = (id: string) => {
    setState((s) => ({
      ...s,
      vendorLabourMembers: (s.vendorLabourMembers ?? []).filter((m) => m.id !== id),
      vendorLabourPayouts: (s.vendorLabourPayouts ?? []).filter((p) => p.labourId !== id),
    }));
  };

  const addPayout = (labourId: string) => {
    if (!team) return;
    const row: VendorLabourPayout = {
      id: uid(),
      vendorId: team.id,
      labourId,
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      kind: 'payout',
      note: '',
    };
    patch('vendorLabourPayouts', [...payouts, row]);
  };

  const updatePayout = (id: string, patchRow: Partial<VendorLabourPayout>) => {
    patch(
      'vendorLabourPayouts',
      payouts.map((p) => (p.id === id ? { ...p, ...patchRow } : p)),
    );
  };

  const removePayout = (id: string) => {
    patch(
      'vendorLabourPayouts',
      payouts.filter((p) => p.id !== id),
    );
  };

  const exportPdf = async () => {
    if (!team) return;
    await downloadVendorLedgerPdf(state, team, members, payouts);
    setMsg(`Exported PDF for ${team.vendorName}`);
  };

  const exportXlsx = async () => {
    if (!team) return;
    await downloadVendorLedgerExcel(state, team, members, payouts);
    setMsg(`Exported Excel for ${team.vendorName}`);
  };

  const pullQuoteArea = () => {
    if (!team || !summary) return;
    const sqft = state.openings.reduce(
      (s, o) => s + ((o.width || 0) * (o.height || 0) * (o.qty || 1)) / 92903.04,
      0,
    );
    const areaAmount = Math.round(sqft * (state.labour.fabPerSqft || 0));
    const per = summary.memberCount ? Math.round(areaAmount / summary.memberCount) : areaAmount;
    patch(
      'vendorLabourMembers',
      members.map((m) =>
        m.vendorId === team.id ? { ...m, quoteAreaAmount: per } : m,
      ),
    );
    setMsg(`Distributed quote-area amount ≈ ${per} per labour`);
  };

  return (
    <div>
      <PageHeader
        title="Vendor / Labour Team Ledger"
        subtitle="Multiple labour names under one vendor handle. Team-leader scoped — advance, work set, rates, extra payout, budget, quote-area amount. Durable + PDF/Excel."
      />
      <Toolbar>
        <Btn onClick={addTeam}>+ Vendor team</Btn>
        <Select
          value={team?.id || ''}
          onChange={(e) => setActiveId(e.target.value)}
          style={{ minWidth: 220 }}
        >
          {teams.length === 0 ? <option value="">No teams yet</option> : null}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.vendorName} · {t.teamLeaderName || 'no leader'}
            </option>
          ))}
        </Select>
        <Btn variant="ghost" disabled={!team} onClick={addLabour}>
          + Labour
        </Btn>
        <Btn variant="ghost" disabled={!team || !summary?.memberCount} onClick={pullQuoteArea}>
          Fill quote-area ₹
        </Btn>
        <Btn variant="ghost" disabled={!team} onClick={() => void exportPdf()}>
          PDF
        </Btn>
        <Btn variant="ghost" disabled={!team} onClick={() => void exportXlsx()}>
          Excel
        </Btn>
      </Toolbar>
      {msg ? <p className="muted">{msg}</p> : null}

      {!team ? (
        <Card title="Get started">
          <p className="muted">Add a vendor team, then add labour names under the team leader.</p>
        </Card>
      ) : (
        <>
          <Card title="Vendor handle / team leader">
            <div className="grid grid-4">
              <Field label="Vendor name">
                <Input
                  value={team.vendorName}
                  onChange={(e) => updateTeam(team.id, { vendorName: e.target.value })}
                />
              </Field>
              <Field label="Handle" hint="Reopen / filter key">
                <Input
                  value={team.handle}
                  onChange={(e) => updateTeam(team.id, { handle: e.target.value })}
                />
              </Field>
              <Field label="Team leader">
                <Input
                  value={team.teamLeaderName}
                  onChange={(e) => updateTeam(team.id, { teamLeaderName: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={team.phone}
                  onChange={(e) => updateTeam(team.id, { phone: e.target.value })}
                />
              </Field>
              <Field label="Note">
                <Input
                  value={team.note}
                  onChange={(e) => updateTeam(team.id, { note: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          {summary ? (
            <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
              <Kpi label="Labour" value={summary.memberCount} />
              <Kpi label="Advances" value={<Money n={summary.advances} />} />
              <Kpi label="Quote area" value={<Money n={summary.quoteArea} />} />
              <Kpi label="Payable" value={<Money n={summary.payable} />} />
            </div>
          ) : null}

          <Card title="Labour under this vendor">
            {(summary?.members ?? []).length === 0 ? (
              <p className="muted">No labour yet — add names under this team leader.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {summary!.members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid var(--border, #d8dee6)',
                      borderRadius: 8,
                      padding: '0.75rem',
                    }}
                  >
                    <div className="grid grid-4">
                      <Field label="Name">
                        <Input
                          value={m.name}
                          onChange={(e) => updateLabour(m.id, { name: e.target.value })}
                        />
                      </Field>
                      <Field label="Role">
                        <Input
                          value={m.role}
                          onChange={(e) => updateLabour(m.id, { role: e.target.value })}
                        />
                      </Field>
                      <Field label="Work set">
                        <Input
                          value={m.workSet}
                          onChange={(e) => updateLabour(m.id, { workSet: e.target.value })}
                        />
                      </Field>
                      <Field label="Rate unit">
                        <Select
                          value={m.rateUnit}
                          onChange={(e) =>
                            updateLabour(m.id, { rateUnit: e.target.value as LabourRateUnit })
                          }
                        >
                          <option value="day">Day</option>
                          <option value="sqft">Sqft</option>
                          <option value="window">Window</option>
                          <option value="job">Job</option>
                        </Select>
                      </Field>
                      <Field label="Rate ₹">
                        <NumberInput
                          value={m.rate}
                          onCommit={(n) => updateLabour(m.id, { rate: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Units">
                        <NumberInput
                          value={m.units}
                          onCommit={(n) => updateLabour(m.id, { units: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Advance ₹">
                        <NumberInput
                          value={m.advance}
                          onCommit={(n) => updateLabour(m.id, { advance: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Extra payout ₹">
                        <NumberInput
                          value={m.extraPayout}
                          onCommit={(n) => updateLabour(m.id, { extraPayout: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Budget ₹">
                        <NumberInput
                          value={m.budget}
                          onCommit={(n) => updateLabour(m.id, { budget: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Quote area ₹">
                        <NumberInput
                          value={m.quoteAreaAmount}
                          onCommit={(n) => updateLabour(m.id, { quoteAreaAmount: n ?? 0 })}
                        />
                      </Field>
                      <Field label="Note">
                        <Input
                          value={m.note}
                          onChange={(e) => updateLabour(m.id, { note: e.target.value })}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-4" style={{ marginTop: '0.5rem' }}>
                      <Kpi label="Earned" value={<Money n={labourEarned(m)} />} />
                      <Kpi
                        label="Payable"
                        value={<Money n={labourPayable(m, summary!.payouts)} />}
                      />
                      <Kpi label="Budget left" value={<Money n={labourBudgetLeft(m)} />} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                        <Btn variant="ghost" onClick={() => addPayout(m.id)}>
                          + Payout line
                        </Btn>
                        <Btn variant="ghost" onClick={() => removeLabour(m.id)}>
                          Remove
                        </Btn>
                      </div>
                    </div>
                    {summary!.payouts
                      .filter((p) => p.labourId === m.id)
                      .map((p) => (
                        <div key={p.id} className="grid grid-4" style={{ marginTop: 8 }}>
                          <Field label="Date">
                            <Input
                              type="date"
                              value={p.date}
                              onChange={(e) => updatePayout(p.id, { date: e.target.value })}
                            />
                          </Field>
                          <Field label="Kind">
                            <Select
                              value={p.kind}
                              onChange={(e) =>
                                updatePayout(p.id, {
                                  kind: e.target.value as VendorLabourPayout['kind'],
                                })
                              }
                            >
                              <option value="advance">Advance</option>
                              <option value="payout">Payout</option>
                              <option value="extra">Extra</option>
                            </Select>
                          </Field>
                          <Field label="Amount ₹">
                            <NumberInput
                              value={p.amount}
                              onCommit={(n) => updatePayout(p.id, { amount: n ?? 0 })}
                            />
                          </Field>
                          <Field label="Note">
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Input
                                value={p.note}
                                onChange={(e) => updatePayout(p.id, { note: e.target.value })}
                              />
                              <Btn variant="ghost" onClick={() => removePayout(p.id)}>
                                ×
                              </Btn>
                            </div>
                          </Field>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
