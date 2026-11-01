import { useState } from 'react';
import { CUSTOMER_MODES, type CustomerModeId } from '../types';
import { Btn, Field, Input } from './ui';

export function ModeVerificationGate({
  mode,
  onCancel,
  onSubmit,
}: {
  mode: Exclude<CustomerModeId, 'home-owner'>;
  onCancel: () => void;
  onSubmit: (data: { name: string; professionalId: string; gstNo: string }) => void;
}) {
  const [name, setName] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [gstNo, setGstNo] = useState('');
  const label = CUSTOMER_MODES.find((m) => m.id === mode)?.label ?? mode;
  const ready = name.trim() && professionalId.trim() && gstNo.trim();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="modal-card">
        <h2 id="verify-title">Verify {label} mode</h2>
        <p className="muted" style={{ marginBottom: '0.85rem' }}>
          Architect, Builder, and Vendor modes unlock only after you add name, professional main ID, and
          GST number. Home owner needs no gate.
        </p>
        <div className="grid grid-1 stack">
          <Field label="Name" tone="in">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firm / person name" />
          </Field>
          <Field label="Professional main ID" tone="in" hint="Council / membership / trade ID">
            <Input
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              placeholder="e.g. CA/1234/2020"
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
        <div className="toolbar" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            disabled={!ready}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                professionalId: professionalId.trim(),
                gstNo: gstNo.trim(),
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
