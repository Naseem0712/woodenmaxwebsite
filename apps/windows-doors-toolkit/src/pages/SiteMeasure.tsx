import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import { Btn, Card, Field, Input, Kpi, Money, Num, PageHeader, Toolbar } from '../components/ui';
import { calcSiteMeasure } from '../engine/calcs';
import { useApp } from '../store/AppContext';
import type { SiteMeasureLine, Unit, YesNo } from '../types';

export function SiteMeasurePage() {
  const { state, patch, setState } = useApp();
  const calc = calcSiteMeasure(state);
  const a = state.allowances;

  const update = (id: string, patchLine: Partial<SiteMeasureLine>) => {
    patch(
      'siteMeasures',
      state.siteMeasures.map((r) => (r.id === id ? { ...r, ...patchLine } : r)),
    );
  };

  const addLine = () => {
    const lead = state.leads[0];
    const wt = state.windowTypes[0];
    patch('siteMeasures', [
      ...state.siteMeasures,
      {
        id: uid(),
        measuredOn: new Date().toISOString().slice(0, 10),
        leadId: lead?.id ?? '',
        location: '',
        windowTypeId: wt?.id ?? '',
        width: 1200,
        height: 1200,
        unit: a.unit,
        qty: 1,
        ratePerSqft: wt?.ratePerSqft ?? 0,
        mesh: 'No',
        toughened: 'No',
        measuredBy: lead?.owner ?? '',
      },
    ]);
  };

  const pushToOpenings = () => {
    const first = calc.rows[0];
    const lead = state.leads.find((l) => l.id === first?.line.leadId) ?? state.leads[0];
    const openings = state.siteMeasures.map((m) => ({
      id: uid(),
      location: m.location,
      windowTypeId: m.windowTypeId,
      width: m.width,
      height: m.height,
      qty: m.qty,
    }));
    const unit = state.siteMeasures[0]?.unit ?? a.unit;
    setState((s) => ({
      ...s,
      openings,
      allowances: { ...s.allowances, unit },
      jobMeta: {
        ...s.jobMeta,
        customerName: lead?.name || s.jobMeta.customerName,
        siteAddress: lead?.addressNote || s.jobMeta.siteAddress,
        jobLabel: lead ? `${lead.leadNo} site measure` : s.jobMeta.jobLabel,
      },
      quote: {
        ...s.quote,
        customerName: lead?.name || s.quote.customerName,
        siteAddress: lead?.addressNote || s.quote.siteAddress,
        phone: lead?.phone || s.quote.phone,
      },
      leads: lead
        ? s.leads.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  status: l.status === 'Won' || l.status === 'Lost' ? l.status : 'Measured',
                  openingsCount: openings.reduce((n, o) => n + o.qty, 0),
                }
              : l,
          )
        : s.leads,
    }));
  };

  return (
    <div>
      <PageHeader
        title="Site Measurements"
        subtitle="Site visit: room / opening, W×H, unit, qty. Sqft + amount use Settings min sqft, mesh, toughened & install add-ons. Push → 01 Openings → 08 Quote."
        badge="Measure → Quote"
      />

      <Card title="Add-on rates (Settings)">
        <div className="grid grid-4">
          <Field label="Min chargeable sqft" tone="link" hint="Settings → Allowances">
            <Input
              tone="link"
              type="number"
              value={a.minChargeableSqft}
              onChange={(e) =>
                patch('allowances', { ...a, minChargeableSqft: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Mesh ₹/sqft" tone="link">
            <Input
              tone="link"
              type="number"
              value={a.meshPerSqft}
              onChange={(e) => patch('allowances', { ...a, meshPerSqft: Number(e.target.value) })}
            />
          </Field>
          <Field label="Toughened extra ₹/sqft" tone="link">
            <Input
              tone="link"
              type="number"
              value={a.toughenedExtraPerSqft}
              onChange={(e) =>
                patch('allowances', { ...a, toughenedExtraPerSqft: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Install ₹/sqft" tone="link">
            <Input
              tone="link"
              type="number"
              value={a.siteInstallPerSqft}
              onChange={(e) =>
                patch('allowances', { ...a, siteInstallPerSqft: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
          Window-type ₹/sqft seeds from <Link to="/settings/window-types">Settings → Window types</Link>.
          Edit per line if the site rate differs.
        </p>
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Openings (qty)" value={calc.totalQty} />
        <Kpi label="Chargeable sqft" value={<Num n={calc.totalSqft} />} />
        <Kpi label="Measured value" value={<Money n={calc.totalAmount} />} hint="before discount / GST" />
        <Kpi
          label="Next"
          value={
            <span className="tiny">
              <Link to="/openings">01 Openings</Link> · <Link to="/quote">08 Quote</Link>
            </span>
          }
        />
      </div>

      <Card
        title="Measured openings"
        actions={
          <Toolbar>
            <Btn onClick={addLine}>+ Add opening</Btn>
            <Btn variant="ghost" onClick={pushToOpenings} disabled={!state.siteMeasures.length}>
              Push to 01 Openings + Quote header
            </Btn>
          </Toolbar>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Lead</th>
                <th>Location</th>
                <th>Type</th>
                <th>W</th>
                <th>H</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>₹/sqft</th>
                <th>Mesh</th>
                <th>Tough.</th>
                <th>Sqft</th>
                <th>Amount</th>
                <th>By</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {calc.rows.map((r) => (
                <tr key={r.line.id}>
                  <td>
                    <input
                      type="date"
                      value={r.line.measuredOn}
                      onChange={(e) => update(r.line.id, { measuredOn: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={r.line.leadId}
                      onChange={(e) => update(r.line.id, { leadId: e.target.value })}
                    >
                      <option value="">—</option>
                      {state.leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.leadNo} · {l.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={r.line.location}
                      onChange={(e) => update(r.line.id, { location: e.target.value })}
                      placeholder="Bedroom window"
                    />
                  </td>
                  <td>
                    <select
                      value={r.line.windowTypeId}
                      onChange={(e) => {
                        const wt = state.windowTypes.find((t) => t.id === e.target.value);
                        update(r.line.id, {
                          windowTypeId: e.target.value,
                          ratePerSqft: wt?.ratePerSqft ?? r.line.ratePerSqft,
                        });
                      }}
                    >
                      {state.windowTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.line.width}
                      onChange={(e) => update(r.line.id, { width: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.line.height}
                      onChange={(e) => update(r.line.id, { height: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select
                      value={r.line.unit}
                      onChange={(e) => update(r.line.id, { unit: e.target.value as Unit })}
                    >
                      <option value="mm">mm</option>
                      <option value="inch">inch</option>
                      <option value="ft">ft</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.line.qty}
                      onChange={(e) => update(r.line.id, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.line.ratePerSqft}
                      onChange={(e) => update(r.line.id, { ratePerSqft: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select
                      value={r.line.mesh}
                      onChange={(e) => update(r.line.id, { mesh: e.target.value as YesNo })}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={r.line.toughened}
                      onChange={(e) => update(r.line.id, { toughened: e.target.value as YesNo })}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td className="calc">
                    <Num n={r.totalSqft} />
                  </td>
                  <td className="calc">
                    <Money n={r.amount} />
                  </td>
                  <td>
                    <input
                      value={r.line.measuredBy}
                      onChange={(e) => update(r.line.id, { measuredBy: e.target.value })}
                    />
                  </td>
                  <td>
                    <Btn
                      variant="danger"
                      onClick={() =>
                        patch(
                          'siteMeasures',
                          state.siteMeasures.filter((x) => x.id !== r.line.id),
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
        </div>
      </Card>
    </div>
  );
}
