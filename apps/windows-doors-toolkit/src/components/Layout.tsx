import { NavLink, Outlet } from 'react-router-dom';
import { activeCustomerMode } from '../engine/masterCatalogue';
import { useApp } from '../store/AppContext';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Legend } from './ui';

const allTools = [
  { to: '/', label: 'Home', end: true },
  { to: '/leads', label: 'Leads' },
  { to: '/site-measure', label: 'Site Measure' },
  { to: '/openings', label: '01 Openings' },
  { to: '/sliding', label: '02 Sliding' },
  { to: '/casement', label: '03 Casement' },
  { to: '/doors', label: '04 Doors' },
  { to: '/cutting', label: '05 Cutting' },
  { to: '/glass', label: '06 Glass' },
  { to: '/hardware', label: '07 Hardware' },
  { to: '/quote', label: '08 Quotation' },
  { to: '/configure', label: 'Configurator' },
  { to: '/compare', label: '09 Compare' },
  { to: '/margin', label: '10 Margin' },
  { to: '/mesh', label: '11 Mesh & Grill' },
  { to: '/labour', label: '12 Labour' },
  { to: '/builder', label: '13 Builder' },
  { to: '/revision', label: '14 Price Revision' },
  { to: '/dashboard', label: '15 Dashboard' },
];

/** Home owner / Architect / Builder: quote path only. Vendor: full software. */
const quotePathTools = [
  { to: '/', label: 'Home', end: true },
  { to: '/configure', label: 'Configurator' },
  { to: '/leads', label: 'Leads' },
  { to: '/quote', label: '08 Quotation' },
];

const allSettings = [
  { to: '/settings', label: 'Overview' },
  { to: '/settings/master', label: 'Master catalogue' },
  { to: '/settings/business', label: 'Business / GST' },
  { to: '/settings/allowances', label: 'Allowances' },
  { to: '/settings/series', label: 'Series & members' },
  { to: '/stock', label: 'Series stock' },
  { to: '/settings/window-types', label: 'Window types' },
  { to: '/settings/glass', label: 'Glass types' },
  { to: '/settings/colours', label: 'Colours / finish' },
  { to: '/settings/hardware', label: 'Hardware catalogue' },
  { to: '/settings/profiles', label: 'Profiles catalogue' },
  { to: '/settings/data', label: 'Export / Import' },
];

const quotePathSettings = [
  { to: '/settings', label: 'Overview' },
  { to: '/settings/master', label: 'Master catalogue' },
  { to: '/settings/colours', label: 'Colours / finish' },
  { to: '/settings/allowances', label: 'Mode pricing' },
  { to: '/settings/data', label: 'Export / Import' },
];

export function Layout() {
  const { state } = useApp();
  const mode = activeCustomerMode(state);
  const fullAccess = mode === 'vendor';
  const tools = fullAccess ? allTools : quotePathTools;
  const settings = fullAccess ? allSettings : quotePathSettings;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Windows & Doors</strong>
          <span>Fabricator Toolkit</span>
        </div>
        {!fullAccess ? (
          <p className="nav-mode-hint">
            Mode quote path · switch to <em>Vendor</em> for full tools
          </p>
        ) : (
          <p className="nav-mode-hint">Vendor · full software access</p>
        )}
        <nav>
          <div className="nav-group">Tools</div>
          {tools.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
            >
              {t.label}
            </NavLink>
          ))}
          <div className="nav-group">Settings / Manage</div>
          {settings.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/settings'}
              className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <ProjectSwitcher />
        <Legend />
        <Outlet />
      </main>
    </div>
  );
}
