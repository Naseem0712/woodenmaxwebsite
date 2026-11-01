import { Card, Field, Input, PageHeader, Select } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function SettingsBusinessPage() {
  const { state, patch } = useApp();
  const b = state.business;
  const set = <K extends keyof typeof b>(key: K, value: (typeof b)[K]) => {
    patch('business', { ...b, [key]: value });
  };

  return (
    <div>
      <PageHeader
        title="Business / GST"
        subtitle="Company block used on quotations. GST % applies when GST is enabled."
      />
      <Card title="Company">
        <div className="grid grid-2">
          <Field label="Company name">
            <Input value={b.companyName} onChange={(e) => set('companyName', e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={b.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={b.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="GSTIN">
            <Input value={b.gstin} onChange={(e) => set('gstin', e.target.value)} />
          </Field>
          <Field label="Address" hint="Shown on quote header">
            <Input value={b.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Warranty note">
            <Input value={b.warrantyNote} onChange={(e) => set('warrantyNote', e.target.value)} />
          </Field>
        </div>
      </Card>
      <Card title="GST">
        <div className="grid grid-3">
          <Field label="GST on quote?">
            <Select
              value={b.gstEnabled ? 'Yes' : 'No'}
              onChange={(e) => set('gstEnabled', e.target.value === 'Yes')}
            >
              <option>Yes</option>
              <option>No</option>
            </Select>
          </Field>
          <Field label="GST %">
            <Input
              type="number"
              value={b.gstPercent}
              onChange={(e) => set('gstPercent', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
