import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close drawer on route change (mobile).
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Escape closes drawer.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  // Lock body scroll while drawer open on small screens.
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div
      className={`shell ${navOpen ? 'nav-open' : ''}`}
      data-customer-mode={mode}
      data-full-access={fullAccess ? '1' : '0'}
    >
      <button
        type="button"
        className="mobile-nav-toggle no-print"
        aria-label={navOpen ? 'Close toolkit menu' : 'Open toolkit menu'}
        aria-expanded={navOpen}
        aria-controls="toolkit-sidebar"
        onClick={() => setNavOpen((v) => !v)}
      >
        <span className="mobile-nav-toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="mobile-nav-toggle-label">{navOpen ? 'Close' : 'Menu'}</span>
      </button>

      {navOpen ? (
        <button
          type="button"
          className="nav-backdrop no-print"
          aria-label="Close toolkit menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside className="sidebar" id="toolkit-sidebar" key={`nav-${mode}`}>
        <div className="brand">
          <strong>Windows & Doors</strong>
          <span>Fabricator Toolkit</span>
        </div>
        {!fullAccess ? (
          <p className="nav-mode-hint">
            Mode quote path · shared masters editable · <em>Vendor</em> unlocks fab tools
          </p>
        ) : (
          <p className="nav-mode-hint">Vendor · full software · private rate overrides on</p>
        )}
        <nav>
          <div className="nav-group">Tools</div>
          {tools.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
              onClick={() => setNavOpen(false)}
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
              onClick={() => setNavOpen(false)}
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
