import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/** Wraps routes that require a signed-in session — the reader app, the admin panel. */
export function RequireAuth() {
  const status = useAuthStore((state) => state.status)
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  return <Outlet />
}

/** Wraps routes only for signed-out visitors — the landing page, login, signup. */
export function RequireGuest() {
  const status = useAuthStore((state) => state.status)
  if (status === 'authenticated') return <Navigate to="/app" replace />
  return <Outlet />
}

/**
 * Wraps the admin panel. This is UX only — `requireAdmin` on the server is
 * the actual security boundary; a non-admin who somehow reaches this client
 * code still can't get any admin API to return data.
 */
export function RequireAdmin() {
  const status = useAuthStore((state) => state.status)
  const role = useAuthStore((state) => state.user?.role)
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/app" replace />
  return <Outlet />
}
