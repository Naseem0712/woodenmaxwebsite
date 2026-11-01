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
      ? 'Personal OK; company email preferred.'
      : 'Company email preferred; personal allowed.';

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
      <div className="modal-card modal-card-verify">
        <div className="modal-card-verify-scroll">
          <h2 id="verify-title">Verify {label} mode</h2>
          <p className="muted modal-card-verify-lead">
            Name, business email, mobile, area, city, and GST unlock this mode. Email restores quotes later.
          </p>
          <div className="grid stack modal-card-verify-fields">
            <Field label="Name" tone="in">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firm / person name" />
            </Field>
            <Field label="Professional / business email" tone="in" hint={preferBusinessHint}>
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
              <p className="tiny" style={{ color: 'var(--danger, #b42318)', marginTop: '-0.25rem' }}>
                Enter a valid email address.
              </p>
            ) : null}
            {existing ? (
              <div className="tiny modal-card-verify-saved">
                Saved account for <strong>{normalizeEmail(email)}</strong> (ID {existing.customerId}).{' '}
                <button type="button" className="linkish" onClick={fillFromAccount}>
                  Fill from saved
                </button>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={restoreSaved}
                    onChange={(e) => setRestoreSaved(e.target.checked)}
                  />
                  Restore old projects / quotes
                </label>
              </div>
            ) : null}
            <div className="grid grid-2">
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
            </div>
            <div className="grid grid-2">
              <Field label="Mobile no" tone="in">
                <Input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="GST no" tone="in">
                <Input
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </Field>
            </div>
          </div>
        </div>
        <div className="toolbar modal-card-verify-actions">
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
