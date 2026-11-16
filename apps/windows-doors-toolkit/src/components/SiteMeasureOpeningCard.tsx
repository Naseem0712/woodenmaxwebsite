import {
  Btn,
  Field,
  Money,
  Num,
  NumberInput,
} from './ui';
import {
  defaultsForWindowType,
  meshTypeLabel,
  suggestOpenableMesh,
} from '../engine/meshCosting';
import type { AppState, MeshCostingSettings } from '../types';
import type { MeshTypeId, SiteMeasureLine, Unit, WindowType, YesNo, Lead } from '../types';

const MESH_TYPES: MeshTypeId[] = [
  'none',
  'rolling',
  'collapsible',
  'fixed',
  'door-side',
  'sliding',
  'swing',
];

export type SiteMeasureCalcRow = {
  line: SiteMeasureLine;
  lessWidthMm: number;
  lessHeightMm: number;
  netWidth: number;
  netHeight: number;
  warnNegative: boolean;
  totalSqft: number;
  meshAmount: number;
  amount: number;
  selling: number;
  hasDiscount?: boolean;
};

type Props = {
  index: number;
  row: SiteMeasureCalcRow;
  state: AppState;
  types: WindowType[];
  leads: Lead[];
  meshSettings: MeshCostingSettings;
  update: (id: string, patchLine: Partial<SiteMeasureLine>) => void;
  applyTrackDefaults: (id: string, tracks: number) => void;
  onDelete: () => void;
};

