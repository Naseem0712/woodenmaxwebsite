import { v4 as uid } from 'uuid';
import { Btn, Card, Field, Input, Money, NumberInput, Select, Toolbar } from './ui';
import {
  calcCustomQuoteLines,
  customUnitLabel,
  resolveQuoteGst,
} from '../engine/quoteEnhancements';
import { useApp } from '../store/AppContext';
import type { CustomQuoteUnit } from '../types';

const UNITS: CustomQuoteUnit[] = ['pc', 'rft', 'sft', 'kg'];

/** Shared GST toggle, footer fields, and custom product lines for Quotation / Configurator / Site Measure. */
export function QuoteExtrasPanel({ compact = false }: { compact?: boolean }) {
  const { state, patch } = useApp();
  const gst = resolveQuoteGst(state);
  const applyGst =
    typeof state.quote.applyGst === 'boolean' ? state.quote.applyGst : state.business.gstEnabled;
  const custom = calcCustomQuoteLines(state);

  const setQuote = (partial: Partial<typeof state.quote>) => {
    patch('quote', { ...state.quote, ...partial });
  };

  const updateCustom = (id: string, partial: Partial<(typeof state.customQuoteLines)[number]>) => {
    patch(
      'customQuoteLines',
      (state.customQuoteLines ?? []).map((l) => (l.id === id ? { ...l, ...partial } : l)),
    );
  };

  return (
    <div className="quote-extras-panel" data-testid="quote-extras-panel">
      <Card title="GST · footer (Settings GST % · quote toggle · PDF)">
        <div className="grid grid-3">
          <Field
            label="Apply GST on grand total"
            hint={`Settings default ${state.business.gstPercent}% · ${
              gst.source === 'quote' ? 'quote override' : 'using Settings'
            }`}
          >
            <Select
              value={applyGst ? 'Yes' : 'No'}
              data-testid="quote-apply-gst"
              onChange={(e) => setQuote({ applyGst: e.target.value === 'Yes' })}
            >
              <option value="Yes">Yes — {state.business.gstPercent}%</option>
              <option value="No">No — off for this quote</option>
            </Select>
          </Field>
          <Field label="GST %" tone="link" hint="From Settings → Business">
            <Input tone="link" readOnly value={`${state.business.gstPercent}%`} />
          </Field>
          <Field label="Reset GST toggle" hint="Follow Settings again">
            <Btn variant="ghost" onClick={() => setQuote({ applyGst: undefined })}>
              Use Settings default
            </Btn>
          </Field>
        </div>

        <div className="grid grid-1" style={{ marginTop: '0.65rem' }}>
          <Field label="Description" hint="Persists · prints on PDF">
            <Input
              value={state.quote.description ?? ''}
              data-testid="quote-description"
              onChange={(e) => setQuote({ description: e.target.value })}
              placeholder="Scope / description for this quotation"
            />
          </Field>
          <Field label="Terms" hint="Persists · prints on PDF">
            <Input
              value={state.quote.terms ?? ''}
              data-testid="quote-terms"
              onChange={(e) => setQuote({ terms: e.target.value })}
              placeholder="Payment / validity / delivery terms"
            />
          </Field>
          <Field label="Bank details" hint="Persists · prints on PDF">
            <Input
              value={state.quote.bankDetails ?? ''}
              data-testid="quote-bank"
              onChange={(e) => setQuote({ bankDetails: e.target.value })}
              placeholder="Bank · A/c · IFSC · payee name"
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Custom products (doors, pergolas, furniture, louvers…)"
        actions={
          <Toolbar>
            <Btn
              data-testid="quote-add-custom"
              onClick={() =>
                patch('customQuoteLines', [
                  ...(state.customQuoteLines ?? []),
                  {
                    id: uid(),
                    name: '',
                    sizeLabel: '',
                    measure: 1,
                    rate: 0,
                    unit: 'pc' as CustomQuoteUnit,
                    qty: 1,
                    discountPercent: null,
                    notes: '',
                  },
                ])
              }
            >
              + Add custom line
            </Btn>
          </Toolbar>
        }
      >
        <div className="table-panel">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                {!compact ? <th>Measure</th> : null}
                <th>Unit</th>
                <th>Rate</th>
                <th>Qty</th>
                <th>Disc %</th>
                <th>Actual</th>
                <th>Selling</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {custom.rows.map((r) => (
                <tr key={r.line.id} data-testid="quote-custom-row">
                  <td>
                    <Input
                      value={r.line.name}
                      onChange={(e) => updateCustom(r.line.id, { name: e.target.value })}
                      placeholder="Pergola / door / louver…"
                    />
                  </td>
                  <td>
                    <Input
                      value={r.line.sizeLabel}
                      onChange={(e) => updateCustom(r.line.id, { sizeLabel: e.target.value })}
                      placeholder="optional"
                    />
                  </td>
                  {!compact ? (
                    <td>
                      <NumberInput
                        value={r.line.measure}
                        inputMode="decimal"
                        onCommit={(n) => updateCustom(r.line.id, { measure: n ?? 0 })}
                      />
                    </td>
                  ) : null}
                  <td>
                    <Select
                      value={r.line.unit}
                      onChange={(e) =>
                        updateCustom(r.line.id, { unit: e.target.value as CustomQuoteUnit })
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {customUnitLabel(u)}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.rate}
                      inputMode="decimal"
                      onCommit={(n) => updateCustom(r.line.id, { rate: n ?? 0 })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.qty}
                      inputMode="decimal"
                      onCommit={(n) => updateCustom(r.line.id, { qty: n ?? 0 })}
                    />
                  </td>
                  <td>
                    <NumberInput
                      value={r.line.discountPercent ?? ''}
                      inputMode="decimal"
                      data-testid="custom-discount-percent"
                      onCommit={(n) =>
                        updateCustom(r.line.id, {
                          discountPercent: n == null || n <= 0 ? null : n,
                        })
                      }
                      placeholder="—"
                    />
                  </td>
                  <td className="calc">
                    <Money n={r.actual} />
                  </td>
                  <td className="calc">
                    <Money n={r.selling} />
                  </td>
                  <td>
                    <Btn
                      variant="ghost"
                      onClick={() =>
                        patch(
                          'customQuoteLines',
                          (state.customQuoteLines ?? []).filter((l) => l.id !== r.line.id),
                        )
                      }
                    >
                      Del
                    </Btn>
                  </td>
                </tr>
              ))}
              {custom.rows.length === 0 ? (
                <tr>
                  <td colSpan={compact ? 9 : 10} className="muted">
                    No custom lines — add doors, pergolas, furniture, louvers, etc.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
