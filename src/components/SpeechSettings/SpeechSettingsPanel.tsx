import type { Voice } from '../../services/speech/types'
import { LanguageSelector } from './LanguageSelector'
import { VoiceSelector } from './VoiceSelector'

interface SpeechSettingsPanelProps {
  language: string
  voiceURI: string | undefined
  voices: readonly Voice[]
  voicesLoaded: boolean
  onLanguageChange(language: string, voiceURI: string | undefined): void
  onVoiceChange(voiceURI: string): void
}

/** Groups language and voice selection (PRD §20/§21) in one settings row. */
export function SpeechSettingsPanel({
  language,
  voiceURI,
  voices,
  voicesLoaded,
  onLanguageChange,
  onVoiceChange,
}: SpeechSettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-room-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-6">
      <LanguageSelector language={language} voices={voices} onChange={onLanguageChange} />
      <VoiceSelector
        language={language}
        voiceURI={voiceURI}
        voices={voices}
        voicesLoaded={voicesLoaded}
        onChange={onVoiceChange}
      />
    </div>
  )
}
