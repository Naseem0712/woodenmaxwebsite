import { Link } from 'react-router-dom';
import { ExportToolbar, type ExportBuilders } from './ExportToolbar';
import {
  SiteMeasureSendOpenings,
  type SendOpeningsStatus,
  type SendOpeningsTarget,
} from './SiteMeasureSendOpenings';
import { Field, Input, Kpi, Money, Num } from './ui';
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
  onSendOpenings: (target: SendOpeningsTarget) => void;
  sendStatus: SendOpeningsStatus;
};

/**
 * Mobile-only open/close panel: Export Quote/BOM, compact add-on rates,
 * Send openings destinations, live KPIs at the bottom.
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
  onSendOpenings,
  sendStatus,
}: Props) {
  return (
    <details
      className="site-measure-mobile-panel no-print"
      data-testid="site-measure-mobile-panel"
      open
    >
      <summary className="site-measure-mobile-panel-summary">
        <span>Actions &amp; totals</span>
        <span className="site-measure-mobile-panel-hint">Export · rates · send · live KPIs</span>
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

        <div data-testid="site-measure-mobile-push">
          <SiteMeasureSendOpenings
            variant="panel"
            disabled={!hasOpenings}
            onSend={onSendOpenings}
            status={sendStatus}
          />
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
