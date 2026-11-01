import { NavLink, Outlet } from 'react-router-dom';
import { Legend } from './ui';

const tools = [
  { to: '/', label: 'Home', end: true },
  { to: '/openings', label: '01 Openings' },
  { to: '/sliding', label: '02 Sliding' },
  { to: '/casement', label: '03 Casement' },
  { to: '/doors', label: '04 Doors' },
  { to: '/cutting', label: '05 Cutting' },
  { to: '/glass', label: '06 Glass' },
  { to: '/hardware', label: '07 Hardware' },
  { to: '/quote', label: '08 Quotation' },
  { to: '/compare', label: '09 Compare' },
  { to: '/margin', label: '10 Margin' },
  { to: '/mesh', label: '11 Mesh & Grill' },
  { to: '/labour', label: '12 Labour' },
  { to: '/builder', label: '13 Builder' },
  { to: '/revision', label: '14 Price Revision' },
  { to: '/dashboard', label: '15 Dashboard' },
];

const settings = [
  { to: '/settings', label: 'Overview' },
  { to: '/settings/business', label: 'Business / GST' },
  { to: '/settings/allowances', label: 'Allowances' },
  { to: '/settings/series', label: 'Series & members' },
  { to: '/settings/window-types', label: 'Window types' },
  { to: '/settings/glass', label: 'Glass types' },
  { to: '/settings/hardware', label: 'Hardware catalogue' },
  { to: '/settings/profiles', label: 'Profiles stock' },
  { to: '/settings/data', label: 'Export / Import' },
];

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Windows & Doors</strong>
          <span>Fabricator Toolkit</span>
        </div>
        <nav>
          <div className="nav-group">Tools</div>
          {tools.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
              {t.label}
            </NavLink>
          ))}
          <div className="nav-group">Settings / Manage</div>
          {settings.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/settings'} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Legend />
        <Outlet />
      </main>
    </div>
  );
}
