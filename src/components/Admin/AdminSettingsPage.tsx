import { useEffect, useState } from 'react'
import { useAdminSettings } from '../../hooks/admin/useAdminSettings'
import { isAppError } from '../../utils/errors'
import { LANGUAGES } from '../../utils/language'
import type { AppSettings } from '../../types/admin'

type FormState = Omit<AppSettings, 'updatedAt'>

function toFormState(settings: AppSettings): FormState {
  const { updatedAt: _updatedAt, ...rest } = settings
  return rest
}

export function AdminSettingsPage() {
  const { settings, loaded, save } = useAdminSettings()
  const [form, setForm] = useState<FormState | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | undefined>(undefined)

  useEffect(() => {
    if (settings) setForm(toFormState(settings))
  }, [settings])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function toggleLanguage(code: string) {
    setForm((prev) => {
      if (!prev) return prev
      const enabled = prev.allowedLanguages.includes(code)
      // At least one language must stay enabled — matches the server's own guard.
      if (enabled && prev.allowedLanguages.length === 1) return prev
      const allowedLanguages = enabled
        ? prev.allowedLanguages.filter((c) => c !== code)
        : [...prev.allowedLanguages, code]
      return { ...prev, allowedLanguages }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setFeedback(undefined)
    try {
      await save(form)
      setFeedback({ tone: 'success', message: 'Settings saved.' })
    } catch (cause) {
      setFeedback({ tone: 'error', message: isAppError(cause) ? cause.message : 'Could not save settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded || !form) return <p className="text-sm text-ink-soft">Loading…</p>

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-xl font-semibold text-ink-strong">Settings</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-room-2 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Branding</h2>
        <Field label="Site name">
          <input
            type="text"
            value={form.siteName}
            onChange={(e) => update('siteName', e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Tagline">
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => update('tagline', e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Logo URL (optional)">
          <input
            type="url"
            value={form.logoUrl ?? ''}
            onChange={(e) => update('logoUrl', e.target.value || undefined)}
            className={inputClass}
            placeholder="https://…"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-room-2 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Security policy</h2>
        <Field label="Session length (hours)">
          <input
            type="number"
            min={1}
            value={form.sessionTtlHours}
            onChange={(e) => update('sessionTtlHours', Number(e.target.value))}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Minimum password length">
          <input
            type="number"
            min={1}
            value={form.minPasswordLength}
            onChange={(e) => update('minPasswordLength', Number(e.target.value))}
            className={inputClass}
            required
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-room-2 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Languages</h2>
        <p className="text-xs text-ink-soft">
          Which languages the reader's language selector offers. At least one must stay enabled.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {LANGUAGES.map((lang) => {
            const checked = form.allowedLanguages.includes(lang.code)
            return (
              <label
                key={lang.code}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-room-3/40 px-3 py-2 text-sm text-ink-strong"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLanguage(lang.code)}
                  className="h-4 w-4 accent-brass"
                />
                {lang.label}
              </label>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-room-2 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Signup control</h2>
        <Toggle label="Signups enabled" checked={form.signupsEnabled} onChange={(v) => update('signupsEnabled', v)} />
        <Toggle label="Maintenance mode" checked={form.maintenanceMode} onChange={(v) => update('maintenanceMode', v)} />
        <Field label="Maintenance message (shown while maintenance mode is on)">
          <input
            type="text"
            value={form.maintenanceMessage ?? ''}
            onChange={(e) => update('maintenanceMessage', e.target.value || undefined)}
            className={inputClass}
          />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-room shadow-md transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {feedback && (
          <span className={`text-sm ${feedback.tone === 'success' ? 'text-emerald' : 'text-rose'}`}>
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  )
}

const inputClass =
  'rounded-xl border border-[var(--color-border)] bg-room-3/60 px-3.5 py-2.5 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-strong">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-brass' : 'bg-room-3'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
