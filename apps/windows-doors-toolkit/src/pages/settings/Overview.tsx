import { Link } from 'react-router-dom';
import { Card, Kpi, Money, Num, PageHeader } from '../../components/ui';
import { activeCustomerMode } from '../../engine/masterCatalogue';
import { isVendorFullAccess } from '../../engine/modeAccess';
import { useApp } from '../../store/AppContext';

const quotePathLinks = [
  ['/settings/master', 'Master catalogue', 'Shared market rates (+ Vendor overrides when unlocked)'],
  ['/settings/colours', 'Colours / finish', 'Configurator colour options + ₹/sqft adj'],
  ['/settings/allowances', 'Mode pricing', 'Architect factor + builder threshold'],
  ['/settings/data', 'Export / Import', 'JSON backup, restore, reset to seed'],
] as const;

const vendorLinks = [
  ['/settings/master', 'Master catalogue', 'Shared market rates + Vendor private overrides'],
  ['/settings/business', 'Business / GST', 'Company name, address, GSTIN, GST %'],
  ['/settings/allowances', 'Allowances', 'Min sqft, wastage, Al ₹/kg, glass round-up, margin'],
  ['/settings/series', 'Series & members', 'Profile member rules & ₹/m for Sliding / Casement'],
  ['/settings/window-types', 'Window types', '₹/sqft rate card used by openings & quote'],
  ['/settings/glass', 'Glass types', 'Thickness and glass ₹/sqft'],
  ['/settings/colours', 'Colours / finish', 'Configurator colour options + ₹/sqft adj'],
  ['/settings/allowances', 'Mode pricing', 'Architect factor + builder threshold (on Allowances)'],
  ['/settings/hardware', 'Hardware catalogue', 'Rollers, locks, stays, consumables'],
  ['/settings/profiles', 'Profiles stock', 'Stock length + UPVC ₹/m or Al kg/m'],
  ['/settings/data', 'Export / Import', 'JSON backup, restore, reset to seed'],
] as const;

export function SettingsOverviewPage() {
  const { state } = useApp();
  const mode = activeCustomerMode(state);
  const fullAccess = isVendorFullAccess(state, mode);
  const links = fullAccess ? vendorLinks : quotePathLinks;

  return (
    <div data-customer-mode={mode}>
      <PageHeader
        title="Settings / Manage"
        subtitle={
          fullAccess
            ? 'Masters drive every tool. Edit series & rates here once — tools pick them up automatically (blue fields).'
            : 'Quote-path settings: Master, Colours, Mode pricing, Export/Import. Switch Mode to Vendor for full Settings.'
        }
        badge={fullAccess ? 'Vendor · full Settings' : 'Mode quote path'}
      />
      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Series" value={state.series.length} />
        <Kpi label="Window types" value={state.windowTypes.length} />
        <Kpi label="Glass types" value={state.glassTypes.length} />
        <Kpi label="Hardware items" value={state.hardware.length} />
        <Kpi label="Profile SKUs" value={state.profiles.length} />
        <Kpi label="Min chargeable" value={<Num n={state.allowances.minChargeableSqft} d={1} />} hint="sqft" />
        <Kpi label="Default margin" value={`${(state.allowances.defaultTargetMargin * 100).toFixed(0)}%`} />
        <Kpi
          label="Sample type rate"
          value={<Money n={state.windowTypes[0]?.ratePerSqft ?? 0} />}
          hint={state.windowTypes[0]?.name}
        />
      </div>
      <Card title="Settings modules">
        <div className="home-grid">
          {links.map(([to, title, desc]) => (
            <Link key={`${to}-${title}`} to={to} className="home-tile">
              <strong>{title}</strong>
              <span>{desc}</span>
            </Link>
          ))}
        </div>
      </Card>
      <Card title="Shop tip">
        <p className="muted">
          {fullAccess
            ? 'Typical flow: set Business & GST → confirm Allowances → tune Series A/B members → confirm window-type and glass rates → enter sizes on 01 / 02 / 03 → quotation & margin.'
            : 'Mode quote flow: Master catalogue rates → Configurator → Quotation. Unlock Vendor mode for fab tools and full Settings.'}
        </p>
      </Card>
    </div>
  );
}
