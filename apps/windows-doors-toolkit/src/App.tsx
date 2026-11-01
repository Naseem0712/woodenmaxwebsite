import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CasementPage } from './pages/Casement';
import { ConfiguratorPage } from './pages/Configurator';
import { HomePage } from './pages/Home';
import { LeadsPage } from './pages/Leads';
import { OpeningsPage } from './pages/Openings';
import { SiteMeasurePage } from './pages/SiteMeasure';
import { SlidingPage } from './pages/Sliding';
import { SettingsColoursPage } from './pages/settings/Colours';
import {
  BuilderPage,
  ComparePage,
  CuttingPage,
  DashboardPage,
  DoorsPage,
  GlassPage,
  HardwarePage,
  LabourPage,
  MarginPage,
  MeshPage,
  QuotePage,
  RevisionPage,
} from './pages/ToolsRest';
import { SettingsAllowancesPage } from './pages/settings/Allowances';
import { SettingsBusinessPage } from './pages/settings/Business';
import { SettingsDataPage } from './pages/settings/DataIO';
import { SettingsGlassTypesPage } from './pages/settings/GlassTypes';
import { SettingsHardwareCataloguePage } from './pages/settings/HardwareCatalogue';
import { SettingsMasterCataloguePage } from './pages/settings/MasterCatalogue';
import { SettingsOverviewPage } from './pages/settings/Overview';
import { SettingsProfilesPage } from './pages/settings/Profiles';
import { SettingsSeriesPage } from './pages/settings/Series';
import { SettingsWindowTypesPage } from './pages/settings/WindowTypes';
import { StockPage } from './pages/Stock';
import { AppProvider } from './store/AppContext';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="site-measure" element={<SiteMeasurePage />} />
            <Route path="openings" element={<OpeningsPage />} />
            <Route path="sliding" element={<SlidingPage />} />
            <Route path="casement" element={<CasementPage />} />
            <Route path="doors" element={<DoorsPage />} />
            <Route path="cutting" element={<CuttingPage />} />
            <Route path="glass" element={<GlassPage />} />
            <Route path="hardware" element={<HardwarePage />} />
            <Route path="quote" element={<QuotePage />} />
            <Route path="configure" element={<ConfiguratorPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="margin" element={<MarginPage />} />
            <Route path="mesh" element={<MeshPage />} />
            <Route path="labour" element={<LabourPage />} />
            <Route path="builder" element={<BuilderPage />} />
            <Route path="revision" element={<RevisionPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsOverviewPage />} />
            <Route path="settings/master" element={<SettingsMasterCataloguePage />} />
            <Route path="settings/business" element={<SettingsBusinessPage />} />
            <Route path="settings/allowances" element={<SettingsAllowancesPage />} />
            <Route path="settings/series" element={<SettingsSeriesPage />} />
            <Route path="settings/window-types" element={<SettingsWindowTypesPage />} />
            <Route path="settings/glass" element={<SettingsGlassTypesPage />} />
            <Route path="settings/colours" element={<SettingsColoursPage />} />
            <Route path="settings/hardware" element={<SettingsHardwareCataloguePage />} />
            <Route path="settings/profiles" element={<SettingsProfilesPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="settings/data" element={<SettingsDataPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
