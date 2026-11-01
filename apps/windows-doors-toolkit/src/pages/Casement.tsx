import { CalcBox, Card, Field, Input, Money, Num, PageHeader, Select } from '../components/ui';
import { applySeriesToCasement, calcCasement } from '../engine/calcs';
import {
  ensureSeriesHardwareDefaults,
  frictionStayLabel,
  rateForSize,
} from '../engine/hardwareKind';
import { projectMaterial, seriesForTool } from '../engine/materialContext';
import { useApp } from '../store/AppContext';

export function CasementPage() {
  const { state, patch } = useApp();
  const job = state.casement;
  const result = calcCasement(state);
  const material = projectMaterial(state);
  const seriesList = seriesForTool(state, 'casement');
  const series = state.series.find((s) => s.id === job.seriesId);
  const seriesHw = series ? ensureSeriesHardwareDefaults(series) : undefined;
  const isDoor = series?.kind === 'door';

  const set = <K extends keyof typeof job>(key: K, value: (typeof job)[K]) => {
    patch('casement', { ...job, [key]: value });
  };

  return (
    <div>
      <PageHeader
        title="03 Casement Window"
        subtitle={`Project material: ${material}. Casement/door series only — friction stay, hinges, connectors. Never rollers or sliding locks.`}
        badge={material}
      />
      <Card title="Configuration">
        <div className="grid grid-4">
          <Field label="Series" hint={`${material} · casement / door`}>
            <Select
              value={job.seriesId}
              onChange={(e) => {
                const s = state.series.find((x) => x.id === e.target.value);
                if (s) patch('casement', applySeriesToCasement(s, job));
              }}
            >
              {seriesList.length === 0 ? (
                <option value="">No {material} casement series — add in Settings</option>
              ) : null}
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.kind})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Material" hint="Locked to project" tone="link">
            <Input tone="link" readOnly value={material} />
          </Field>
          <Field label="Panels (across width)">
            <Input type="number" value={job.panels} onChange={(e) => set('panels', Number(e.target.value))} />
          </Field>
          <Field label="Openable panels">
            <Input
              type="number"
              value={job.openablePanels}
              onChange={(e) => set('openablePanels', Number(e.target.value))}
            />
          </Field>
          {isDoor ? (
            <Field label="Door leaves" hint="Connectors use 4 pc × leaves">
              <Input
                type="number"
                value={job.doorLeaves || job.openablePanels}
                onChange={(e) => set('doorLeaves', Number(e.target.value))}
              />
            </Field>
          ) : null}
          <Field label="Mesh doors" hint="Door-side = leaf area; 0 = none">
            <Input
              type="number"
              value={job.meshDoors ?? 0}
              onChange={(e) => {
                const meshDoors = Math.max(0, Number(e.target.value));
                const meshType =
                  meshDoors === 0
                    ? 'none'
                    : job.meshType === 'none'
                      ? 'door-side'
                      : job.meshType;
                patch('casement', {
                  ...job,
                  meshDoors,
                  meshType,
                  mesh: meshDoors > 0 && meshType !== 'none' ? 'Yes' : 'No',
                });
              }}
            />
          </Field>
          <Field label="Mesh type">
            <Select
              value={job.meshType ?? 'none'}
              onChange={(e) => {
                const meshType = e.target.value as
                  | 'none'
                  | 'rolling'
                  | 'collapsible'
                  | 'fixed'
                  | 'door-side';
                const meshDoors =
                  meshType === 'none' ? 0 : Math.max(1, job.meshDoors || job.openablePanels || 1);
                patch('casement', {
                  ...job,
                  meshType,
                  meshDoors,
                  mesh: meshDoors > 0 && meshType !== 'none' ? 'Yes' : 'No',
                });
              }}
            >
              <option value="none">None</option>
              <option value="rolling">Rolling (full window)</option>
              <option value="collapsible">Collapsible (full window)</option>
              <option value="fixed">Fixed</option>
              <option value="door-side">Door-side</option>
            </Select>
          </Field>
          <Field label="Vent?" hint="Outer mesh often fixed on casement vents">
            <Select
              value={job.hasVent ?? 'No'}
              onChange={(e) => {
                const hasVent = e.target.value as 'Yes' | 'No';
                if (hasVent === 'Yes') {
                  const ventCount = Math.max(1, job.ventCount || job.openablePanels || 1);
                  patch('casement', {
                    ...job,
                    hasVent,
                    ventCount,
                    meshDoors: Math.max(job.meshDoors || 0, ventCount),
                    meshType: job.meshType === 'none' ? 'fixed' : job.meshType,
                    mesh: 'Yes',
                  });
                } else {
                  set('hasVent', 'No');
                }
              }}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>
          </Field>
          {(job.hasVent ?? 'No') === 'Yes' ? (
            <Field label="Vent count">
              <Input
                type="number"
                value={job.ventCount ?? 1}
                onChange={(e) => set('ventCount', Math.max(1, Number(e.target.value)))}
              />
            </Field>
          ) : null}
          <Field label="Width mm">
            <Input type="number" value={job.widthMm} onChange={(e) => set('widthMm', Number(e.target.value))} />
          </Field>
          <Field label="Height mm">
            <Input type="number" value={job.heightMm} onChange={(e) => set('heightMm', Number(e.target.value))} />
          </Field>
          <Field label="Qty">
            <Input type="number" value={job.qty} onChange={(e) => set('qty', Number(e.target.value))} />
          </Field>
          <Field label="Glass type">
            <Select value={job.glassTypeId} onChange={(e) => set('glassTypeId', e.target.value)}>
              {state.glassTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Glass rate" tone="link">
            <Input tone="link" readOnly value={result.glassRate} />
          </Field>
          <Field label="Inset mm">
            <Input type="number" value={job.glassInsetMm} onChange={(e) => set('glassInsetMm', Number(e.target.value))} />
          </Field>
        </div>
      </Card>

      <Card title="Casement hardware (no sliding rollers)">
        <div className="grid grid-4">
          <Field label="Friction stay size" hint="1 set = 2 pc per openable">
            <Select
              value={job.frictionStaySizeMm ?? seriesHw?.frictionStaySizeMm ?? 305}
              onChange={(e) => {
                const sizeMm = Number(e.target.value);
                const rate = rateForSize(
                  seriesHw?.frictionStayRates,
                  sizeMm,
                  job.frictionStayRate,
                );
                patch('casement', {
                  ...job,
                  frictionStaySizeMm: sizeMm,
                  frictionStayRate: rate,
                });
              }}
            >
              {(seriesHw?.frictionStayRates ?? []).map((r) => (
                <option key={r.sizeMm} value={r.sizeMm}>
                  {r.label ?? frictionStayLabel(r.sizeMm)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Friction stay ₹ / set" tone="link">
            <Input tone="link" readOnly value={job.frictionStayRate} />
          </Field>
          <Field label="Sets per openable">
            <Input
              type="number"
              value={job.frictionStaySetsPerOpenable ?? 1}
              onChange={(e) => set('frictionStaySetsPerOpenable', Number(e.target.value))}
            />
          </Field>
          <Field label="Handle ₹">
            <Input type="number" value={job.handleRate} onChange={(e) => set('handleRate', Number(e.target.value))} />
          </Field>
          <Field label="Hinge qty" hint="By weight need">
            <Input
              type="number"
              value={job.hingeQty ?? 0}
              onChange={(e) => set('hingeQty', Number(e.target.value))}
            />
          </Field>
          <Field label="Hinge ₹ / pc">
            <Input
              type="number"
              value={job.hingeRate ?? 0}
              onChange={(e) => set('hingeRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Door connector qty" hint="Usually 4 per door">
            <Input
              type="number"
              value={job.doorConnectorQty ?? 0}
              onChange={(e) => set('doorConnectorQty', Number(e.target.value))}
            />
          </Field>
          <Field label="Door connector ₹ / pc">
            <Input
              type="number"
              value={job.doorConnectorRate ?? 0}
              onChange={(e) => set('doorConnectorRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Lamination arm size">
            <Select
              value={job.laminationArmSizeMm ?? seriesHw?.laminationArmSizeMm ?? 200}
              onChange={(e) => {
                const sizeMm = Number(e.target.value);
                patch('casement', {
                  ...job,
                  laminationArmSizeMm: sizeMm,
                  laminationArmRate: rateForSize(seriesHw?.laminationArmRates, sizeMm, 0),
                });
              }}
            >
              {(seriesHw?.laminationArmRates ?? []).map((r) => (
                <option key={r.sizeMm} value={r.sizeMm}>
                  {r.label ?? `${r.sizeMm} mm`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lamination arm ₹" tone="link">
            <Input tone="link" readOnly value={job.laminationArmRate ?? 0} />
          </Field>
          <Field label="Lock guide ₹">
            <Input
              type="number"
              value={job.lockGuideRate ?? 0}
              onChange={(e) => set('lockGuideRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Brush ₹">
            <Input
              type="number"
              value={job.brushRate ?? 0}
              onChange={(e) => set('brushRate', Number(e.target.value))}
            />
          </Field>
          <Field label="EPDM ₹">
            <Input
              type="number"
              value={job.epdmRate ?? 0}
              onChange={(e) => set('epdmRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Lock ₹">
            <Input
              type="number"
              value={job.lockRate ?? 0}
              onChange={(e) => set('lockRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Other hardware">
            <Input
              type="number"
              value={job.otherHardware}
              onChange={(e) => set('otherHardware', Number(e.target.value))}
            />
          </Field>
          <Field label="Wastage">
            <Input type="number" step="0.01" value={job.wastage} onChange={(e) => set('wastage', Number(e.target.value))} />
          </Field>
          <Field label="Target margin">
            <Input
              type="number"
              step="0.01"
              value={job.targetMargin}
              onChange={(e) => set('targetMargin', Number(e.target.value))}
            />
          </Field>
          <Field label="Quoted ₹/sqft">
            <Input
              type="number"
              value={job.quotedRatePerSqft}
              onChange={(e) => set('quotedRatePerSqft', Number(e.target.value))}
            />
          </Field>
        </div>
        {isDoor ? (
          <div className="grid grid-4" style={{ marginTop: '0.75rem' }}>
            <Field label="Floor spring ₹">
              <Input
                type="number"
                value={job.floorSpringRate ?? 0}
                onChange={(e) => set('floorSpringRate', Number(e.target.value))}
              />
            </Field>
            <Field label="Door set ₹">
              <Input
                type="number"
                value={job.doorSetRate ?? 0}
                onChange={(e) => set('doorSetRate', Number(e.target.value))}
              />
            </Field>
            <Field label="Swing handle ₹">
              <Input
                type="number"
                value={job.swingHandleRate ?? 0}
                onChange={(e) => set('swingHandleRate', Number(e.target.value))}
              />
            </Field>
            <Field label="Swing lock ₹">
              <Input
                type="number"
                value={job.swingLockRate ?? 0}
                onChange={(e) => set('swingLockRate', Number(e.target.value))}
              />
            </Field>
            <Field label="Door closer ₹">
              <Input
                type="number"
                value={job.doorCloserRate ?? 0}
                onChange={(e) => set('doorCloserRate', Number(e.target.value))}
              />
            </Field>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <CalcBox label="Window sqft">
          <Num n={result.windowSqft} />
        </CalcBox>
        <CalcBox label="Profile cost">
          <Money n={result.profileCost} />
        </CalcBox>
        <CalcBox label="Hardware / window">
          <Money n={result.hardware} />
        </CalcBox>
        <CalcBox label="Cost / window">
          <Money n={result.costPerWindow} />
        </CalcBox>
        <CalcBox label="Price /sqft">
          <Money n={result.pricePerSqft} />
        </CalcBox>
        <CalcBox label="Total">
          <Money n={result.totalAll} />
        </CalcBox>
        <CalcBox label="Status">
          <span className={result.quoteStatus === 'On target' ? 'success' : 'warn'}>
            {result.quoteStatus || '—'}
          </span>
        </CalcBox>
      </div>

      <Card title="Members">
        <table className="data">
          <thead>
            <tr>
              <th>Member</th>
              <th>Class</th>
              <th>×W</th>
              <th>×H</th>
              <th>₹/m</th>
              <th>Count</th>
              <th>Metres</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {result.members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.memberClass}</td>
                <td className="link-cell">{m.wFactor}</td>
                <td className="link-cell">{m.hFactor}</td>
                <td className="link-cell">{m.ratePerM}</td>
                <td className="calc">{m.count}</td>
                <td className="calc">
                  <Num n={m.metres} />
                </td>
                <td className="calc">
                  <Money n={m.cost} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
