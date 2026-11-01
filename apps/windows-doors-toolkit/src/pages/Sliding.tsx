import {
  CalcBox,
  Card,
  Field,
  Input,
  Money,
  Num,
  PageHeader,
  Select,
} from '../components/ui';
import { applySeriesToSliding, calcSliding } from '../engine/calcs';
import { projectMaterial, seriesForTool } from '../engine/materialContext';
import { useApp } from '../store/AppContext';

export function SlidingPage() {
  const { state, patch } = useApp();
  const job = state.sliding;
  const result = calcSliding(state);
  const material = projectMaterial(state);
  const seriesList = seriesForTool(state, 'sliding');

  const set = <K extends keyof typeof job>(key: K, value: (typeof job)[K]) => {
    patch('sliding', { ...job, [key]: value });
  };

  return (
    <div>
      <PageHeader
        title="02 Sliding Window"
        subtitle={`Project material: ${material}. Sliding series only — rollers/tracks. Casement and swing-door hardware stay on Tool 03.`}
        badge={material}
      />

      <Card title="Configuration (yellow = your inputs)">
        <div className="grid grid-4">
          <Field label="Series (Settings)" hint={`${material} · sliding / door`}>
            <Select
              value={job.seriesId}
              onChange={(e) => {
                const s = state.series.find((x) => x.id === e.target.value);
                if (s) patch('sliding', applySeriesToSliding(s, job));
              }}
            >
              {seriesList.length === 0 ? (
                <option value="">No {material} sliding series — add in Settings</option>
              ) : null}
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Material" hint="Locked to project" tone="link">
            <Input tone="link" readOnly value={material} />
          </Field>
          <Field label="Tracks">
            <Input type="number" value={job.tracks} onChange={(e) => set('tracks', Number(e.target.value))} />
          </Field>
          <Field label="Glass shutters">
            <Input
              type="number"
              value={job.glassShutters}
              onChange={(e) => set('glassShutters', Number(e.target.value))}
            />
          </Field>
          <Field label="Mesh shutter?">
            <Select value={job.mesh} onChange={(e) => set('mesh', e.target.value as 'Yes' | 'No')}>
              <option>No</option>
              <option>Yes</option>
            </Select>
          </Field>
          <Field label="Width W (mm)">
            <Input type="number" value={job.widthMm} onChange={(e) => set('widthMm', Number(e.target.value))} />
          </Field>
          <Field label="Height H (mm)">
            <Input type="number" value={job.heightMm} onChange={(e) => set('heightMm', Number(e.target.value))} />
          </Field>
          <Field label="Windows of this size">
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
          <Field label="Glass rate /sqft" tone="link" hint="Linked from glass master">
            <Input tone="link" readOnly value={result.glassRate} />
          </Field>
          <Field label="Glass inset each side (mm)">
            <Input
              type="number"
              value={job.glassInsetMm}
              onChange={(e) => set('glassInsetMm', Number(e.target.value))}
            />
          </Field>
          <Field label="Rollers per glass shutter">
            <Input
              type="number"
              value={job.rollersPerShutter}
              onChange={(e) => set('rollersPerShutter', Number(e.target.value))}
            />
          </Field>
          <Field label="Roller rate">
            <Input type="number" value={job.rollerRate} onChange={(e) => set('rollerRate', Number(e.target.value))} />
          </Field>
          <Field label="Lock and handle set">
            <Input
              type="number"
              value={job.lockHandleSet}
              onChange={(e) => set('lockHandleSet', Number(e.target.value))}
            />
          </Field>
          <Field label="Other hardware / window">
            <Input
              type="number"
              value={job.otherHardware}
              onChange={(e) => set('otherHardware', Number(e.target.value))}
            />
          </Field>
          <Field label="Wastage (profiles+glass)">
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
          <Field label="Round sqft price up to">
            <Input
              type="number"
              value={job.priceRoundUpStep}
              onChange={(e) => set('priceRoundUpStep', Number(e.target.value))}
            />
          </Field>
          <Field label="Your quoted rate /sqft">
            <Input
              type="number"
              value={job.quotedRatePerSqft}
              onChange={(e) => set('quotedRatePerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Fab labour /sqft">
            <Input
              type="number"
              value={job.fabricationLabourPerSqft}
              onChange={(e) => set('fabricationLabourPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Install labour /sqft">
            <Input
              type="number"
              value={job.installationLabourPerSqft}
              onChange={(e) => set('installationLabourPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Transport / job">
            <Input
              type="number"
              value={job.transportPerJob}
              onChange={(e) => set('transportPerJob', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <CalcBox label="Window sqft">
          <Num n={result.windowSqft} />
        </CalcBox>
        <CalcBox label="Profile + seals">
          <Money n={result.profileCost} />
        </CalcBox>
        <CalcBox label="Glass cost">
          <Money n={result.glassCost} />
        </CalcBox>
        <CalcBox label="Cost / window">
          <Money n={result.costPerWindow} />
        </CalcBox>
        <CalcBox label="Price /sqft @ margin">
          <Money n={result.pricePerSqft} />
        </CalcBox>
        <CalcBox label="Price / window">
          <Money n={result.pricePerWindow} />
        </CalcBox>
        <CalcBox label="Total all windows">
          <Money n={result.totalAll} />
        </CalcBox>
        <CalcBox label="Quoted rate status">
          <span className={result.quoteStatus === 'On target' ? 'success' : 'warn'}>
            {result.quoteStatus || '—'}
          </span>
        </CalcBox>
      </div>

      <Card title="Profile members (from series)">
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
