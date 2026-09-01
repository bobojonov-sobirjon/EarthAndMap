import { Navigate, Route, Routes } from 'react-router-dom'
import { IntroGate } from './components/useIntroGate'
import Layout from './components/Layout'
import AdminLayout from './admin/AdminLayout'
import AdminHome from './admin/AdminHome'
import AdminImportPage from './admin/AdminImportPage'
import AdminImportGuidePage from './admin/AdminImportGuidePage'
import AdminUrbanizationMapsPage from './admin/AdminUrbanizationMapsPage'
import {
  AdminApplicationSitesPage,
  AdminApplicationTypesPage,
  AdminBoundariesPage,
  AdminCategoriesPage,
  AdminChangesPage,
  AdminIssuesPage,
  AdminLandsPage,
  AdminMahallasPage,
  AdminNoticesPage,
  AdminRecordsPage,
  AdminUsersPage,
  AdminVersionsPage,
  AdminYearsPage,
} from './admin/AdminPages'
import ComparePage from './pages/ComparePage'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import LandsPage from './pages/LandsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import MonitoringPage from './pages/MonitoringPage'
import ProblemsPage from './pages/ProblemsPage'
import UrbanizationPage from './pages/UrbanizationPage'
import { useAuth } from './context/AuthContext'

function App() {
  const { loading } = useAuth()

  return (
    <IntroGate loading={loading}>
      <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-panel" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="map" element={<MapPage editable />} />
              <Route path="import" element={<AdminImportPage />} />
              <Route path="import-guide" element={<AdminImportGuidePage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="lands" element={<AdminLandsPage />} />
              <Route path="boundaries" element={<AdminBoundariesPage />} />
              <Route path="mahallas" element={<AdminMahallasPage />} />
              <Route path="years" element={<AdminYearsPage />} />
              <Route path="versions" element={<AdminVersionsPage />} />
              <Route path="records" element={<AdminRecordsPage />} />
              <Route path="urbanization" element={<AdminUrbanizationMapsPage />} />
              <Route path="issues" element={<AdminIssuesPage />} />
              <Route path="application-types" element={<AdminApplicationTypesPage />} />
              <Route path="application-sites" element={<AdminApplicationSitesPage />} />
              <Route path="changes" element={<AdminChangesPage />} />
              <Route path="notices" element={<AdminNoticesPage />} />
            </Route>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="lands" element={<LandsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="urbanization" element={<UrbanizationPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="problems" element={<ProblemsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
      </Routes>
    </IntroGate>
  )
}

export default App
