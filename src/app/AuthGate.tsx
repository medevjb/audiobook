import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-room">
      <span className="font-display text-xl text-ink-soft animate-pulse">Aloud</span>
    </div>
  )
}

/**
 * The session-check bootstrapper: resolves `authStore.status` once on mount,
 * showing a brief splash until it's known, then renders `children` — the
 * route tree (`AppRoutes`). Per-route auth requirements are enforced by
 * `routeGuards.tsx`, not here; this component no longer renders the login
 * screen itself (that moved to the `/login` route) since a public landing
 * page and admin sub-routes both need `authStore.status` resolved without
 * being redirected to a login screen that used to be the *only* thing an
 * unauthenticated visitor could see.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { checkSession } = useAuth()
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  if (status === 'idle' || status === 'checking') return <SplashScreen />
  return <>{children}</>
}
