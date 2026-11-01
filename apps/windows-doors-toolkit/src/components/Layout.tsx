import { NavLink, Outlet } from 'react-router-dom';
import { activeCustomerMode } from '../engine/masterCatalogue';
import {
  isVendorFullAccess,
  settingsForMode,
  toolsForMode,
} from '../engine/modeAccess';
import { useApp } from '../store/AppContext';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Legend } from './ui';

export function Layout() {
  const { state } = useApp();
  const mode = activeCustomerMode(state);
  const fullAccess = isVendorFullAccess(state, mode);
  const tools = toolsForMode(fullAccess);
  const settings = settingsForMode(fullAccess);

  return (
    <div className="shell" data-customer-mode={mode} data-full-access={fullAccess ? '1' : '0'}>
      <aside className="sidebar" key={`nav-${mode}`}>
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
