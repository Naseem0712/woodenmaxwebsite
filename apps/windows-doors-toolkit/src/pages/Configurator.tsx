import { useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import {
  Btn,
  Card,
  Field,
  Input,
  Kpi,
  Money,
  Num,
  NumberInput,
  PageHeader,
  Toolbar,
} from '../components/ui';
import { resolveEffectiveCatalogue } from '../engine/masterCatalogue';
import {
  calcConfiguratorCart,
  calcConfiguratorLine,
  calcModeQuote,
  modeAdjustedLineAmount,
} from '../engine/modePricing';
import { useApp } from '../store/AppContext';
import {
  CONFIGURATOR_PRODUCT_TYPES,
  CUSTOMER_MODES,
  type ConfiguratorLine,
  type ConfiguratorProductType,
  type Material,
} from '../types';

type QuoteTab = 'list' | 'areas' | 'materials' | 'hardwares';

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ConfiguratorPage() {
  const { state, patch } = useApp();
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const customerMode = project?.customerMode ?? 'home-owner';
  const modeLabel = CUSTOMER_MODES.find((m) => m.id === customerMode)?.label ?? 'Home owner';
  const cart = calcConfiguratorCart(state);
  const modeQuote = calcModeQuote(state);
  const catalogue = resolveEffectiveCatalogue(state);

  const [widthMm, setWidthMm] = useState(1500);
  const [heightMm, setHeightMm] = useState(1200);
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState('');
  const [productType, setProductType] = useState<ConfiguratorProductType>('sliding');
  const [material, setMaterial] = useState<Material>(project?.material ?? 'UPVC');
  const [windowTypeId, setWindowTypeId] = useState('');
  const [glassTypeId, setGlassTypeId] = useState(state.glassTypes[0]?.id ?? '');
  const [colourId, setColourId] = useState('');
  const [tab, setTab] = useState<QuoteTab>('list');

  const kind =
    CONFIGURATOR_PRODUCT_TYPES.find((t) => t.id === productType)?.kind ?? 'sliding';

  const typeOptions = useMemo(
    () =>
      catalogue.windowTypes.filter(
        (t) => t.material === material && (t.kind === kind || (kind === 'other' && t.kind === 'other')),
      ),
    [catalogue.windowTypes, material, kind],
  );

  const colourOptions = useMemo(
    () =>
      catalogue.colourOptions.filter(
        (c) => c.material === 'Both' || c.material === material,
      ),
    [catalogue.colourOptions, material],
  );

  const effectiveTypeId = typeOptions.some((t) => t.id === windowTypeId)
    ? windowTypeId
    : typeOptions[0]?.id ?? '';
  const effectiveColourId = colourOptions.some((c) => c.id === colourId)
    ? colourId
    : colourOptions[0]?.id ?? '';
  const effectiveGlassId = catalogue.glassTypes.some((g) => g.id === glassTypeId)
    ? glassTypeId
    : catalogue.glassTypes[0]?.id ?? '';

  const draftLine: ConfiguratorLine = {
    id: 'draft',
    location: location || 'New opening',
    widthMm,
    heightMm,
    qty,
    productType,
    material,
    windowTypeId: effectiveTypeId,
    glassTypeId: effectiveGlassId,
    colourId: effectiveColourId,
  };
  const draftCalc = effectiveTypeId
    ? calcConfiguratorLine(state, draftLine)
    : null;
  const draftAdjusted = draftCalc
    ? modeAdjustedLineAmount(draftCalc.retailAmount + draftCalc.glassAmount, {
        ...modeQuote,
        retailSubtotal: Math.max(modeQuote.retailSubtotal, 1),
        afterModeDiscount:
          modeQuote.retailSubtotal > 0
            ? (draftCalc.retailAmount + draftCalc.glassAmount) *
              (modeQuote.afterModeDiscount / modeQuote.retailSubtotal)
            : (draftCalc.retailAmount + draftCalc.glassAmount) *
              (1 - modeQuote.discountPercent / 100),
      })
    : null;

  /** Preview line budget using mode discount % directly (empty cart edge case). */
  const draftBudget =
    draftCalc == null
      ? 0
      : (draftCalc.retailAmount + draftCalc.glassAmount) * (1 - modeQuote.discountPercent / 100);
  const draftRateShown =
    draftCalc && draftCalc.chargeableSqft > 0
      ? draftBudget / draftCalc.chargeableSqft
      : draftCalc?.retailRatePerSqft ?? 0;

  const addToQuote = () => {
    if (!effectiveTypeId) return;
    const line: ConfiguratorLine = {
      ...draftLine,
      id: uid(),
      location: location.trim() || `Opening ${(state.configuratorLines?.length ?? 0) + 1}`,
      windowTypeId: effectiveTypeId,
      glassTypeId: effectiveGlassId,
      colourId: effectiveColourId,
    };
    patch('configuratorLines', [...(state.configuratorLines ?? []), line]);
    setLocation('');
  };

  const removeLine = (id: string) => {
    patch(
      'configuratorLines',
      (state.configuratorLines ?? []).filter((l) => l.id !== id),
    );
  };

  const exportExcel = () => {
    const headers = [
      'Location',
      'Type',
      'Material',
      'Product',
      'W mm',
      'H mm',
      'Qty',
      'Sqft',
      'Glass',
      'Colour',
      'Retail ₹',
      'Mode ₹',
      'Mode',
    ];
    const rows = cart.rows.map((r) => {
      const adj = modeAdjustedLineAmount(r.retailAmount + r.glassAmount, modeQuote);
      return [
        r.line.location,
        r.line.productType,
        r.line.material,
        r.typeName,
        r.line.widthMm,
        r.line.heightMm,
        r.line.qty,
        r.chargeableSqft.toFixed(2),
        r.glassName,
        r.colourName,
        Math.round(r.retailAmount + r.glassAmount),
        Math.round(adj.amount),
        modeLabel,
      ].join(',');
    });
    const summary = [
      '',
      `Retail subtotal,${Math.round(modeQuote.retailSubtotal)}`,
      `Mode discount %,${modeQuote.discountPercent}`,
      `After mode discount,${Math.round(modeQuote.afterModeDiscount)}`,
      `GST,${Math.round(modeQuote.gst)}`,
      `Grand,${Math.round(modeQuote.grand)}`,
    ];
    downloadText(
      `quote-${state.quote.quoteNo || 'configurator'}.csv`,
      [headers.join(','), ...rows, ...summary].join('\n'),
      'text/csv;charset=utf-8',
    );
  };

  const hwRows = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; qty: number; rate: number }>();
    for (const r of cart.rows) {
      const bom = state.hardwareBom.filter((b) => b.windowTypeId === r.line.windowTypeId);
      for (const b of bom) {
        const item = catalogue.hardware.find((h) => h.id === b.hardwareItemId);
        if (!item) continue;
        const key = item.id;
        const prev = map.get(key) ?? { name: item.name, unit: item.unit, qty: 0, rate: item.rate };
        prev.qty += b.qtyPerWindow * r.line.qty;
        map.set(key, prev);
      }
    }
    return [...map.values()];
  }, [cart.rows, state.hardwareBom, catalogue.hardware]);

  const materialRows = useMemo(() => {
    return cart.rows.map((r) => ({
      location: r.line.location,
      material: r.line.material,
      type: r.typeName,
      colour: r.colourName,
      glass: r.glassName,
      qty: r.line.qty,
      sqft: r.chargeableSqft,
    }));
  }, [cart.rows]);

  return (
    <div>
      <PageHeader
        title="Quote configurator"
        subtitle={`Mode: ${modeLabel}. Size → type → material → glass → colour → Add to quote. Rates from Settings only.`}
        badge={modeLabel}
      />

      <Card title="Configure one opening" actions={<span className="tiny muted">{modeQuote.pricingNote}</span>}>
        <div className="grid grid-4">
          <Field label="1. Width (mm)" tone="in">
            <NumberInput value={widthMm} onCommit={(n) => setWidthMm(n ?? 0)} />
          </Field>
          <Field label="1. Height (mm)" tone="in">
            <NumberInput value={heightMm} onCommit={(n) => setHeightMm(n ?? 0)} />
          </Field>
          <Field label="1. Qty" tone="in">
            <NumberInput value={qty} onCommit={(n) => setQty(Math.max(1, n ?? 1))} />
          </Field>
          <Field label="Location (optional)" tone="in">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Living room" />
          </Field>
        </div>

        <div className="config-step" style={{ marginTop: '0.85rem' }}>
          <div className="field-label">2. Select type</div>
          <div className="chip-row">
            {CONFIGURATOR_PRODUCT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${productType === t.id ? 'chip-active' : ''}`}
                onClick={() => setProductType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="config-step">
          <div className="field-label">3. Material</div>
          <div className="chip-row">
            {(['UPVC', 'Aluminium'] as Material[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${material === m ? 'chip-active' : ''}`}
                onClick={() => setMaterial(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: '0.35rem' }}>
            Types listed for {material} × {productType} only (class isolation).
          </p>
        </div>

        <div className="grid grid-3" style={{ marginTop: '0.75rem' }}>
          <Field label="Window / door series type" tone="in" hint="Settings → Window types">
            <select
              className="input tone-in"
              value={effectiveTypeId}
              onChange={(e) => setWindowTypeId(e.target.value)}
            >
              {typeOptions.length === 0 ? (
                <option value="">No types for this material × kind</option>
              ) : (
                typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (₹{t.ratePerSqft}/sqft)
                  </option>
                ))
              )}
            </select>
          </Field>
          <Field label="4. Glass" tone="in">
            <select
              className="input tone-in"
              value={effectiveGlassId}
              onChange={(e) => setGlassTypeId(e.target.value)}
            >
              {catalogue.glassTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (₹{g.ratePerSqft}/sqft)
                </option>
              ))}
            </select>
          </Field>
          <Field label="5. Colour" tone="in">
            <select
              className="input tone-in"
              value={effectiveColourId}
              onChange={(e) => setColourId(e.target.value)}
            >
              {colourOptions.length === 0 ? (
                <option value="">No colours — add in Settings</option>
              ) : (
                colourOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.rateAdjPerSqft ? ` (+₹${c.rateAdjPerSqft}/sqft)` : ''}
                  </option>
                ))
              )}
            </select>
          </Field>
        </div>

        <div className="grid grid-4" style={{ marginTop: '0.85rem' }}>
          <Kpi
            label="6. Rate (mode)"
            value={<Money n={draftRateShown} />}
            hint="/sqft after mode rule"
          />
          <Kpi
            label="Area"
            value={<Num n={draftCalc?.chargeableSqft ?? 0} />}
            hint="chargeable sqft"
          />
          <Kpi label="Budget (this line)" value={<Money n={draftBudget} />} hint={modeLabel} />
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <Btn disabled={!effectiveTypeId} onClick={addToQuote}>
              7. Add to quote
            </Btn>
          </div>
        </div>
        {draftAdjusted ? null : null}
      </Card>

      <Card
        title="Quote"
        actions={
          <Toolbar>
            <Btn variant="ghost" onClick={() => window.print()}>
              Export PDF
            </Btn>
            <Btn variant="ghost" onClick={exportExcel}>
              Export Excel
            </Btn>
          </Toolbar>
        }
      >
        <div className="chip-row no-print" style={{ marginBottom: '0.75rem' }}>
          {(
            [
              ['list', 'List'],
              ['areas', 'Areas'],
              ['materials', 'Materials'],
              ['hardwares', 'Hardwares'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${tab === id ? 'chip-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="quote-print" id="configurator-quote-print">
          <div className="quote-letterhead">
            <div>
              <h2>{state.business.companyName}</h2>
              <p className="muted tiny">
                {state.business.address}
                {state.business.gstin ? ` · GSTIN ${state.business.gstin}` : ''}
              </p>
            </div>
            <div className="quote-meta">
              <strong>Mode quote · {modeLabel}</strong>
              <div className="tiny muted">{modeQuote.pricingNote}</div>
            </div>
          </div>

          {tab === 'list' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Mat.</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Glass</th>
                  <th>Colour</th>
                  <th>Sqft</th>
                  <th>Amount</th>
                  <th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {cart.rows.map((r) => {
                  const adj = modeAdjustedLineAmount(r.retailAmount + r.glassAmount, modeQuote);
                  return (
                    <tr key={r.line.id}>
                      <td>{r.line.location}</td>
                      <td>{r.typeName}</td>
                      <td>{r.line.material}</td>
                      <td>
                        {r.line.widthMm} × {r.line.heightMm}
                      </td>
                      <td>{r.line.qty}</td>
                      <td>{r.glassName}</td>
                      <td>{r.colourName}</td>
                      <td className="calc">
                        <Num n={r.chargeableSqft} />
                      </td>
                      <td className="calc">
                        <Money n={adj.amount} />
                      </td>
                      <td className="no-print">
                        <Btn variant="ghost" onClick={() => removeLine(r.line.id)}>
                          Del
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
                {cart.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="muted">
                      No lines yet — configure above and Add to quote.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          {tab === 'areas' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Actual sqft</th>
                  <th>Chargeable sqft</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {cart.rows.map((r) => (
                  <tr key={r.line.id}>
                    <td>{r.line.location}</td>
                    <td className="calc">
                      <Num n={r.actualSqft} />
                    </td>
                    <td className="calc">
                      <Num n={r.chargeableSqft} />
                    </td>
                    <td>{r.line.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th className="calc">
                    <Num n={cart.totalActual} />
                  </th>
                  <th className="calc">
                    <Num n={cart.totalChargeable} />
                  </th>
                  <th>{cart.totalQty}</th>
                </tr>
              </tfoot>
            </table>
          ) : null}

          {tab === 'materials' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Material</th>
                  <th>Type</th>
                  <th>Colour</th>
                  <th>Glass</th>
                  <th>Qty</th>
                  <th>Sqft</th>
                </tr>
              </thead>
              <tbody>
                {materialRows.map((r, i) => (
                  <tr key={`${r.location}-${i}`}>
                    <td>{r.location}</td>
                    <td>{r.material}</td>
                    <td>{r.type}</td>
                    <td>{r.colour}</td>
                    <td>{r.glass}</td>
                    <td>{r.qty}</td>
                    <td className="calc">
                      <Num n={r.sqft} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === 'hardwares' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Hardware</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate (Settings)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {hwRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No hardware BOM linked to these window types yet (Settings → Hardware / types).
                    </td>
                  </tr>
                ) : (
                  hwRows.map((h) => (
                    <tr key={h.name}>
                      <td>{h.name}</td>
                      <td>{h.qty}</td>
                      <td>{h.unit}</td>
                      <td className="link-cell">
                        <Money n={h.rate} />
                      </td>
                      <td className="calc">
                        <Money n={h.qty * h.rate} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          <div className="grid grid-4" style={{ marginTop: '0.85rem' }}>
            <Kpi label="Retail (homeowner)" value={<Money n={modeQuote.retailSubtotal} />} />
            <Kpi
              label={`Mode discount (${modeQuote.discountPercent}%)`}
              value={<Money n={modeQuote.discountAmount} />}
              hint={
                customerMode === 'builder' && !modeQuote.builderThresholdMet
                  ? 'Threshold not met'
                  : undefined
              }
            />
            <Kpi label="After mode discount" value={<Money n={modeQuote.afterModeDiscount} />} />
            <Kpi label="Grand (incl. GST)" value={<Money n={modeQuote.grand} />} />
          </div>
        </div>
      </Card>
    </div>
  );
}
