import { CalcBox, Card, Field, Input, Money, Num, PageHeader, Select } from '../components/ui';
import { applySeriesToCasement, calcCasement } from '../engine/calcs';
import { useApp } from '../store/AppContext';

export function CasementPage() {
  const { state, patch } = useApp();
  const job = state.casement;
  const result = calcCasement(state);
  const seriesList = state.series.filter((s) => s.kind === 'casement' || s.kind === 'other');

  const set = <K extends keyof typeof job>(key: K, value: (typeof job)[K]) => {
    patch('casement', { ...job, [key]: value });
  };

  return (
    <div>
      <PageHeader
        title="03 Casement Window"
        subtitle="Series panels / openable rules drive member metres. Same cost stack as Excel Tool 03."
      />
      <Card title="Configuration">
        <div className="grid grid-4">
          <Field label="Series">
            <Select
              value={job.seriesId}
              onChange={(e) => {
                const s = state.series.find((x) => x.id === e.target.value);
                if (s) patch('casement', applySeriesToCasement(s, job));
              }}
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Material">
            <Select value={job.material} onChange={(e) => set('material', e.target.value as 'UPVC' | 'Aluminium')}>
              <option>UPVC</option>
              <option>Aluminium</option>
            </Select>
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
          <Field label="Mesh?">
            <Select value={job.mesh} onChange={(e) => set('mesh', e.target.value as 'Yes' | 'No')}>
              <option>No</option>
              <option>Yes</option>
            </Select>
          </Field>
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
          <Field label="Friction stay rate">
            <Input
              type="number"
              value={job.frictionStayRate}
              onChange={(e) => set('frictionStayRate', Number(e.target.value))}
            />
          </Field>
          <Field label="Handle rate">
            <Input type="number" value={job.handleRate} onChange={(e) => set('handleRate', Number(e.target.value))} />
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
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <CalcBox label="Window sqft">
          <Num n={result.windowSqft} />
        </CalcBox>
        <CalcBox label="Profile cost">
          <Money n={result.profileCost} />
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