/** Compact mobile editor: 2 fields per row to cut card height. */
export function SiteMeasureOpeningCard({
  index,
  row: r,
  state,
  types,
  leads,
  meshSettings,
  update,
  applyTrackDefaults,
  onDelete,
}: Props) {
  const wt = types.find((t) => t.id === r.line.windowTypeId);
  const isSliding = wt?.kind === 'sliding' || (r.line.tracks ?? 0) > 0;
  const code = `W-${String(index + 1).padStart(2, '0')}`;

  return (
    <article
      className={`site-measure-opening-card${r.warnNegative ? ' row-warn' : ''}`}
      data-opening-card={r.line.id}
    >
      <header className="site-measure-opening-card-head">
        <div>
          <span className="site-measure-opening-code">{code}</span>
          <strong>{r.line.location || 'Opening'}</strong>
        </div>
        <Btn variant="danger" onClick={onDelete}>
          Del
        </Btn>
      </header>

      <div className="grid grid-2">
        <Field label="Location">
          <input
            className="input"
            value={r.line.location}
            onChange={(e) => update(r.line.id, { location: e.target.value })}
            placeholder="Bedroom window"
          />
        </Field>
        <Field label="Type">
          <select
            className="input"
            value={r.line.windowTypeId}
            onChange={(e) => {
              const id = e.target.value;
              const nextWt = types.find((t) => t.id === id);
              const doorMesh = defaultsForWindowType(state, id);
              update(r.line.id, {
                windowTypeId: id,
                ratePerSqft: nextWt?.ratePerSqft ?? r.line.ratePerSqft,
                ...doorMesh,
              });
            }}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.kind}: {t.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="site-measure-opening-section">
        <p className="site-measure-opening-section-label">Size</p>
        <div className="grid grid-2">
          <Field label="Site W">
            <NumberInput
              value={r.line.width}
              onCommit={(n) => update(r.line.id, { width: n ?? r.line.width })}
            />
          </Field>
          <Field label="Site H">
            <NumberInput
              value={r.line.height}
              onCommit={(n) => update(r.line.id, { height: n ?? r.line.height })}
            />
          </Field>
          <Field label="Unit">
            <select
              className="input"
              value={r.line.unit}
              onChange={(e) => update(r.line.id, { unit: e.target.value as Unit })}
            >
              <option value="mm">mm</option>
              <option value="inch">inch</option>
              <option value="ft">ft</option>
            </select>
          </Field>
          <Field label="Qty">
            <NumberInput
              value={r.line.qty}
              onCommit={(n) => update(r.line.id, { qty: n ?? r.line.qty })}
            />
          </Field>
        </div>
        <p className={`tiny muted site-measure-net${r.warnNegative ? ' warn' : ''}`}>
          Net fab{' '}
          <strong>
            <Num n={r.netWidth} d={0} /> × <Num n={r.netHeight} d={0} />
          </strong>
          {r.warnNegative ? ' ⚠' : ''}
        </p>
      </div>

      <div className="grid grid-2">
        <Field label="Less W" hint={`Effective ${r.lessWidthMm} mm`}>
          <NumberInput
            value={r.line.lessOffWidthMm ?? ''}
            emptyAs="null"
            placeholder={String(r.lessWidthMm)}
            title={`Effective ${r.lessWidthMm} mm`}
            onCommit={(n) => update(r.line.id, { lessOffWidthMm: n })}
          />
        </Field>
        <Field label="Less H" hint={`Effective ${r.lessHeightMm} mm`}>
          <NumberInput
            value={r.line.lessOffHeightMm ?? ''}
            emptyAs="null"
            placeholder={String(r.lessHeightMm)}
            title={`Effective ${r.lessHeightMm} mm`}
            onCommit={(n) => update(r.line.id, { lessOffHeightMm: n })}
          />
        </Field>
        <Field label="Glass" hint="Toughened extra from Settings">
          <select
            className="input"
            value={r.line.toughened}
            onChange={(e) => update(r.line.id, { toughened: e.target.value as YesNo })}
          >
            <option value="No">Standard</option>
            <option value="Yes">Toughened</option>
          </select>
        </Field>
        <Field label="Glass doors">
          <NumberInput
            value={r.line.glassDoors}
            onCommit={(n) => update(r.line.id, { glassDoors: n ?? r.line.glassDoors })}
          />
        </Field>
        {isSliding ? (
          <Field label="Tracks">
            <NumberInput
              value={r.line.tracks}
              step={0.5}
              onCommit={(n) => applyTrackDefaults(r.line.id, n ?? r.line.tracks)}
            />
          </Field>
        ) : (
          <Field label="Vent">
            <select
              className="input"
              value={r.line.hasVent}
              onChange={(e) => {
                const hasVent = e.target.value as YesNo;
                if (hasVent === 'Yes') {
                  const sug = suggestOpenableMesh(meshSettings, {
                    openablePanels: r.line.glassDoors || 1,
                    hasVent: 'Yes',
                    doorSide: false,
                  });
                  update(r.line.id, {
                    hasVent,
                    ventCount: sug.ventCount,
                    meshDoors: sug.meshDoors,
                    meshType: sug.meshType,
                  });
                } else {
                  update(r.line.id, { hasVent, ventCount: 0 });
                }
              }}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
        )}
        <Field label="Mesh doors">
          <NumberInput
            value={r.line.meshDoors}
            onCommit={(n) => {
              const meshDoors = Math.max(0, n ?? 0);
              const meshType =
                meshDoors === 0
                  ? 'none'
                  : r.line.meshType === 'none'
                    ? isSliding
                      ? 'rolling'
                      : 'door-side'
                    : r.line.meshType;
              update(r.line.id, { meshDoors, meshType });
            }}
          />
        </Field>
        <Field label="Mesh type">
          <select
            className="input"
            value={r.line.meshType}
            onChange={(e) => {
              const meshType = e.target.value as MeshTypeId;
              const meshDoors =
                meshType === 'none' ? 0 : Math.max(1, r.line.meshDoors || 1);
              update(r.line.id, { meshType, meshDoors });
            }}
          >
            {MESH_TYPES.map((t) => (
              <option key={t} value={t}>
                {meshTypeLabel(t)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="site-measure-opening-rates" data-testid="opening-rates-amount">
        <p className="site-measure-opening-section-label">Rates / amount</p>
        <div className="grid grid-2">
          <Field label="₹/sqft" hint="Editable · drives package amount">
            <NumberInput
              value={r.line.ratePerSqft}
              inputMode="decimal"
              data-testid="opening-rate-per-sqft"
              onCommit={(n) => update(r.line.id, { ratePerSqft: n ?? r.line.ratePerSqft })}
            />
          </Field>
          <Field label="Sqft" tone="calc">
            <div className="calc-box">
              <div className="calc-value">
                <Num n={r.totalSqft} />
              </div>
            </div>
          </Field>
          <Field label="Mesh ₹" hint="Default from Settings · editable">
            <NumberInput
              value={r.meshAmount}
              inputMode="decimal"
              data-testid="opening-mesh-amount"
              onCommit={(n) =>
                update(r.line.id, {
                  meshAmountOverride: n == null ? null : Math.round(n),
                })
              }
            />
          </Field>
          <Field label="Amount" hint="Package ₹ · editable">
            <NumberInput
              value={r.amount}
              inputMode="decimal"
              className="site-measure-opening-amount"
              data-testid="opening-package-amount"
              onCommit={(n) =>
                update(r.line.id, {
                  amountOverride: n == null ? null : Math.round(n),
                })
              }
            />
          </Field>
          <Field label="Disc %" hint="Empty = no discount">
            <NumberInput
              value={r.line.discountPercent ?? ''}
              inputMode="decimal"
              data-testid="opening-discount-percent"
              onCommit={(n) =>
                update(r.line.id, {
                  discountPercent: n == null || n <= 0 ? null : n,
                })
              }
              placeholder="—"
            />
          </Field>
          <Field label="Selling" tone="calc" hint="After discount">
            <div className="calc-box">
              <div className="calc-value">
                <Money n={r.selling} />
              </div>
            </div>
          </Field>
        </div>
      </div>

      <Field label="Notes">
        <input
          className="input"
          value={r.line.notes ?? ''}
          onChange={(e) => update(r.line.id, { notes: e.target.value })}
          placeholder="Site note for this opening"
          data-testid="opening-notes"
        />
      </Field>

      <details className="site-measure-opening-meta">
        <summary>Date · lead · measured by</summary>
        <div className="grid grid-2" style={{ marginTop: '0.45rem' }}>
          <Field label="Date">
            <input
              className="input"
              type="date"
              value={r.line.measuredOn}
              onChange={(e) => update(r.line.id, { measuredOn: e.target.value })}
            />
          </Field>
          <Field label="Lead">
            <select
              className="input"
              value={r.line.leadId}
              onChange={(e) => update(r.line.id, { leadId: e.target.value })}
            >
              <option value="">—</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.leadNo} · {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Measured by">
            <input
              className="input"
              value={r.line.measuredBy}
              onChange={(e) => update(r.line.id, { measuredBy: e.target.value })}
            />
          </Field>
        </div>
      </details>
    </article>
  );
}
