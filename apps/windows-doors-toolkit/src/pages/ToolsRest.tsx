import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import {
  Btn,
  Card,
  Field,
  Input,
  Kpi,
  Money,
  Num,
  NumberInput,
  PageHeader,
  Toolbar,
} from '../components/ui';
import {
  calcBuilder,
  calcCompare,
  calcCutting,
  calcDoors,
  calcGlassPanes,
  calcHardwareJob,
  calcLabour,
  calcMargin,
  calcMeshGrill,
  calcOpenings,
  calcQuote,
  calcRevisions,
  calcSliding,
  calcCasement,
  calcStock,
} from '../engine/calcs';
import {
  filterProfiles,
  filterSeries,
  filterWindowTypes,
  projectMaterial,
} from '../engine/materialContext';
import { useApp } from '../store/AppContext';
import { CUSTOMER_MODES, type StockIssue } from '../types';

export function DoorsPage() {
  const { state, patch } = useApp();
  const calc = calcDoors(state);
  return (
    <div>
      <PageHeader title="04 Door & Partition" subtitle="Line costing by size × ₹/sqft (glass type linked)." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <Kpi label="Lines" value={calc.rows.length} />
        <Kpi label="Total" value={<Money n={calc.total} />} />
      </div>
      <Card
        title="Door lines"
        actions={
          <Btn
            onClick={() =>
              patch('doors', [
                ...state.doors,
                {
                  id: uid(),
                  location: '',
                  doorType: 'Sliding door',
                  widthMm: 2100,
                  heightMm: 2100,
                  qty: 1,
                  glassTypeId: state.glassTypes[0]?.id ?? '',
                  ratePerSqft: 700,
                },
              ])
            }
          >
            + Add
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Location</th>
              <th>Type</th>
              <th>W</th>
              <th>H</th>
              <th>Qty</th>
              <th>Glass</th>
              <th>₹/sqft</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.location}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, location: e.target.value } : d)),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={r.doorType}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, doorType: e.target.value } : d)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.widthMm}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, widthMm: Number(e.target.value) } : d)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.heightMm}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, heightMm: Number(e.target.value) } : d)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.qty}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, qty: Number(e.target.value) } : d)),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={r.glassTypeId}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, glassTypeId: e.target.value } : d)),
                      )
                    }
                  >
                    {state.glassTypes.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={r.ratePerSqft}
                    onChange={(e) =>
                      patch(
                        'doors',
                        state.doors.map((d) => (d.id === r.id ? { ...d, ratePerSqft: Number(e.target.value) } : d)),
                      )
                    }
                  />
                </td>
                <td className="calc">
                  <Money n={r.amount} />
                </td>
                <td>
                  <Btn variant="danger" onClick={() => patch('doors', state.doors.filter((d) => d.id !== r.id))}>
                    Del
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function CuttingPage() {
  const { state, patch, setState } = useApp();
  const calc = calcCutting(state);
  const stockCalc = calcStock(state);
  const material = projectMaterial(state);
  const seriesOpts = filterSeries(state.series, material);
  const profileOpts = filterProfiles(state.profiles, material);

  const matchStockLine = (seriesId: string | undefined, profileName: string) => {
    if (!seriesId) return undefined;
    const rows = stockCalc.rows.filter((r) => r.seriesId === seriesId);
    const exact = rows.find(
      (r) => r.sectionName.toLowerCase() === profileName.toLowerCase(),
    );
    if (exact) return exact;
    const partial = rows.find(
      (r) =>
        profileName.toLowerCase().includes(r.sectionName.toLowerCase()) ||
        r.sectionName.toLowerCase().includes(profileName.toLowerCase().slice(0, 8)),
    );
    return partial ?? rows[0];
  };

  const deductFromStock = () => {
    const today = new Date().toISOString().slice(0, 10);
    const issues: StockIssue[] = [];
    for (const row of calc.rows) {
      const stock = matchStockLine(row.seriesId, row.profileName);
      if (!stock || row.metres <= 0) continue;
      issues.push({
        id: uid(),
        stockLineId: stock.id,
        projectId: state.activeProjectId,
        metres: row.metres,
        date: today,
        note: `Cutting: ${row.windowLabel || 'cut'} · ${row.profileName}`,
        source: 'cutting',
        cutLineId: row.id,
      });
    }
    if (!issues.length) {
      window.alert('No matching series stock rows found. Add sections under Stock for the cut series.');
      return;
    }
    setState((s) => ({
      ...s,
      stockIssues: [...s.stockIssues, ...issues],
      cuts: s.cuts.map((c) => {
        const iss = issues.find((i) => i.cutLineId === c.id);
        return iss ? { ...c, stockLineId: iss.stockLineId } : c;
      }),
    }));
  };

  return (
    <div>
      <PageHeader
        title="05 Cutting List"
        subtitle={`Cut sizes = fab (net) sizes. Series & profiles filtered to project material (${material}).`}
        badge={material}
      />
      <Card title="Allowances (Settings)">
        <div className="grid grid-4">
          <Field label="Saw allowance mm" tone="link">
            <Input
              tone="link"
              type="number"
              value={state.allowances.sawAllowanceMm}
              onChange={(e) =>
                patch('allowances', { ...state.allowances, sawAllowanceMm: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="End trim mm" tone="link">
            <Input
              tone="link"
              type="number"
              value={state.allowances.endTrimMm}
              onChange={(e) => patch('allowances', { ...state.allowances, endTrimMm: Number(e.target.value) })}
            />
          </Field>
          <Field label="Al ₹/kg" tone="link">
            <Input
              tone="link"
              type="number"
              value={state.allowances.aluminiumRatePerKg}
              onChange={(e) =>
                patch('allowances', { ...state.allowances, aluminiumRatePerKg: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Coating ₹/kg" tone="link">
            <Input
              tone="link"
              type="number"
              value={state.allowances.coatingPerKg}
              onChange={(e) =>
                patch('allowances', { ...state.allowances, coatingPerKg: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
          Prefer <Link to="/site-measure">Site Measure → Push net to Cutting</Link> so cut mm = fabrication size
          (site − less-off). Stock: <Link to="/stock">Series stock</Link>.
        </p>
      </Card>
      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Metres needed" value={<Num n={calc.totalMetres} />} />
        <Kpi label="Lengths to buy" value={calc.lengthsToBuy} />
        <Kpi label="Offcut m" value={<Num n={calc.offcutMetres} />} />
        <Kpi label="Profile cost" value={<Money n={calc.totalCost} />} />
      </div>
      <Card
        title="Cut lines"
        actions={
          <Toolbar>
            <Btn
              onClick={() =>
                patch('cuts', [
                  ...state.cuts,
                  {
                    id: uid(),
                    windowLabel: '',
                    profileId: profileOpts[0]?.id ?? '',
                    cutMm: 1000,
                    pieces: 1,
                    seriesId: seriesOpts[0]?.id,
                  },
                ])
              }
            >
              + Add cut
            </Btn>
            <Btn variant="ghost" onClick={deductFromStock} disabled={!state.cuts.length}>
              Deduct metres from series stock
            </Btn>
          </Toolbar>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Window</th>
              <th>Series</th>
              <th>Profile</th>
              <th>Cut mm</th>
              <th>Pcs</th>
              <th>Metres</th>
              <th>Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.windowLabel}
                    onChange={(e) =>
                      patch(
                        'cuts',
                        state.cuts.map((c) => (c.id === r.id ? { ...c, windowLabel: e.target.value } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={r.seriesId ?? ''}
                    onChange={(e) =>
                      patch(
                        'cuts',
                        state.cuts.map((c) =>
                          c.id === r.id ? { ...c, seriesId: e.target.value || undefined } : c,
                        ),
                      )
                    }
                  >
                    <option value="">—</option>
                    {seriesOpts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.kind}: {s.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={r.profileId}
                    onChange={(e) =>
                      patch(
                        'cuts',
                        state.cuts.map((c) => (c.id === r.id ? { ...c, profileId: e.target.value } : c)),
                      )
                    }
                  >
                    {profileOpts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={r.cutMm}
                    onCommit={(n) =>
                      patch(
                        'cuts',
                        state.cuts.map((c) => (c.id === r.id ? { ...c, cutMm: n ?? c.cutMm } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.pieces}
                    onCommit={(n) =>
                      patch(
                        'cuts',
                        state.cuts.map((c) => (c.id === r.id ? { ...c, pieces: n ?? c.pieces } : c)),
                      )
                    }
                  />
                </td>
                <td className="calc">
                  <Num n={r.metres} />
                </td>
                <td className="calc">
                  <Money n={r.cost} />
                </td>
                <td>
                  <Btn variant="danger" onClick={() => patch('cuts', state.cuts.filter((c) => c.id !== r.id))}>
                    Del
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Buy summary by profile">
        <table className="data">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Metres</th>
              <th>Lengths</th>
              <th>Offcut</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {calc.buyRows.map((r) => (
              <tr key={r.profileId}>
                <td>{r.name}</td>
                <td className="calc">
                  <Num n={r.metres} />
                </td>
                <td className="calc">{r.lengthsToBuy}</td>
                <td className="calc">
                  <Num n={r.offcut} />
                </td>
                <td className="calc">
                  <Money n={r.cost} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function GlassPage() {
  const { state, patch } = useApp();
  const calc = calcGlassPanes(state);
  return (
    <div>
      <PageHeader title="06 Glass Cost" subtitle="Pane W×H rounded to inch step; min sqft + wastage from Settings." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <Kpi label="Chargeable sqft" value={<Num n={calc.totalSqft} />} />
        <Kpi label="Glass cost" value={<Money n={calc.totalCost} />} />
        <Kpi label="Wastage %" value={`${(state.allowances.glassWastage * 100).toFixed(0)}%`} />
      </div>
      <Card
        title="Pane lines"
        actions={
          <Btn
            onClick={() =>
              patch('glassPanes', [
                ...state.glassPanes,
                {
                  id: uid(),
                  windowLabel: '',
                  glassTypeId: state.glassTypes[0]?.id ?? '',
                  widthMm: 700,
                  heightMm: 1100,
                  panes: 1,
                },
              ])
            }
          >
            + Add pane
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Window</th>
              <th>Glass</th>
              <th>W mm</th>
              <th>H mm</th>
              <th>Panes</th>
              <th>Round W″</th>
              <th>Round H″</th>
              <th>Sqft</th>
              <th>Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.windowLabel}
                    onChange={(e) =>
                      patch(
                        'glassPanes',
                        state.glassPanes.map((g) => (g.id === r.id ? { ...g, windowLabel: e.target.value } : g)),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={r.glassTypeId}
                    onChange={(e) =>
                      patch(
                        'glassPanes',
                        state.glassPanes.map((g) => (g.id === r.id ? { ...g, glassTypeId: e.target.value } : g)),
                      )
                    }
                  >
                    {state.glassTypes.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={r.widthMm}
                    onChange={(e) =>
                      patch(
                        'glassPanes',
                        state.glassPanes.map((g) => (g.id === r.id ? { ...g, widthMm: Number(e.target.value) } : g)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.heightMm}
                    onChange={(e) =>
                      patch(
                        'glassPanes',
                        state.glassPanes.map((g) => (g.id === r.id ? { ...g, heightMm: Number(e.target.value) } : g)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.panes}
                    onChange={(e) =>
                      patch(
                        'glassPanes',
                        state.glassPanes.map((g) => (g.id === r.id ? { ...g, panes: Number(e.target.value) } : g)),
                      )
                    }
                  />
                </td>
                <td className="calc">{r.wRound}</td>
                <td className="calc">{r.hRound}</td>
                <td className="calc">
                  <Num n={r.chargeable} />
                </td>
                <td className="calc">
                  <Money n={r.cost} />
                </td>
                <td>
                  <Btn
                    variant="danger"
                    onClick={() => patch('glassPanes', state.glassPanes.filter((g) => g.id !== r.id))}
                  >
                    Del
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function HardwarePage() {
  const { state, patch } = useApp();
  const calc = calcHardwareJob(state);
  const material = projectMaterial(state);
  const types = filterWindowTypes(state.windowTypes, material);
  return (
    <div>
      <PageHeader
        title="07 Hardware BOM"
        subtitle={`Window-type × hardware qty/window × openings qty. Types filtered to ${material}.`}
        badge={material}
      />
      <Kpi label="Job hardware total" value={<Money n={calc.total} />} />
      <Card
        title="BOM matrix"
        actions={
          <Btn
            onClick={() =>
              patch('hardwareBom', [
                ...state.hardwareBom,
                {
                  id: uid(),
                  windowTypeId: types[0]?.id ?? '',
                  hardwareItemId: state.hardware[0]?.id ?? '',
                  qtyPerWindow: 1,
                },
              ])
            }
          >
            + Add line
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Window type</th>
              <th>Hardware</th>
              <th>Qty/win</th>
              <th>Rate</th>
              <th>₹/win</th>
              <th>Job qty</th>
              <th>Job ₹</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <select
                    value={r.windowTypeId}
                    onChange={(e) =>
                      patch(
                        'hardwareBom',
                        state.hardwareBom.map((h) =>
                          h.id === r.id ? { ...h, windowTypeId: e.target.value } : h,
                        ),
                      )
                    }
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.kind}: {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={r.hardwareItemId}
                    onChange={(e) =>
                      patch(
                        'hardwareBom',
                        state.hardwareBom.map((h) =>
                          h.id === r.id ? { ...h, hardwareItemId: e.target.value } : h,
                        ),
                      )
                    }
                  >
                    {state.hardware.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={r.qtyPerWindow}
                    onChange={(e) =>
                      patch(
                        'hardwareBom',
                        state.hardwareBom.map((h) =>
                          h.id === r.id ? { ...h, qtyPerWindow: Number(e.target.value) } : h,
                        ),
                      )
                    }
                  />
                </td>
                <td className="link-cell">
                  <Num n={r.rate} d={0} />
                </td>
                <td className="calc">
                  <Money n={r.perWindowCost} />
                </td>
                <td className="calc">{r.windows}</td>
                <td className="calc">
                  <Money n={r.jobCost} />
                </td>
                <td>
                  <Btn
                    variant="danger"
                    onClick={() => patch('hardwareBom', state.hardwareBom.filter((h) => h.id !== r.id))}
                  >
                    Del
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function QuotePage() {
  const { state, patch } = useApp();
  const q = calcQuote(state);
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const customerMode = project?.customerMode ?? 'home-owner';
  const modeLabel = CUSTOMER_MODES.find((m) => m.id === customerMode)?.label ?? 'Home owner';
  const architectMode = customerMode === 'architects';
  const scheduleLabel = architectMode ? 'Openings schedule (fab sizes)' : 'Window schedule';
  const syncFromJob = () => {
    patch('quote', {
      ...state.quote,
      customerName: state.jobMeta.customerName || state.quote.customerName,
      siteAddress: state.jobMeta.siteAddress || state.quote.siteAddress,
    });
  };
  return (
    <div>
      <PageHeader
        title="08 Quotation"
        subtitle={`Schedule from 01 Openings (+ mesh/grill). Mode: ${modeLabel} — labels only; rates stay in Settings.`}
        badge={modeLabel}
      />
      <Card
        title="Quote header"
        actions={
          <Toolbar>
            <Btn variant="ghost" onClick={syncFromJob}>
              Sync customer from job
            </Btn>
            <Btn variant="ghost" onClick={() => window.print()}>
              Print quote
            </Btn>
          </Toolbar>
        }
      >
        <div className="grid grid-4 no-print">
          <Field label="Customer mode" hint="From project bar — not a rate card" tone="link">
            <Input tone="link" readOnly value={modeLabel} />
          </Field>
          <Field label="Quote no">
            <Input
              value={state.quote.quoteNo}
              onChange={(e) => patch('quote', { ...state.quote, quoteNo: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={state.quote.quoteDate}
              onChange={(e) => patch('quote', { ...state.quote, quoteDate: e.target.value })}
            />
          </Field>
          <Field label="Valid days">
            <Input
              type="number"
              value={state.quote.validDays}
              onChange={(e) => patch('quote', { ...state.quote, validDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Valid till" tone="calc">
            <Input tone="calc" readOnly value={q.validTill || '—'} />
          </Field>
          <Field label="Customer">
            <Input
              value={state.quote.customerName}
              onChange={(e) => patch('quote', { ...state.quote, customerName: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={state.quote.phone}
              onChange={(e) => patch('quote', { ...state.quote, phone: e.target.value })}
            />
          </Field>
          <Field label="Site">
            <Input
              value={state.quote.siteAddress}
              onChange={(e) => patch('quote', { ...state.quote, siteAddress: e.target.value })}
            />
          </Field>
          <Field label="Discount ₹">
            <Input
              type="number"
              value={state.quote.discountAmount}
              onChange={(e) => patch('quote', { ...state.quote, discountAmount: Number(e.target.value) })}
            />
          </Field>
          <Field label="Advance %" hint="If > 0, overrides Advance ₹">
            <Input
              type="number"
              value={state.quote.advancePercent}
              onChange={(e) =>
                patch('quote', { ...state.quote, advancePercent: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Advance ₹" hint={state.quote.advancePercent > 0 ? 'From %' : 'Manual'}>
            <Input
              type="number"
              value={state.quote.advancePercent > 0 ? q.advance : state.quote.advanceAmount}
              onChange={(e) =>
                patch('quote', {
                  ...state.quote,
                  advancePercent: 0,
                  advanceAmount: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Company" tone="link">
            <Input tone="link" readOnly value={state.business.companyName} />
          </Field>
          <Field label="GST" tone="link">
            <Input
              tone="link"
              readOnly
              value={state.business.gstEnabled ? `${state.business.gstPercent}%` : 'Off'}
            />
          </Field>
        </div>
        <Field label="Notes">
          <Input
            value={state.quote.notes}
            onChange={(e) => patch('quote', { ...state.quote, notes: e.target.value })}
          />
        </Field>
      </Card>

      <div className="quote-print" id="quote-print">
        <div className="quote-letterhead">
          <div>
            <h2>{state.business.companyName}</h2>
            <p className="muted tiny">
              {state.business.address}
              {state.business.phone ? ` · ${state.business.phone}` : ''}
              {state.business.email ? ` · ${state.business.email}` : ''}
              {state.business.gstin ? ` · GSTIN ${state.business.gstin}` : ''}
            </p>
          </div>
          <div className="quote-meta">
            <strong>Quotation</strong>
            <div>
              {state.quote.quoteNo} · {state.quote.quoteDate}
            </div>
            <div className="tiny muted">Valid till {q.validTill || '—'}</div>
          </div>
        </div>
        <div className="quote-party grid grid-2">
          <div>
            <div className="tiny muted">{architectMode ? 'Client' : 'Customer'}</div>
            <strong>{state.quote.customerName || '—'}</strong>
            <div className="tiny">{state.quote.phone}</div>
            <div className="tiny muted">Mode: {modeLabel}</div>
          </div>
          <div>
            <div className="tiny muted">{architectMode ? 'Site / project' : 'Site'}</div>
            <strong>{state.quote.siteAddress || '—'}</strong>
            {architectMode ? (
              <div className="tiny muted">Material: {project?.material ?? '—'}</div>
            ) : null}
          </div>
        </div>

        <Card title={scheduleLabel}>
          <table className="data">
            <thead>
              <tr>
                <th>Location</th>
                <th>{architectMode ? 'Series / type' : 'Type'}</th>
                <th>{architectMode ? 'Size (mm)' : 'Size'}</th>
                <th>Chargeable</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {q.openings.rows.map((r) => (
                <tr key={r.line.id}>
                  <td className="link-cell">{r.line.location}</td>
                  <td className="link-cell">{r.typeName}</td>
                  <td className="link-cell">
                    {r.line.width} × {r.line.height} {state.allowances.unit}
                  </td>
                  <td className="calc">
                    <Num n={r.chargeableSqft} />
                  </td>
                  <td className="link-cell">
                    <Num n={r.rate} d={0} />
                  </td>
                  <td className="calc">
                    <Money n={r.estimate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid grid-4">
          <Kpi label="Windows" value={<Money n={q.windowsSubtotal} />} />
          <Kpi label="Mesh + grill" value={<Money n={q.mesh.total} />} />
          <Kpi label="Site measured (ref)" value={<Money n={q.measuredValue} />} hint="from Site Measure" />
          <Kpi label="After discount" value={<Money n={q.afterDiscount} />} />
          <Kpi label="GST" value={<Money n={q.gst} />} />
          <Kpi label="Grand total" value={<Money n={q.grand} />} />
          <Kpi label="Advance" value={<Money n={q.advance} />} />
          <Kpi label="Balance" value={<Money n={q.balance} />} />
        </div>

        <p className="muted tiny" style={{ marginTop: '0.75rem' }}>
          {state.quote.notes}
          {state.business.warrantyNote ? ` · ${state.business.warrantyNote}` : ''}
        </p>
      </div>
    </div>
  );
}

export function ComparePage() {
  const { state, patch } = useApp();
  const calc = calcCompare(state);
  return (
    <div>
      <PageHeader title="09 UPVC vs Aluminium" subtitle="Side-by-side option compare using type rates." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <Kpi label="UPVC total" value={<Money n={calc.upvcTotal} />} />
        <Kpi label="Aluminium total" value={<Money n={calc.aluTotal} />} />
        <Kpi label="Difference" value={<Money n={calc.upvcTotal - calc.aluTotal} />} />
      </div>
      <Card title="Compare lines">
        <table className="data">
          <thead>
            <tr>
              <th>Location</th>
              <th>W</th>
              <th>H</th>
              <th>Qty</th>
              <th>UPVC type</th>
              <th>Alu type</th>
              <th>UPVC ₹</th>
              <th>Alu ₹</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.location}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, location: e.target.value } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.widthMm}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, widthMm: Number(e.target.value) } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.heightMm}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, heightMm: Number(e.target.value) } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.qty}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, qty: Number(e.target.value) } : c)),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={r.upvcTypeId}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, upvcTypeId: e.target.value } : c)),
                      )
                    }
                  >
                    {state.windowTypes
                      .filter((t) => t.material === 'UPVC')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <select
                    value={r.aluTypeId}
                    onChange={(e) =>
                      patch(
                        'compare',
                        state.compare.map((c) => (c.id === r.id ? { ...c, aluTypeId: e.target.value } : c)),
                      )
                    }
                  >
                    {state.windowTypes
                      .filter((t) => t.material === 'Aluminium')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td className="calc">
                  <Money n={r.upvcAmt} />
                </td>
                <td className="calc">
                  <Money n={r.aluAmt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function MarginPage() {
  const { state, patch } = useApp();
  const m = calcMargin(state);
  return (
    <div>
      <PageHeader title="10 Price & Margin" subtitle="Cost stack from cutting/glass/hardware/mesh/labour vs quote amount." />
      <Card title="Extras">
        <div className="grid grid-3">
          <Field label="Commission %">
            <Input
              type="number"
              value={state.marginExtras.commissionPercent}
              onChange={(e) =>
                patch('marginExtras', {
                  ...state.marginExtras,
                  commissionPercent: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Other fees ₹">
            <Input
              type="number"
              value={state.marginExtras.otherFees}
              onChange={(e) =>
                patch('marginExtras', { ...state.marginExtras, otherFees: Number(e.target.value) })
              }
            />
          </Field>
        </div>
      </Card>
      <div className="grid grid-4">
        <Kpi label="Quoted (after discount)" value={<Money n={m.quoteAmount} />} />
        <Kpi label="Profiles (05)" value={<Money n={m.profileCost} />} />
        <Kpi label="Glass (06)" value={<Money n={m.glassCost} />} />
        <Kpi label="Hardware (07)" value={<Money n={m.hardwareCost} />} />
        <Kpi label="Mesh/Grill (11)" value={<Money n={m.meshCost} />} />
        <Kpi label="Labour (12)" value={<Money n={m.labourCost} />} />
        <Kpi label="Transport + fees" value={<Money n={m.transport + m.other + m.commission} />} />
        <Kpi label="Total cost" value={<Money n={m.totalCost} />} />
        <Kpi label="Profit" value={<Money n={m.profit} />} hint={`${(m.marginPct * 100).toFixed(1)}%`} />
        <Kpi label="Target price" value={<Money n={m.targetPrice} />} hint="At Settings margin" />
      </div>
    </div>
  );
}

export function MeshPage() {
  const { state, patch } = useApp();
  const calc = calcMeshGrill(state);
  return (
    <div>
      <PageHeader title="11 Mesh & Grill" subtitle="Add-on lines feeding quotation and margin." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <Kpi label="Mesh" value={<Money n={calc.mesh} />} />
        <Kpi label="Grill" value={<Money n={calc.grill} />} />
        <Kpi label="Total" value={<Money n={calc.total} />} />
      </div>
      <Card
        title="Lines"
        actions={
          <Btn
            onClick={() =>
              patch('meshGrill', [
                ...state.meshGrill,
                {
                  id: uid(),
                  kind: 'mesh',
                  location: '',
                  widthMm: 1200,
                  heightMm: 1200,
                  qty: 1,
                  ratePerSqft: 40,
                },
              ])
            }
          >
            + Add
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Location</th>
              <th>W</th>
              <th>H</th>
              <th>Qty</th>
              <th>₹/sqft</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <select
                    value={r.kind}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) =>
                          m.id === r.id ? { ...m, kind: e.target.value as 'mesh' | 'grill' } : m,
                        ),
                      )
                    }
                  >
                    <option value="mesh">mesh</option>
                    <option value="grill">grill</option>
                  </select>
                </td>
                <td>
                  <input
                    value={r.location}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) => (m.id === r.id ? { ...m, location: e.target.value } : m)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.widthMm}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) =>
                          m.id === r.id ? { ...m, widthMm: Number(e.target.value) } : m,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.heightMm}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) =>
                          m.id === r.id ? { ...m, heightMm: Number(e.target.value) } : m,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.qty}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) => (m.id === r.id ? { ...m, qty: Number(e.target.value) } : m)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.ratePerSqft}
                    onChange={(e) =>
                      patch(
                        'meshGrill',
                        state.meshGrill.map((m) =>
                          m.id === r.id ? { ...m, ratePerSqft: Number(e.target.value) } : m,
                        ),
                      )
                    }
                  />
                </td>
                <td className="calc">
                  <Money n={r.amount} />
                </td>
                <td>
                  <Btn
                    variant="danger"
                    onClick={() => patch('meshGrill', state.meshGrill.filter((m) => m.id !== r.id))}
                  >
                    Del
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function LabourPage() {
  const { state, patch } = useApp();
  const calc = calcLabour(state);
  return (
    <div>
      <PageHeader title="12 Labour & Install" subtitle="Fab + install vs job sqft / window counts from openings." />
      <Card title="Rates">
        <div className="grid grid-4">
          <Field label="Fab ₹/sqft">
            <Input
              type="number"
              value={state.labour.fabPerSqft}
              onChange={(e) => patch('labour', { ...state.labour, fabPerSqft: Number(e.target.value) })}
            />
          </Field>
          <Field label="Install ₹/sqft">
            <Input
              type="number"
              value={state.labour.installPerSqft}
              onChange={(e) => patch('labour', { ...state.labour, installPerSqft: Number(e.target.value) })}
            />
          </Field>
          <Field label="Fab ₹/window">
            <Input
              type="number"
              value={state.labour.fabPerWindow}
              onChange={(e) => patch('labour', { ...state.labour, fabPerWindow: Number(e.target.value) })}
            />
          </Field>
          <Field label="Install ₹/window">
            <Input
              type="number"
              value={state.labour.installPerWindow}
              onChange={(e) =>
                patch('labour', { ...state.labour, installPerWindow: Number(e.target.value) })
              }
            />
          </Field>
        </div>
      </Card>
      <div className="grid grid-4">
        <Kpi label="Job sqft" value={<Num n={calc.openings.totalActual} />} />
        <Kpi label="Windows" value={calc.openings.totalWindows} />
        <Kpi label="Fabrication" value={<Money n={calc.fab} />} />
        <Kpi label="Installation" value={<Money n={calc.install} />} />
        <Kpi label="Total labour" value={<Money n={calc.total} />} />
      </div>
    </div>
  );
}

export function BuilderPage() {
  const { state, patch } = useApp();
  const calc = calcBuilder(state);
  const material = projectMaterial(state);
  const types = filterWindowTypes(state.windowTypes, material);
  return (
    <div>
      <PageHeader
        title="13 Builder Project"
        subtitle={`Bulk estimator: qty/flat × flats × type rate. Types = ${material} only.`}
        badge={material}
      />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <Kpi label="Total sqft" value={<Num n={calc.totalSqft} />} />
        <Kpi label="Estimate" value={<Money n={calc.totalAmount} />} />
      </div>
      <Card
        title="Blocks"
        actions={
          <Btn
            onClick={() =>
              patch('builder', [
                ...state.builder,
                {
                  id: uid(),
                  block: 'Block',
                  windowTypeId: types[0]?.id ?? '',
                  widthMm: 1500,
                  heightMm: 1200,
                  qtyPerFlat: 1,
                  flats: 10,
                },
              ])
            }
          >
            + Add
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Block</th>
              <th>Type</th>
              <th>W</th>
              <th>H</th>
              <th>/flat</th>
              <th>Flats</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.block}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) => (b.id === r.id ? { ...b, block: e.target.value } : b)),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={r.windowTypeId}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) => (b.id === r.id ? { ...b, windowTypeId: e.target.value } : b)),
                      )
                    }
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.kind}: {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={r.widthMm}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) => (b.id === r.id ? { ...b, widthMm: Number(e.target.value) } : b)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.heightMm}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) =>
                          b.id === r.id ? { ...b, heightMm: Number(e.target.value) } : b,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.qtyPerFlat}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) =>
                          b.id === r.id ? { ...b, qtyPerFlat: Number(e.target.value) } : b,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.flats}
                    onChange={(e) =>
                      patch(
                        'builder',
                        state.builder.map((b) => (b.id === r.id ? { ...b, flats: Number(e.target.value) } : b)),
                      )
                    }
                  />
                </td>
                <td className="calc">{r.totalQty}</td>
                <td className="calc">
                  <Money n={r.amount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function RevisionPage() {
  const { state, patch } = useApp();
  const calc = calcRevisions(state);
  return (
    <div>
      <PageHeader title="14 Price Revision" subtitle="Weighted impact of input-cost changes on selling price." />
      <Kpi
        label="Blended cost impact"
        value={`${(calc.blendedImpact * 100).toFixed(2)}%`}
        hint="Raise quote roughly by this %"
      />
      <Card title="Cost inputs">
        <table className="data">
          <thead>
            <tr>
              <th>Item</th>
              <th>Old</th>
              <th>New</th>
              <th>Weight %</th>
              <th>Δ %</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.item}
                    onChange={(e) =>
                      patch(
                        'revisions',
                        state.revisions.map((x) => (x.id === r.id ? { ...x, item: e.target.value } : x)),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.oldRate}
                    onChange={(e) =>
                      patch(
                        'revisions',
                        state.revisions.map((x) =>
                          x.id === r.id ? { ...x, oldRate: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.newRate}
                    onChange={(e) =>
                      patch(
                        'revisions',
                        state.revisions.map((x) =>
                          x.id === r.id ? { ...x, newRate: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.weightPercent}
                    onChange={(e) =>
                      patch(
                        'revisions',
                        state.revisions.map((x) =>
                          x.id === r.id ? { ...x, weightPercent: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td className="calc">{(r.deltaPct * 100).toFixed(1)}%</td>
                <td className="calc">{(r.impact * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const { state } = useApp();
  const openings = calcOpenings(state);
  const quote = calcQuote(state);
  const margin = calcMargin(state);
  const sliding = calcSliding(state);
  const casement = calcCasement(state);
  const cutting = calcCutting(state);
  const glass = calcGlassPanes(state);
  const hw = calcHardwareJob(state);
  return (
    <div>
      <PageHeader title="15 Dashboard" subtitle="Cross-tool KPI rollup for the current job + masters." />
      <div className="grid grid-4">
        <Kpi label="Openings estimate" value={<Money n={openings.totalEstimate} />} />
        <Kpi label="Chargeable sqft" value={<Num n={openings.totalChargeable} />} />
        <Kpi label="Quote (ex-GST)" value={<Money n={quote.afterDiscount} />} />
        <Kpi label="Quote grand" value={<Money n={quote.grand} />} />
        <Kpi label="Total cost stack" value={<Money n={margin.totalCost} />} />
        <Kpi label="Profit" value={<Money n={margin.profit} />} />
        <Kpi label="Margin %" value={`${(margin.marginPct * 100).toFixed(1)}%`} />
        <Kpi label="Sliding demo" value={<Money n={sliding.totalAll} />} />
        <Kpi label="Casement demo" value={<Money n={casement.totalAll} />} />
        <Kpi label="Cutting ₹" value={<Money n={cutting.totalCost} />} />
        <Kpi label="Glass ₹" value={<Money n={glass.totalCost} />} />
        <Kpi label="Hardware ₹" value={<Money n={hw.total} />} />
        <Kpi label="Series count" value={state.series.length} />
        <Kpi label="Window types" value={state.windowTypes.length} />
        <Kpi label="Glass types" value={state.glassTypes.length} />
        <Kpi label="Hardware SKUs" value={state.hardware.length} />
      </div>
    </div>
  );
}
