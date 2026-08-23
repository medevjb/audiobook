import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

/**
 * Self-sufficient like `ThemeToggle` — reads `authStore` directly, no props.
 * Renders nothing if there's no user, which shouldn't normally happen since
 * `AuthGate` blocks unauthenticated access, but keeps this safe to render
 * unconditionally.
 */
export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const initial = user.email[0]?.toUpperCase() ?? '?'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
        title={user.email}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/25 bg-room-3/80 text-sm font-bold text-brass-strong shadow-xs transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/15 hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass cursor-pointer"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[var(--color-border)] bg-room-2 p-2 shadow-2xl">
            <p className="truncate px-2.5 py-1.5 text-xs text-ink-soft">{user.email}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                void logout()
              }}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-ink-strong transition-colors hover:bg-room-3 cursor-pointer"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
