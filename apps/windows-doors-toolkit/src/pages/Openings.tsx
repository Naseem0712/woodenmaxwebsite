import { v4 as uid } from 'uuid';
import { Btn, Card, Field, Input, Kpi, Money, Num, PageHeader, Select, Toolbar, NumberInput } from '../components/ui';
import { calcOpenings } from '../engine/calcs';
import { filterWindowTypes, projectMaterial } from '../engine/materialContext';
import { useApp } from '../store/AppContext';

export function OpeningsPage() {
  const { state, patch } = useApp();
  const calc = calcOpenings(state);
  const material = projectMaterial(state);
  const types = filterWindowTypes(state.windowTypes, material);

  const updateOpening = (id: string, key: string, value: string | number) => {
    patch(
      'openings',
      state.openings.map((o) => (o.id === id ? { ...o, [key]: value } : o)),
    );
  };

  return (
    <div>
      <PageHeader
        title="01 Window Sqft / Openings"
        subtitle={`Enter location, type, W×H×qty. Types filtered to project material (${material}) — UPVC and Aluminium never mix on one job.`}
        badge={material}
      />
      <Card title="Job & unit settings">
        <div className="grid grid-4">
          <Field label="Customer">
            <Input
              value={state.jobMeta.customerName}
              onChange={(e) => patch('jobMeta', { ...state.jobMeta, customerName: e.target.value })}
            />
          </Field>
          <Field label="Site">
            <Input
              value={state.jobMeta.siteAddress}
              onChange={(e) => patch('jobMeta', { ...state.jobMeta, siteAddress: e.target.value })}
            />
          </Field>
          <Field label="Size unit" hint="mm / inch / ft">
            <Select
              value={state.allowances.unit}
              onChange={(e) =>
                patch('allowances', {
                  ...state.allowances,
                  unit: e.target.value as 'mm' | 'inch' | 'ft',
                })
              }
            >
              <option value="mm">mm</option>
              <option value="inch">inch</option>
              <option value="ft">ft</option>
            </Select>
          </Field>
          <Field label="Min chargeable sqft / unit" tone="link" hint="From Settings → Allowances">
            <Input
              type="number"
              tone="link"
              value={state.allowances.minChargeableSqft}
              onChange={(e) =>
                patch('allowances', {
                  ...state.allowances,
                  minChargeableSqft: Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Actual sqft" value={<Num n={calc.totalActual} />} />
        <Kpi label="Chargeable sqft" value={<Num n={calc.totalChargeable} />} />
        <Kpi label="Windows" value={calc.totalWindows} />
        <Kpi label="Estimate" value={<Money n={calc.totalEstimate} />} />
      </div>

      <Card
        title="Openings schedule"
        actions={
          <Toolbar>
            <Btn
              onClick={() =>
                patch('openings', [
                  ...state.openings,
                  {
                    id: uid(),
                    location: '',
                    windowTypeId: types[0]?.id ?? '',
                    width: 1200,
                    height: 1200,
                    qty: 1,
                    tracks: types[0]?.kind === 'sliding' ? 2 : 0,
                    glassDoors: 2,
                    meshDoors: 0,
                    meshType: 'none' as const,
                    hasVent: 'No' as const,
                    ventCount: 0,
                  },
                ])
              }
            >
              + Add opening
            </Btn>
          </Toolbar>
        }
      >
        <div className="table-panel">
        <table className="data">
          <thead>
            <tr>
              <th>Location</th>
              <th>Type</th>
              <th>W</th>
              <th>H</th>
              <th>Qty</th>
              <th>Tracks</th>
              <th>Glass doors</th>
              <th>Mesh doors</th>
              <th>Mesh type</th>
              <th>Actual</th>
              <th>Chargeable</th>
              <th>Rate</th>
              <th>Estimate</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.line.id}>
                <td>
                  <input
                    value={r.line.location}
                    onChange={(e) => updateOpening(r.line.id, 'location', e.target.value)}
                  />
                </td>
                <td>
                  <select
                    value={r.line.windowTypeId}
                    onChange={(e) => updateOpening(r.line.id, 'windowTypeId', e.target.value)}
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
                    onChange={(e) => updateOpening(r.line.id, 'width', Number(e.target.value))}
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.line.height}
                    onChange={(e) => updateOpening(r.line.id, 'height', Number(e.target.value))}
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.line.qty}
                    onChange={(e) => updateOpening(r.line.id, 'qty', Number(e.target.value))}
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.line.tracks ?? 0}
                    onChange={(e) => updateOpening(r.line.id, 'tracks', Number(e.target.value))}
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.line.glassDoors ?? 0}
                    onChange={(e) => updateOpening(r.line.id, 'glassDoors', Number(e.target.value))}
                  />
                </td>
                <td>
                  <NumberInput
                    value={r.line.meshDoors ?? 0}
                    onChange={(e) => updateOpening(r.line.id, 'meshDoors', Number(e.target.value))}
                  />
                </td>
                <td>
                  <select
                    value={r.line.meshType ?? 'none'}
                    onChange={(e) => updateOpening(r.line.id, 'meshType', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="rolling">Rolling</option>
                    <option value="sliding">Sliding</option>
                    <option value="swing">Swing</option>
                    <option value="collapsible">Collapsible</option>
                    <option value="fixed">Fixed</option>
                    <option value="door-side">Door-side</option>
                  </select>
                </td>
                <td className="calc">
                  <Num n={r.actualSqft} />
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
                <td>
                  <Btn
                    variant="danger"
                    onClick={() => patch('openings', state.openings.filter((o) => o.id !== r.line.id))}
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
