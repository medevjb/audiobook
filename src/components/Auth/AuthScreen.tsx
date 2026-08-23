import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthScreenProps {
  initialMode?: 'login' | 'signup'
}

/**
 * Rendered by the `/login` and `/signup` routes (both share this component,
 * distinguished only by `initialMode` — the internal toggle still works from
 * either entry point). Kept visually consistent with the "lit page" motif —
 * a paper-toned card in the dim room.
 */
export function AuthScreen({ initialMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)

  return (
    <div className="flex min-h-screen items-center justify-center bg-room px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[550px] w-[850px] rounded-full bg-gradient-to-tr from-amber-500/12 via-amber-600/6 to-transparent blur-3xl opacity-80" />
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-room-2/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent">
            Aloud
          </span>
          <p className="text-sm text-ink-soft">
            {mode === 'login' ? 'Sign in to continue your library.' : 'Create an account to sync your library.'}
          </p>
        </div>

        {mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
