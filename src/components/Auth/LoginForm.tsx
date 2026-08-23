import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { isAppError } from '../../utils/errors'

interface LoginFormProps {
  onSwitchToSignup(): void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (cause) {
      setError(isAppError(cause) ? cause.message : 'Something went wrong signing in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-xs font-semibold text-ink-soft">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-room-3/60 px-3.5 py-2.5 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-xs font-semibold text-ink-soft">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-room-3/60 px-3.5 py-2.5 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        />
      </div>

      {error && <p role="alert" className="text-sm text-rose">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-room shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/35 disabled:opacity-60 cursor-pointer"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <button
        type="button"
        onClick={onSwitchToSignup}
        className="text-xs font-medium text-ink-soft hover:text-brass-strong transition-colors cursor-pointer"
      >
        Don't have an account? Create one
      </button>
    </form>
  )
}
