import { useMemo, useState } from 'react';
import { Btn, Card, Field, Input, Kpi, Money, NumberInput, PageHeader, Toolbar } from '../../components/ui';
import {
  activeCustomerMode,
  countVendorOverrides,
  exportSharedMaster,
  importSharedMaster,
  resolveEffectiveCatalogue,
  resolveVendorOverrides,
  seriesMemberKey,
  setVendorOverride,
} from '../../engine/masterCatalogue';
import { useApp } from '../../store/AppContext';
import { EMPTY_VENDOR_OVERRIDES, type SharedMasterSnapshot } from '../../types';

type Tab = 'window-types' | 'glass' | 'colours' | 'hardware' | 'profiles' | 'series';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsMasterCataloguePage() {
  const { state, setState, patch } = useApp();
  const [tab, setTab] = useState<Tab>('window-types');
  const [shareLabel, setShareLabel] = useState('Shared market rates');
  const mode = activeCustomerMode(state);
  const isVendor = mode === 'vendor';
  const ov = resolveVendorOverrides(state);
  const effective = resolveEffectiveCatalogue(state);
  const overrideCount = countVendorOverrides(ov);

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: 'window-types', label: 'Window types' },
      { id: 'glass', label: 'Glass' },
      { id: 'colours', label: 'Colours' },
      { id: 'hardware', label: 'Hardware' },
      { id: 'profiles', label: 'Profiles' },
      { id: 'series', label: 'Series members' },
    ],
    [],
  );

  const onExportShared = () => {
    downloadJson(
      `shared-master-${new Date().toISOString().slice(0, 10)}.json`,
      exportSharedMaster(state, shareLabel.trim() || 'Shared market rates'),
    );
  };

  const onImportShared = async (file: File | null) => {
    if (!file) return;
    const raw = await file.text();
    const snap = JSON.parse(raw) as Partial<SharedMasterSnapshot>;
    setState((s) => importSharedMaster(s, snap));
  };

  const clearAllOverrides = () => {
    patch('vendorOverrides', { ...EMPTY_VENDOR_OVERRIDES });
  };

  return (
    <div>
      <PageHeader
        title="Master catalogue"
        subtitle="Shared market/standard rates for profiles, types, glass, colours, hardware. Vendor mode can layer private overrides without rewriting the shared base."
        badge={isVendor ? 'Vendor overrides on' : 'Shared base'}
      />

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Window types" value={state.windowTypes.length} />
        <Kpi label="Glass / colours" value={`${state.glassTypes.length} / ${state.colourOptions.length}`} />
        <Kpi label="Hardware / profiles" value={`${state.hardware.length} / ${state.profiles.length}`} />
        <Kpi
          label="Vendor overrides"
          value={overrideCount}
          hint={isVendor ? 'Applied on read' : 'Idle until Vendor mode'}
        />
      </div>

      <Card
        title="Shareable shared-master layer"
        actions={
          <Toolbar>
            <Field label="Export label">
              <Input value={shareLabel} onChange={(e) => setShareLabel(e.target.value)} />
            </Field>
            <Btn variant="ghost" onClick={onExportShared}>
              Export shared JSON
            </Btn>
            <label className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              Import shared JSON
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  void onImportShared(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>
            {isVendor ? (
              <Btn variant="danger" onClick={clearAllOverrides} disabled={overrideCount === 0}>
                Clear my overrides
              </Btn>
            ) : null}
          </Toolbar>
        }
      >
        <p className="muted tiny">
          Export/import updates the shared Settings masters only — never job bags, and never vendor private
          overrides. Configurator and tools read shared rates; in <strong>Vendor</strong> mode they also apply
          your private overrides on top. No shop rates are hardcoded in formulas.
        </p>
        {!isVendor ? (
          <p className="tiny muted" style={{ marginTop: '0.5rem' }}>
            Switch project Mode to <strong>Vendor</strong> (after verification) to edit private override columns
            below. Shared ₹ columns edit the market base for everyone.
          </p>
        ) : (
          <p className="tiny success" style={{ marginTop: '0.5rem' }}>
            Vendor mode: effective rates = shared master + your overrides ({overrideCount} active).
          </p>
        )}
      </Card>

      <Card title="Catalogue rates">
        <div className="chip-row no-print" style={{ marginBottom: '0.75rem' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tab === t.id ? 'chip-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="table-panel">
          {tab === 'window-types' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Material</th>
                  <th>Kind</th>
                  <th>Shared ₹/sqft</th>
                  {isVendor ? <th>My override ₹/sqft</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.windowTypes.map((t) => {
                  const eff = effective.windowTypes.find((x) => x.id === t.id)?.ratePerSqft ?? t.ratePerSqft;
                  return (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.material}</td>
                      <td>{t.kind}</td>
                      <td>
                        <NumberInput
                          value={t.ratePerSqft}
                          onCommit={(n) =>
                            patch(
                              'windowTypes',
                              state.windowTypes.map((x) =>
                                x.id === t.id ? { ...x, ratePerSqft: n ?? x.ratePerSqft } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      {isVendor ? (
                        <td>
                          <NumberInput
                            value={ov.windowTypeRates[t.id] ?? ''}
                            emptyAs="null"
                            placeholder="—"
                            onCommit={(n) =>
                              patch(
                                'vendorOverrides',
                                setVendorOverride(ov, 'windowTypeRates', t.id, n),
                              )
                            }
                          />
                        </td>
                      ) : null}
                      {isVendor ? (
                        <td className="calc">
                          <Money n={eff} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {tab === 'glass' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Shared ₹/sqft</th>
                  {isVendor ? <th>My override</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.glassTypes.map((g) => {
                  const eff = effective.glassTypes.find((x) => x.id === g.id)?.ratePerSqft ?? g.ratePerSqft;
                  return (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>
                        <NumberInput
                          value={g.ratePerSqft}
                          onCommit={(n) =>
                            patch(
                              'glassTypes',
                              state.glassTypes.map((x) =>
                                x.id === g.id ? { ...x, ratePerSqft: n ?? x.ratePerSqft } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      {isVendor ? (
                        <td>
                          <NumberInput
                            value={ov.glassRates[g.id] ?? ''}
                            emptyAs="null"
                            placeholder="—"
                            onCommit={(n) =>
                              patch('vendorOverrides', setVendorOverride(ov, 'glassRates', g.id, n))
                            }
                          />
                        </td>
                      ) : null}
                      {isVendor ? (
                        <td className="calc">
                          <Money n={eff} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {tab === 'colours' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Material</th>
                  <th>Shared adj ₹/sqft</th>
                  {isVendor ? <th>My override</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.colourOptions.map((c) => {
                  const eff =
                    effective.colourOptions.find((x) => x.id === c.id)?.rateAdjPerSqft ?? c.rateAdjPerSqft;
                  return (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.material}</td>
                      <td>
                        <NumberInput
                          value={c.rateAdjPerSqft}
                          onCommit={(n) =>
                            patch(
                              'colourOptions',
                              state.colourOptions.map((x) =>
                                x.id === c.id ? { ...x, rateAdjPerSqft: n ?? x.rateAdjPerSqft } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      {isVendor ? (
                        <td>
                          <NumberInput
                            value={ov.colourAdjRates[c.id] ?? ''}
                            emptyAs="null"
                            placeholder="—"
                            onCommit={(n) =>
                              patch(
                                'vendorOverrides',
                                setVendorOverride(ov, 'colourAdjRates', c.id, n),
                              )
                            }
                          />
                        </td>
                      ) : null}
                      {isVendor ? (
                        <td className="calc">
                          <Money n={eff} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {tab === 'hardware' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Unit</th>
                  <th>Shared ₹</th>
                  {isVendor ? <th>My override</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.hardware.map((h) => {
                  const eff = effective.hardware.find((x) => x.id === h.id)?.rate ?? h.rate;
                  return (
                    <tr key={h.id}>
                      <td>{h.name}</td>
                      <td>{h.hardwareClass}</td>
                      <td>{h.unit}</td>
                      <td>
                        <NumberInput
                          value={h.rate}
                          onCommit={(n) =>
                            patch(
                              'hardware',
                              state.hardware.map((x) =>
                                x.id === h.id ? { ...x, rate: n ?? x.rate } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      {isVendor ? (
                        <td>
                          <NumberInput
                            value={ov.hardwareRates[h.id] ?? ''}
                            emptyAs="null"
                            placeholder="—"
                            onCommit={(n) =>
                              patch(
                                'vendorOverrides',
                                setVendorOverride(ov, 'hardwareRates', h.id, n),
                              )
                            }
                          />
                        </td>
                      ) : null}
                      {isVendor ? (
                        <td className="calc">
                          <Money n={eff} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {tab === 'profiles' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Material</th>
                  <th>Kind</th>
                  <th>Shared UPVC ₹/m</th>
                  {isVendor ? <th>My override ₹/m</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.profiles.map((p) => {
                  const eff =
                    effective.profiles.find((x) => x.id === p.id)?.ratePerMUpvc ?? p.ratePerMUpvc;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.material}</td>
                      <td>{p.kind}</td>
                      <td>
                        <NumberInput
                          value={p.ratePerMUpvc}
                          onCommit={(n) =>
                            patch(
                              'profiles',
                              state.profiles.map((x) =>
                                x.id === p.id ? { ...x, ratePerMUpvc: n ?? x.ratePerMUpvc } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      {isVendor ? (
                        <td>
                          <NumberInput
                            value={ov.profileRatePerMUpvc[p.id] ?? ''}
                            emptyAs="null"
                            placeholder="—"
                            onCommit={(n) =>
                              patch(
                                'vendorOverrides',
                                setVendorOverride(ov, 'profileRatePerMUpvc', p.id, n),
                              )
                            }
                          />
                        </td>
                      ) : null}
                      {isVendor ? (
                        <td className="calc">
                          <Money n={eff} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {tab === 'series' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Series</th>
                  <th>Member</th>
                  <th>Class</th>
                  <th>Shared ₹/m</th>
                  {isVendor ? <th>My override</th> : null}
                  {isVendor ? <th>Effective</th> : null}
                </tr>
              </thead>
              <tbody>
                {state.series.flatMap((s) =>
                  s.members.map((m) => {
                    const key = seriesMemberKey(s.id, m.id);
                    const effSeries = effective.series.find((x) => x.id === s.id);
                    const eff =
                      effSeries?.members.find((x) => x.id === m.id)?.ratePerM ?? m.ratePerM;
                    return (
                      <tr key={key}>
                        <td>
                          {s.name} ({s.material}/{s.kind})
                        </td>
                        <td>{m.name}</td>
                        <td>{m.memberClass}</td>
                        <td>
                          <NumberInput
                            value={m.ratePerM}
                            onCommit={(n) =>
                              patch(
                                'series',
                                state.series.map((ser) =>
                                  ser.id !== s.id
                                    ? ser
                                    : {
                                        ...ser,
                                        members: ser.members.map((mem) =>
                                          mem.id === m.id
                                            ? { ...mem, ratePerM: n ?? mem.ratePerM }
                                            : mem,
                                        ),
                                      },
                                ),
                              )
                            }
                          />
                        </td>
                        {isVendor ? (
                          <td>
                            <NumberInput
                              value={ov.seriesMemberRates[key] ?? ''}
                              emptyAs="null"
                              placeholder="—"
                              onCommit={(n) =>
                                patch(
                                  'vendorOverrides',
                                  setVendorOverride(ov, 'seriesMemberRates', key, n),
                                )
                              }
                            />
                          </td>
                        ) : null}
                        {isVendor ? (
                          <td className="calc">
                            <Money n={eff} />
                          </td>
                        ) : null}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
