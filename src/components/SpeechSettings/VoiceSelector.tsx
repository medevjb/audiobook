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

  const matching = filterVoicesByLanguage(voices, language)
  const hasMatch = matching.length > 0

  if (!hasMatch && !showAll) {
    return (
      <div className="flex flex-col gap-1.5 text-sm">
        <p className="text-rose">No {languageLabel(language)} voice is available on this device.</p>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start rounded px-1 text-brass underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          Show all available voices
        </button>
      </div>
    )
  }

  const options = hasMatch ? matching : prioritizeVoicesByLanguage(voices, language)

  return (
    <label className="flex flex-col gap-1 text-sm text-ink-soft">
      Voice
      <select
        value={voiceURI ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-white/10 bg-room-2 px-3 py-1.5 text-sm text-ink-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {!voiceURI && <option value="">Select a voice…</option>}
        {options.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {formatVoiceLabel(voice)}
          </option>
        ))}
      </select>
    </label>
  )
}
