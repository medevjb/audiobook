import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { isAppError } from '../../utils/errors'

interface SignupFormProps {
  onSwitchToLogin(): void
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      await signup(email, password)
    } catch (cause) {
      setError(isAppError(cause) ? cause.message : 'Something went wrong creating your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-email" className="text-xs font-semibold text-ink-soft">Email</label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-room-3/60 px-3.5 py-2.5 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-xs font-semibold text-ink-soft">Password</label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-room-3/60 px-3.5 py-2.5 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        />
        <span className="text-[0.7rem] text-ink-soft">At least 8 characters.</span>
      </div>

      {error && <p role="alert" className="text-sm text-rose">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-room shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/35 disabled:opacity-60 cursor-pointer"
      >
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-xs font-medium text-ink-soft hover:text-brass-strong transition-colors cursor-pointer"
      >
        Already have an account? Sign in
      </button>
    </form>
  )
}
