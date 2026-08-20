import { useEffect, useState } from 'react'
import type { Voice } from '../../services/speech/types'
import {
  filterVoicesByLanguage,
  formatVoiceLabel,
  languageLabel,
  prioritizeVoicesByLanguage,
} from '../../utils/language'

interface VoiceSelectorProps {
  language: string
  voiceURI: string | undefined
  voices: readonly Voice[]
  voicesLoaded: boolean
  onChange(voiceURI: string): void
}

/**
 * Voice selection (PRD §20/§22). Defaults to voices matching the selected
 * language only; if none exist, shows the required warning instead of a
 * misleadingly empty dropdown, with an explicit "show all" escape hatch
 * rather than ever silently substituting a voice the user didn't choose.
 */
export function VoiceSelector({ language, voiceURI, voices, voicesLoaded, onChange }: VoiceSelectorProps) {
  const [showAll, setShowAll] = useState(false)

  // A language change invalidates the previous "show all" decision — the
  // new language might have a real match, so start from the warning state
  // again rather than carrying an unrelated expansion forward.
  useEffect(() => setShowAll(false), [language])

  if (!voicesLoaded) {
    return <p className="text-sm text-ink-soft">Loading voices…</p>
  }

  // Distinct from "no match for this language": nothing to fall back to at
  // all, so there is no "show all" to offer (PRD §35 "no voices available").
  if (voices.length === 0) {
    return (
      <p className="text-sm text-rose">
        No voices are available on this device. Text-to-speech cannot play here.
      </p>
    )
  }

  const matching = filterVoicesByLanguage(voices, language)
  const hasMatch = matching.length > 0

  if (!hasMatch && !showAll) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-rose-soft/40 bg-rose-soft/20 p-3 text-sm">
        <p className="text-rose text-xs font-medium">No {languageLabel(language)} voice is available on this device.</p>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start rounded text-xs font-medium text-brass underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          Show all available voices
        </button>
      </div>
    )
  }

  const baseOptions = hasMatch ? matching : prioritizeVoicesByLanguage(voices, language)
  const activeVoice = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined
  const options =
    activeVoice && !baseOptions.some((v) => v.voiceURI === voiceURI)
      ? [activeVoice, ...baseOptions]
      : baseOptions

  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft min-w-0">
      <div className="flex items-center justify-between">
        <span>Voice</span>
        {hasMatch && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[0.7rem] font-normal normal-case text-ink-soft hover:text-brass transition-colors"
          >
            Show all ({voices.length})
          </button>
        ) : hasMatch && showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-[0.7rem] font-normal normal-case text-ink-soft hover:text-brass transition-colors"
          >
            Show {languageLabel(language)} only
          </button>
        ) : null}
      </div>
      <select
        value={voiceURI ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 truncate rounded-lg border border-[var(--color-border)] bg-room px-3 py-2 text-sm font-normal text-ink-strong transition-colors hover:border-brass/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {!voiceURI && <option value="">Select a voice…</option>}
        {options.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI} className="bg-room-2 text-ink">
            {formatVoiceLabel(voice)}
          </option>
        ))}
      </select>
    </label>
  )
}
