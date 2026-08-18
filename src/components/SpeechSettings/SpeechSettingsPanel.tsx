import type { Voice } from '../../services/speech/types'
import { LanguageSelector } from './LanguageSelector'
import { SpeedControl } from './SpeedControl'
import { VoiceSelector } from './VoiceSelector'

interface SpeechSettingsPanelProps {
  language: string
  voiceURI: string | undefined
  rate: number
  voices: readonly Voice[]
  voicesLoaded: boolean
  onLanguageChange(language: string, voiceURI: string | undefined): void
  onVoiceChange(voiceURI: string): void
  onRateChange(rate: number): void
}

/** Groups language, voice, and speed selection (PRD §19/§20/§21) in one settings row. */
export function SpeechSettingsPanel({
  language,
  voiceURI,
  rate,
  voices,
  voicesLoaded,
  onLanguageChange,
  onVoiceChange,
  onRateChange,
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
      <SpeedControl rate={rate} onChange={onRateChange} />
    </div>
  )
}
