import { Btn, Card, Field, Input, PageHeader, Select } from '../../components/ui';
import {
  ensureBusinessQuoteSeries,
  formatQuoteNumber,
  normalizeQuoteNextSeq,
  normalizeQuoteSeriesPrefix,
  peekNextQuoteNo,
} from '../../engine/quoteSeries';
import { useApp } from '../../store/AppContext';

export function SettingsBusinessPage() {
  const { state, patch } = useApp();
  const b = ensureBusinessQuoteSeries(state.business);
  const set = <K extends keyof typeof b>(key: K, value: (typeof b)[K]) => {
    patch('business', { ...b, [key]: value });
  };

  const onLogoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 600_000) {
      window.alert('Logo file is large — use a smaller image (under ~600 KB) or paste a URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) set('logoUrl', result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Business / GST"
        subtitle="Company letterhead used on Quote PDF / print. GST % applies when GST is enabled."
      />
      <Card title="Company letterhead">
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
          <Field label="Website">
            <Input
              value={b.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </Field>
          <Field label="GSTIN" hint="Shown as GST on quote letterhead">
            <Input value={b.gstin} onChange={(e) => set('gstin', e.target.value)} />
          </Field>
          <Field label="Address" hint="Shown on quote header">
            <Input value={b.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Warranty note">
            <Input value={b.warrantyNote} onChange={(e) => set('warrantyNote', e.target.value)} />
          </Field>
          <Field label="Logo URL" hint="https://… or upload below">
            <Input
              value={b.logoUrl.startsWith('data:') ? '' : b.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)}
              placeholder="https://…/logo.png"
            />
          </Field>
        </div>
        <div className="grid grid-2" style={{ marginTop: '0.65rem' }}>
          <Field label="Upload logo" hint="PNG/JPG under ~600 KB — stored in this browser">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Logo preview">
            {b.logoUrl ? (
              <div className="business-logo-preview">
                <img src={b.logoUrl} alt="Company logo" />
                <Btn variant="ghost" onClick={() => set('logoUrl', '')}>
                  Clear logo
                </Btn>
              </div>
            ) : (
              <p className="muted tiny">No logo yet — PDF letterhead uses company name only.</p>
            )}
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
      <Card title="Quote series">
        <p className="muted tiny" style={{ marginBottom: '0.65rem' }}>
          Set the series / prefix once. New quotes keep this series — only the running number
          increments (e.g. {formatQuoteNumber(b.quoteSeriesPrefix, 1)} →{' '}
          {formatQuoteNumber(b.quoteSeriesPrefix, 2)}). Exports never invent a new series.
        </p>
        <div className="grid grid-3">
          <Field label="Series / prefix" hint="e.g. Q-2026">
            <Input
              value={b.quoteSeriesPrefix}
              onChange={(e) => set('quoteSeriesPrefix', normalizeQuoteSeriesPrefix(e.target.value))}
              placeholder="Q-2026"
              data-testid="quote-series-prefix"
            />
          </Field>
          <Field label="Next number" hint="Running sequence">
            <Input
              type="number"
              min={1}
              value={b.quoteNextSeq}
              onChange={(e) => set('quoteNextSeq', normalizeQuoteNextSeq(Number(e.target.value)))}
              data-testid="quote-series-next"
            />
          </Field>
          <Field label="Next quote no">
            <Input value={peekNextQuoteNo(b)} readOnly />
          </Field>
        </div>
      </Card>
    </div>
  );
}
