import { Link } from 'react-router-dom';
import { ExportToolbar, type ExportBuilders } from './ExportToolbar';
import { Btn, Field, Input, Kpi, Money, Num } from './ui';
import type { Allowances, MeshCostingSettings } from '../types';

type Props = {
  builders: ExportBuilders;
  allowances: Allowances;
  meshSettings: MeshCostingSettings;
  patchAllowances: (next: Allowances) => void;
  totalQty: number;
  totalSqft: number;
  totalMeshAmount: number;
  totalAmount: number;
  hasOpenings: boolean;
  onPushOpenings: () => void;
  onPushCosting: () => void;
  onPushConfigurator: () => void;
  onPushCutting: () => void;
};

/**
 * Mobile-only open/close panel: Export Quote/BOM, compact add-on rates,
 * one-line push actions, live KPIs at the bottom.
 */
export function SiteMeasureMobilePanel({
  builders,
  allowances: a,
  meshSettings,
  patchAllowances,
  totalQty,
  totalSqft,
  totalMeshAmount,
  totalAmount,
  hasOpenings,
  onPushOpenings,
  onPushCosting,
  onPushConfigurator,
  onPushCutting,
}: Props) {
  return (
    <details
      className="site-measure-mobile-panel no-print"
      data-testid="site-measure-mobile-panel"
      open
    >
      <summary className="site-measure-mobile-panel-summary">
        <span>Actions &amp; totals</span>
        <span className="site-measure-mobile-panel-hint">Export · rates · push · live KPIs</span>
      </summary>
      <div className="site-measure-mobile-panel-body">
        <ExportToolbar builders={builders} dense panel />

        <div className="site-measure-mobile-addons" data-testid="site-measure-mobile-addons">
          <div className="site-measure-mobile-section-label">Add-on rates</div>
          <div className="grid grid-2 site-measure-mobile-addons-grid">
            <Field label="Min sqft" tone="link" hint="Settings → Allowances">
              <Input
                tone="link"
                type="number"
                value={a.minChargeableSqft}
                onChange={(e) =>
                  patchAllowances({ ...a, minChargeableSqft: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Rolling ₹/sqft" tone="link">
              <Input
                tone="link"
                type="number"
                value={meshSettings.rollingPerSqft}
                onChange={(e) =>
                  patchAllowances({
                    ...a,
                    meshCosting: { ...meshSettings, rollingPerSqft: Number(e.target.value) },
                    meshPerSqft: Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Collapsible ₹/sqft" tone="link">
              <Input
                tone="link"
                type="number"
                value={meshSettings.collapsiblePerSqft}
                onChange={(e) =>
                  patchAllowances({
                    ...a,
                    meshCosting: { ...meshSettings, collapsiblePerSqft: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Toughened ₹/sqft" tone="link">
              <Input
                tone="link"
                type="number"
                value={a.toughenedExtraPerSqft}
                onChange={(e) =>
                  patchAllowances({ ...a, toughenedExtraPerSqft: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <p className="muted tiny" style={{ marginTop: '0.35rem' }}>
            Full rates in <Link to="/settings/allowances">Settings → Allowances</Link>.
          </p>
        </div>

        <div className="site-measure-mobile-push" data-testid="site-measure-mobile-push">
          <div className="site-measure-mobile-section-label">Push</div>
          <div className="site-measure-mobile-push-row">
            <Btn
              variant="ghost"
              title="Push net → 01 Openings + Quote"
              onClick={onPushOpenings}
              disabled={!hasOpenings}
            >
              01 Openings
            </Btn>
            <Btn
              variant="ghost"
              title="Push → 02/03 Costing"
              onClick={onPushCosting}
              disabled={!hasOpenings}
            >
              02/03 Costing
            </Btn>
            <Btn
              variant="ghost"
              title="Push → Configurator"
              onClick={onPushConfigurator}
              disabled={!hasOpenings}
            >
              Configurator
            </Btn>
            <Btn
              variant="ghost"
              title="Push net → 05 Cutting"
              onClick={onPushCutting}
              disabled={!hasOpenings}
            >
              05 Cutting
            </Btn>
          </div>
        </div>

        <div className="site-measure-mobile-kpis" data-testid="site-measure-mobile-kpis">
          <div className="site-measure-mobile-section-label">Live totals</div>
          <div className="site-measure-mobile-kpi-grid">
            <Kpi label="Openings (qty)" value={totalQty} />
            <Kpi label="Chargeable sqft" value={<Num n={totalSqft} />} />
            <Kpi label="Mesh add-on" value={<Money n={totalMeshAmount} />} hint="typed mesh lines" />
            <Kpi
              label="Measured value"
              value={<Money n={totalAmount} />}
              hint="before discount / GST"
            />
          </div>
        </div>
      </div>
    </details>
  );
}
