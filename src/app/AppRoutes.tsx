import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuditLogPage } from '../components/Admin/AdminAuditLogPage'
import { AdminDashboardPage } from '../components/Admin/AdminDashboardPage'
import { AdminLayout } from '../components/Admin/AdminLayout'
import { AdminSettingsPage } from '../components/Admin/AdminSettingsPage'
import { AdminUserDetailPage } from '../components/Admin/AdminUserDetailPage'
import { AdminUsersPage } from '../components/Admin/AdminUsersPage'
import { AuthScreen } from '../components/Auth/AuthScreen'
import { LandingPage } from '../components/Landing/LandingPage'
import { AppShell } from './AppShell'
import { RequireAdmin, RequireAuth, RequireGuest } from './routeGuards'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthScreen initialMode="login" />} />
        <Route path="/signup" element={<AuthScreen initialMode="signup" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit-log" element={<AdminAuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
