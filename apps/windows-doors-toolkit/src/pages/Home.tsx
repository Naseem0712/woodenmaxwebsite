import { Link } from 'react-router-dom';
import { Card, Kpi, Money, Num, PageHeader } from '../components/ui';
import { calcMargin, calcOpenings, calcQuote, calcSliding } from '../engine/calcs';
import { useApp } from '../store/AppContext';

const tiles = [
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
  ['/configure', 'Configurator', 'Mode quote: size → type → glass → colour'],
  ['/compare', '09 Compare', 'UPVC vs Aluminium'],
  ['/margin', '10 Margin', 'Cost stack vs quoted amount'],
  ['/mesh', '11 Mesh & Grill', 'Add-on mesh / grill'],
  ['/labour', '12 Labour', 'Fab + install labour'],
  ['/builder', '13 Builder', 'Bulk / tower estimator'],
  ['/revision', '14 Price Revision', 'Input cost change impact'],
  ['/dashboard', '15 Dashboard', 'Cross-tool KPIs'],
  ['/settings', 'Settings', 'Series, rates, masters, GST'],
];

export function HomePage() {
  const { state } = useApp();
  const openings = calcOpenings(state);
  const sliding = calcSliding(state);
  const quote = calcQuote(state);
  const margin = calcMargin(state);

  return (
    <div>
      <PageHeader
        title="Fabricator Toolkit"
        subtitle="Set series & rates in Settings → enter sizes on tools → BOQ, quote & margin calculate automatically."
        badge="Local · localStorage"
      />
      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Chargeable sqft" value={<Num n={openings.totalChargeable} />} hint={`${openings.totalWindows} windows`} />
        <Kpi label="Openings estimate" value={<Money n={openings.totalEstimate} />} />
        <Kpi label="Sliding demo total" value={<Money n={sliding.totalAll} />} hint={`${sliding.pricePerSqft}/sqft target`} />
        <Kpi label="Quote after discount" value={<Money n={quote.afterDiscount} />} hint={`Margin ${NumInline(margin.marginPct)}`} />
      </div>
      <Card title="How to use">
        <ol className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
          <li>Open <Link to="/settings/series">Settings → Series</Link> and confirm / edit Series A / B members & rates.</li>
          <li>Edit glass, hardware, window-type ₹/sqft, mesh/install add-ons, GST under Settings.</li>
          <li>
            End-to-end: <Link to="/leads">Leads</Link> → <Link to="/site-measure">Site Measure</Link> (Push) →{' '}
            <Link to="/openings">01 Openings</Link> → <Link to="/quote">08 Quotation</Link> (Print).
          </li>
          <li>Or cost a single config on <Link to="/sliding">02 Sliding</Link> / <Link to="/casement">03 Casement</Link>, then check <Link to="/margin">10 Margin</Link>.</li>
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
