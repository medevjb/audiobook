import type { Voice } from '../../services/speech/types'
import { LANGUAGES, allVoiceLanguages, pickDefaultVoice } from '../../utils/language'

interface LanguageSelectorProps {
  language: string
  voices: readonly Voice[]
  onChange(language: string, voiceURI: string | undefined): void
}

/**
 * Language selection (PRD §21). Offers the PRD's initial list plus any
 * language the device can actually speak but that list doesn't name — PRD §1
 * requires supporting "other languages supported by the user's browser".
 *
 * Changing the language re-picks the best matching voice for it (or clears
 * the voice entirely if none exists) rather than silently leaving the old
 * language's voice selected — PRD §22 must not pretend a voice exists.
 */
export function LanguageSelector({ language, voices, onChange }: LanguageSelectorProps) {
  const extra = allVoiceLanguages(voices).filter(
    (option) => !LANGUAGES.some((known) => known.code === option.code),
  )
  const options = [...LANGUAGES, ...extra]

  return (
    <label className="flex flex-col gap-1 text-sm text-ink-soft">
      Language
      <select
        value={language}
        onChange={(event) => {
          const next = event.target.value
          const fallback = pickDefaultVoice(voices, next)
          onChange(next, fallback?.voiceURI)
        }}
        className="rounded-md border border-white/10 bg-room-2 px-3 py-1.5 text-sm text-ink-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
