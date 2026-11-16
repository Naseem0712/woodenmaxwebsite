import { Link } from 'react-router-dom';
import { Card, Kpi, Money, Num, PageHeader } from '../components/ui';
import { calcMargin, calcOpenings, calcQuote, calcSliding } from '../engine/calcs';
import { activeCustomerMode } from '../engine/masterCatalogue';
import { isVendorFullAccess } from '../engine/modeAccess';
import { useApp } from '../store/AppContext';

const quotePathTiles = [
  ['/site-measure', 'Site Measure', 'Default landing · W×H + glass/mesh doors'],
  ['/configure', 'Configurator', 'Mode quote: size → type → glass → colour'],
  ['/leads', 'Leads', 'Enquiry CRM · follow-up dates'],
  ['/quote', '08 Quotation', 'Printable schedule + GST + advance'],
  ['/settings/master', 'Master catalogue', 'Shared market DB (powers all quote modes)'],
  ['/settings/window-types', 'Window types', 'Shop-owner: add/edit shared type rates'],
  ['/settings', 'Settings hub', 'Glass, colours, hardware, profiles, series'],
];

const vendorTiles = [
  ['/configure', 'Configurator', 'Mode quote: size → type → glass → colour'],
  ['/leads', 'Leads', 'Enquiry CRM · follow-up dates'],
  ['/site-measure', 'Site Measure', 'Site visit W×H → push openings'],
  ['/openings', '01 Window Sqft', 'Openings schedule → chargeable sqft'],
  ['/sliding', '02 Sliding', 'Series + size → members & ₹/sqft'],
  ['/casement', '03 Casement', 'Panels + openable → cost model'],
  ['/doors', '04 Doors', 'Door & partition lines'],
  ['/cutting', '05 Cutting', 'Cut list → stock lengths to buy'],
  ['/glass', '06 Glass', 'Pane lines → glass cost'],
  ['/hardware', '07 Hardware', 'Type × item matrix → job ₹'],
  ['/quote', '08 Quotation', 'Printable schedule + GST + advance'],
  ['/compare', '09 Compare', 'UPVC vs Aluminium'],
  ['/margin', '10 Margin', 'Cost stack vs quoted amount'],
  ['/mesh', '11 Mesh & Grill', 'Add-on mesh / grill'],
  ['/labour', '12 Labour', 'Fab + install labour'],
  ['/builder', '13 Builder', 'Bulk / tower estimator'],
  ['/revision', '14 Price Revision', 'Input cost change impact'],
  ['/dashboard', '15 Dashboard', 'Cross-tool KPIs'],
  ['/settings/master', 'Master catalogue', 'Shared market rates + Vendor overrides'],
  ['/settings', 'Settings', 'Series, rates, masters, GST'],
];

export function HomePage() {
  const { state } = useApp();
  const openings = calcOpenings(state);
  const sliding = calcSliding(state);
  const quote = calcQuote(state);
  const margin = calcMargin(state);
  const mode = activeCustomerMode(state);
  const fullAccess = isVendorFullAccess(state, mode);
  const tiles = fullAccess ? vendorTiles : quotePathTiles;

  return (
    <div key={`home-hub-${mode}`} data-customer-mode={mode}>
      <PageHeader
        title="Fabricator Toolkit"
        subtitle={
          fullAccess
            ? 'Vendor mode: full fab tools. Defaults to the shared master; private ₹ overrides layer on top without rewriting the base.'
            : 'Mode quote path: configure → quote. Shop owners can still edit the shared master DB here (no fab tools until Vendor).'
        }
        badge={fullAccess ? 'Vendor · full access' : 'Mode quote path'}
      />
      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Chargeable sqft" value={<Num n={openings.totalChargeable} />} hint={`${openings.totalWindows} windows`} />
        <Kpi label="Openings estimate" value={<Money n={openings.totalEstimate} />} />
        <Kpi label="Sliding demo total" value={<Money n={sliding.totalAll} />} hint={`${sliding.pricePerSqft}/sqft target`} />
        <Kpi label="Quote after discount" value={<Money n={quote.afterDiscount} />} hint={`Margin ${NumInline(margin.marginPct)}`} />
      </div>
      {!fullAccess ? (
        <Card title="Shop owner · shared master DB">
          <p className="muted" style={{ marginTop: 0 }}>
            Fabricator owners manage one shared catalogue (profiles, rates, hardware, glass, colours, series). Home
            owner / Architect / Builder quotes all read that shared base. You are not stuck — open Master or the
            Settings links below without switching Mode.
          </p>
          <p className="tiny" style={{ marginBottom: 0 }}>
            <Link to="/settings/master">Master catalogue</Link>
            {' · '}
            <Link to="/settings/window-types">Window types</Link>
            {' · '}
            <Link to="/settings/glass">Glass</Link>
            {' · '}
            <Link to="/settings/colours">Colours</Link>
            {' · '}
            <Link to="/settings/hardware">Hardware</Link>
            {' · '}
            <Link to="/settings/profiles">Profiles</Link>
            {' · '}
            <Link to="/settings/series">Series</Link>
          </p>
        </Card>
      ) : null}
      <Card title="How to use">
        <ol className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
          <li>
            Pick Mode on the project bar (Home owner free; Architect / Builder / Vendor need name + ID + GST).
          </li>
          <li>
            Use <Link to="/configure">Configurator</Link> — size → type → material → glass → colour → Add to quote.
          </li>
          <li>
            Rates come from the <Link to="/settings/master">shared master</Link>. Vendor mode starts from the same
            shared base and can add private overrides only.
          </li>
          {fullAccess ? (
            <li>
              Full path: <Link to="/leads">Leads</Link> → <Link to="/site-measure">Site Measure</Link> →{' '}
              <Link to="/openings">01 Openings</Link> → <Link to="/quote">08 Quotation</Link>.
            </li>
          ) : null}
        </ol>
      </Card>
      <div className="home-grid">
        {tiles.map(([to, title, desc]) => (
          <Link key={to} to={to} className="home-tile">
            <strong>{title}</strong>
            <span>{desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NumInline(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
