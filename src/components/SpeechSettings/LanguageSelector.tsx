import type { Voice } from '../../services/speech/types'
import { LANGUAGES, allVoiceLanguages, pickDefaultVoice } from '../../utils/language'

interface LanguageSelectorProps {
  language: string
  voices: readonly Voice[]
  /** Admin-controlled subset of `LANGUAGES` to offer — see `useAllowedLanguages`. */
  allowedCodes: readonly string[]
  onChange(language: string, voiceURI: string | undefined): void
}

/**
 * Language selection (PRD §21). Offers the admin-allowed subset of the
 * curated list plus any language the device can actually speak but that
 * list doesn't name — PRD §1 requires supporting "other languages supported
 * by the user's browser", and that device fallback is never restricted by
 * the admin allowlist (it isn't a curated catalog to police, just what the
 * OS happens to offer).
 *
 * Changing the language re-picks the best matching voice for it (or clears
 * the voice entirely if none exists) rather than silently leaving the old
 * language's voice selected — PRD §22 must not pretend a voice exists.
 */
export function LanguageSelector({ language, voices, allowedCodes, onChange }: LanguageSelectorProps) {
  const allowed = LANGUAGES.filter((known) => allowedCodes.includes(known.code))
  const extra = allVoiceLanguages(voices).filter(
    (option) => !LANGUAGES.some((known) => known.code === option.code),
  )
  const options = [...allowed, ...extra]

  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft min-w-0">
      Language
      <select
        value={language}
        onChange={(event) => {
          const next = event.target.value
          const fallback = pickDefaultVoice(voices, next)
          onChange(next, fallback?.voiceURI)
        }}
        className="w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-room px-3 py-2 text-sm font-normal text-ink-strong transition-colors hover:border-brass/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code} className="bg-room-2 text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
