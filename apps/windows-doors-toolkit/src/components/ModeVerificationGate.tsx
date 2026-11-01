import { useMemo, useState } from 'react';
import {
  isPersonalEmailDomain,
  isValidEmail,
  lookupAccountByEmail,
  normalizeEmail,
} from '../engine/accountStore';
import { CUSTOMER_MODES, type CustomerModeId, type ModeVerificationInput } from '../types';
import { Btn, Field, Input } from './ui';

export function ModeVerificationGate({
  mode,
  onCancel,
  onSubmit,
}: {
  mode: Exclude<CustomerModeId, 'home-owner'>;
  onCancel: () => void;
  onSubmit: (data: ModeVerificationInput) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [restoreSaved, setRestoreSaved] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);

  const label = CUSTOMER_MODES.find((m) => m.id === mode)?.label ?? mode;
  const emailOk = isValidEmail(email);
  const existing = useMemo(
    () => (emailOk ? lookupAccountByEmail(email) : null),
    [email, emailOk],
  );
  const preferBusinessHint =
    emailOk && isPersonalEmailDomain(email)
      ? 'Personal email works, but a company address (e.g. info@company.com) is preferred.'
      : 'Prefer a company address such as info@company.com. Gmail/personal is allowed.';

  const ready =
    name.trim() &&
    emailOk &&
    mobile.trim() &&
    area.trim() &&
    city.trim() &&
    gstNo.trim();

  const fillFromAccount = () => {
    if (!existing) return;
    const match =
      existing.verifications.find((v) => v.modeId === mode) ?? existing.verifications[0];
    if (!match) return;
    setName(match.name || '');
    setMobile(match.mobile || '');
    setArea(match.area || '');
    setCity(match.city || '');
    setGstNo(match.gstNo || '');
    setRestoreSaved(true);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="modal-card" style={{ maxWidth: 520 }}>
        <h2 id="verify-title">Verify {label} mode</h2>
        <p className="muted" style={{ marginBottom: '0.85rem' }}>
          Architect, Builder, and Vendor modes unlock after name, professional / business email, mobile,
          area, city, and GST. Your email is the login key — use it later to restore saved quotes and
          projects. Home owner needs no gate.
        </p>
        <div className="grid grid-1 stack">
          <Field label="Name" tone="in">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firm / person name" />
          </Field>
          <Field
            label="Professional / business email"
            tone="in"
            hint={preferBusinessHint}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="info@company.com"
              autoComplete="email"
            />
          </Field>
          {emailTouched && email.trim() && !emailOk ? (
            <p className="tiny" style={{ color: 'var(--danger, #b42318)', marginTop: '-0.35rem' }}>
              Enter a valid email address.
            </p>
          ) : null}
          {existing ? (
            <div
              className="tiny"
              style={{
                padding: '0.55rem 0.65rem',
                borderRadius: 8,
                background: 'rgba(15, 118, 110, 0.08)',
                border: '1px solid rgba(15, 118, 110, 0.25)',
              }}
            >
              Saved account found for <strong>{normalizeEmail(email)}</strong> (ID{' '}
              {existing.customerId}).{' '}
              <button
                type="button"
                onClick={fillFromAccount}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'inherit',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                Fill profile from saved data
              </button>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={restoreSaved}
                  onChange={(e) => setRestoreSaved(e.target.checked)}
                />
                Restore old projects / quotes for this email
              </label>
            </div>
          ) : null}
          <Field label="Mobile no" tone="in">
            <Input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          <Field label="Area / location" tone="in">
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Locality / area"
            />
          </Field>
          <Field label="City" tone="in">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          </Field>
          <Field label="GST no" tone="in">
            <Input
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value)}
              placeholder="22AAAAA0000A1Z5"
            />
          </Field>
        </div>
        <div className="toolbar" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            disabled={!ready}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                email: normalizeEmail(email),
                mobile: mobile.trim(),
                area: area.trim(),
                city: city.trim(),
                gstNo: gstNo.trim(),
                restoreSaved: Boolean(existing && restoreSaved),
              })
            }
          >
            Submit & unlock {label}
          </Btn>
        </div>
      </div>
    </div>
  );
}
