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
import { calcSiteMeasure } from '../engine/calcs';
import { activeProject, resolveLessOffMm, settingsLessOffForMaterial, withPersistedNet } from '../engine/lessOff';
import { filterProfiles, filterSeries, filterWindowTypes, projectMaterial } from '../engine/materialContext';
import { useApp } from '../store/AppContext';
import type { CutLine, SiteMeasureLine, Unit, YesNo } from '../types';

export function SiteMeasurePage() {
  const { state, patch, setState } = useApp();
  const calc = calcSiteMeasure(state);
  const a = state.allowances;
  const proj = activeProject(state);
  const material = projectMaterial(state);
  const types = filterWindowTypes(state.windowTypes, material);
  const defaults = resolveLessOffMm(state, null);
  const settingsLess = settingsLessOffForMaterial(state, material);

  const update = (id: string, patchLine: Partial<SiteMeasureLine>) => {
    patch(
      'siteMeasures',
      state.siteMeasures.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patchLine };
        return withPersistedNet(state, merged);
      }),
    );
  };

  const addLine = () => {
    const lead = state.leads[0];
    const wt = types[0];
    const width = 1200;
    const height = 1200;
    const draft: SiteMeasureLine = {
      id: uid(),
      measuredOn: new Date().toISOString().slice(0, 10),
      leadId: lead?.id ?? '',
      location: '',
      windowTypeId: wt?.id ?? '',
      width,
      height,
      unit: a.unit,
      qty: 1,
      ratePerSqft: wt?.ratePerSqft ?? 0,
      mesh: 'No',
      toughened: 'No',
      measuredBy: lead?.owner ?? '',
      lessOffWidthMm: null,
      lessOffHeightMm: null,
      netWidth: width,
      netHeight: height,
    };
    patch('siteMeasures', [...state.siteMeasures, withPersistedNet(state, draft)]);
  };

  const pushToOpenings = () => {
    const first = calc.rows[0];
    const lead = state.leads.find((l) => l.id === first?.line.leadId) ?? state.leads[0];
    // Openings / fab schedule uses net (fabrication) sizes
    const openings = state.siteMeasures.map((m) => {
      const netted = withPersistedNet(state, m);
      return {
        id: uid(),
        location: m.location,
        windowTypeId: m.windowTypeId,
        width: netted.netWidth,
        height: netted.netHeight,
        qty: m.qty,
      };
    });
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

  const pushToCutting = () => {
    const cuts: CutLine[] = [];
    const matSeries = filterSeries(state.series, material);
    const matProfiles = filterProfiles(state.profiles, material);
    for (const m of state.siteMeasures) {
      const netted = withPersistedNet(state, m);
      const seriesId =
        state.windowTypes.find((t) => t.id === m.windowTypeId)?.seriesId ??
        matSeries[0]?.id ??
        '';
      const profile =
        matProfiles.find((p) => p.name.toLowerCase().includes('frame')) ?? matProfiles[0];
      // W × 2 + H × 2 frame cuts from fab size
      cuts.push({
        id: uid(),
        windowLabel: m.location || 'Opening',
        profileId: profile?.id ?? '',
        cutMm: netted.netWidth,
        pieces: 2 * m.qty,
        seriesId,
        siteMeasureId: m.id,
      });
      cuts.push({
        id: uid(),
        windowLabel: m.location || 'Opening',
        profileId: profile?.id ?? '',
        cutMm: netted.netHeight,
        pieces: 2 * m.qty,
        seriesId,
        siteMeasureId: m.id,
      });
    }
    patch('cuts', cuts);
  };

  return (
    <div>
      <PageHeader
        title="Site Measurements"
        subtitle={`Record site W×H, apply less-off → net fab size. Types locked to project material (${material}).`}
        badge={material}
      />

      <Card title={`Less-off (site → fabrication) · ${material}`}>
        <div className="grid grid-4">
          <Field
            label={`Settings ${material} less-off W mm`}
            tone="link"
            hint="Settings → Allowances (per material)"
          >
            <NumberInput
              tone="link"
              value={settingsLess.widthMm}
              onCommit={(n) =>
                patch('allowances', {
                  ...a,
                  ...(material === 'Aluminium'
                    ? { lessOffAluWidthMm: n ?? a.lessOffAluWidthMm }
                    : { lessOffWidthMm: n ?? a.lessOffWidthMm }),
                })
              }
            />
          </Field>
          <Field label={`Settings ${material} less-off H mm`} tone="link">
            <NumberInput
              tone="link"
              value={settingsLess.heightMm}
              onCommit={(n) =>
                patch('allowances', {
                  ...a,
                  ...(material === 'Aluminium'
                    ? { lessOffAluHeightMm: n ?? a.lessOffAluHeightMm }
                    : { lessOffHeightMm: n ?? a.lessOffHeightMm }),
                })
              }
            />
          </Field>
          <Field
            label="Project less-off W mm"
            hint={proj?.lessOffWidthMm == null ? `Using Settings ${defaults.widthMm}` : 'Project override'}
          >
            <NumberInput
              value={proj?.lessOffWidthMm ?? ''}
              emptyAs="null"
              placeholder={`Settings ${defaults.widthMm}`}
              onCommit={(n) => {
                if (!proj) return;
                patch(
                  'projects',
                  state.projects.map((p) =>
                    p.id === proj.id ? { ...p, lessOffWidthMm: n } : p,
                  ),
                );
              }}
            />
          </Field>
          <Field
            label="Project less-off H mm"
            hint={proj?.lessOffHeightMm == null ? `Using Settings ${defaults.heightMm}` : 'Project override'}
          >
            <NumberInput
              value={proj?.lessOffHeightMm ?? ''}
              emptyAs="null"
              placeholder={`Settings ${defaults.heightMm}`}
              onCommit={(n) => {
                if (!proj) return;
                patch(
                  'projects',
                  state.projects.map((p) =>
                    p.id === proj.id ? { ...p, lessOffHeightMm: n } : p,
                  ),
                );
              }}
            />
          </Field>
        </div>
        <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
          Effective {material} default: <strong>{defaults.widthMm} × {defaults.heightMm} mm</strong>.
          Per-row Less W/H overrides. Empty project fields inherit Settings for this material.
        </p>
      </Card>

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
              <Link to="/openings">01 Openings</Link> · <Link to="/cutting">05 Cutting</Link> ·{' '}
              <Link to="/quote">08 Quote</Link>
            </span>
          }
          hint={calc.warnCount ? `${calc.warnCount} row(s) less-off &gt; site` : undefined}
        />
      </div>

      <Card
        title="Measured openings"
        actions={
          <Toolbar>
            <Btn onClick={addLine}>+ Add opening</Btn>
            <Btn variant="ghost" onClick={pushToOpenings} disabled={!state.siteMeasures.length}>
              Push net → 01 Openings + Quote
            </Btn>
            <Btn variant="ghost" onClick={pushToCutting} disabled={!state.siteMeasures.length}>
              Push net → 05 Cutting
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
                <th>Site W</th>
                <th>Site H</th>
                <th>Less W</th>
                <th>Less H</th>
                <th>Net W</th>
                <th>Net H</th>
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
                <tr key={r.line.id} className={r.warnNegative ? 'row-warn' : undefined}>
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
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.kind}: {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.width}
                      onCommit={(n) => update(r.line.id, { width: n ?? r.line.width })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.height}
                      onCommit={(n) => update(r.line.id, { height: n ?? r.line.height })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.lessOffWidthMm ?? ''}
                      emptyAs="null"
                      placeholder={String(r.lessWidthMm)}
                      title={`Effective ${r.lessWidthMm} mm`}
                      onCommit={(n) => update(r.line.id, { lessOffWidthMm: n })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.lessOffHeightMm ?? ''}
                      emptyAs="null"
                      placeholder={String(r.lessHeightMm)}
                      title={`Effective ${r.lessHeightMm} mm`}
                      onCommit={(n) => update(r.line.id, { lessOffHeightMm: n })}
                    />
                  </td>
                  <td className={`calc ${r.warnNegative ? 'warn' : ''}`}>
                    <Num n={r.netWidth} d={0} />
                    {r.warnNegative ? ' ⚠' : ''}
                  </td>
                  <td className={`calc ${r.warnNegative ? 'warn' : ''}`}>
                    <Num n={r.netHeight} d={0} />
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
                    <NumberInput
                      value={r.line.qty}
                      onCommit={(n) => update(r.line.id, { qty: n ?? r.line.qty })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.ratePerSqft}
                      onCommit={(n) => update(r.line.id, { ratePerSqft: n ?? r.line.ratePerSqft })}
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
