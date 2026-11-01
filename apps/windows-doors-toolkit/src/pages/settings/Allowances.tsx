import { Card, Field, Input, PageHeader, Select } from '../../components/ui';
import type { Unit } from '../../types';
import { useApp } from '../../store/AppContext';

export function SettingsAllowancesPage() {
  const { state, patch } = useApp();
  const a = state.allowances;
  const set = <K extends keyof typeof a>(key: K, value: (typeof a)[K]) => {
    patch('allowances', { ...a, [key]: value });
  };

  return (
    <div>
      <PageHeader
        title="Allowances & shop defaults"
        subtitle="Min chargeable sqft, wastage, aluminium kg rates, glass round-up, labour defaults, and target margin."
      />
      <Card title="Openings & units">
        <div className="grid grid-4">
          <Field label="Default unit">
            <Select value={a.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
              <option value="mm">mm</option>
              <option value="inch">inch</option>
              <option value="ft">ft</option>
            </Select>
          </Field>
          <Field label="Min chargeable sqft / unit">
            <Input
              type="number"
              value={a.minChargeableSqft}
              onChange={(e) => set('minChargeableSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Default profile wastage (0–1)">
            <Input
              type="number"
              step="0.01"
              value={a.defaultProfileWastage}
              onChange={(e) => set('defaultProfileWastage', Number(e.target.value))}
            />
          </Field>
          <Field label="Target margin (0–1)">
            <Input
              type="number"
              step="0.01"
              value={a.defaultTargetMargin}
              onChange={(e) => set('defaultTargetMargin', Number(e.target.value))}
            />
          </Field>
          <Field label="Price round-up step ₹">
            <Input
              type="number"
              value={a.priceRoundUpStep}
              onChange={(e) => set('priceRoundUpStep', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
      <Card title="Cutting / aluminium">
        <div className="grid grid-4">
          <Field label="Saw allowance mm">
            <Input
              type="number"
              value={a.sawAllowanceMm}
              onChange={(e) => set('sawAllowanceMm', Number(e.target.value))}
            />
          </Field>
          <Field label="End trim mm (usable stock)">
            <Input type="number" value={a.endTrimMm} onChange={(e) => set('endTrimMm', Number(e.target.value))} />
          </Field>
          <Field label="Aluminium ₹/kg">
            <Input
              type="number"
              value={a.aluminiumRatePerKg}
              onChange={(e) => set('aluminiumRatePerKg', Number(e.target.value))}
            />
          </Field>
          <Field label="Coating ₹/kg">
            <Input
              type="number"
              value={a.coatingPerKg}
              onChange={(e) => set('coatingPerKg', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
      <Card title="Glass">
        <div className="grid grid-4">
          <Field label="Round-up inch step">
            <Input
              type="number"
              value={a.glassRoundUpInchStep}
              onChange={(e) => set('glassRoundUpInchStep', Number(e.target.value))}
            />
          </Field>
          <Field label="Min sqft / pane">
            <Input
              type="number"
              value={a.glassMinSqftPerPane}
              onChange={(e) => set('glassMinSqftPerPane', Number(e.target.value))}
            />
          </Field>
          <Field label="Glass wastage (0–1)">
            <Input
              type="number"
              step="0.01"
              value={a.glassWastage}
              onChange={(e) => set('glassWastage', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
      <Card title="Labour & transport defaults">
        <div className="grid grid-4">
          <Field label="Fab labour ₹/sqft">
            <Input
              type="number"
              value={a.fabricationLabourPerSqft}
              onChange={(e) => set('fabricationLabourPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Install labour ₹/sqft">
            <Input
              type="number"
              value={a.installationLabourPerSqft}
              onChange={(e) => set('installationLabourPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Transport ₹ / job">
            <Input
              type="number"
              value={a.transportPerJob}
              onChange={(e) => set('transportPerJob', Number(e.target.value))}
            />
          </Field>
          <Field label="Silicone ₹ / window">
            <Input
              type="number"
              value={a.siliconePerWindow}
              onChange={(e) => set('siliconePerWindow', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
      <Card title="Site measure add-ons (sample seeds)">
        <div className="grid grid-4">
          <Field label="Mesh ₹/sqft" hint="Added when Mesh = Yes">
            <Input
              type="number"
              value={a.meshPerSqft}
              onChange={(e) => set('meshPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Toughened extra ₹/sqft">
            <Input
              type="number"
              value={a.toughenedExtraPerSqft}
              onChange={(e) => set('toughenedExtraPerSqft', Number(e.target.value))}
            />
          </Field>
          <Field label="Site install ₹/sqft" hint="On measured amount">
            <Input
              type="number"
              value={a.siteInstallPerSqft}
              onChange={(e) => set('siteInstallPerSqft', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
