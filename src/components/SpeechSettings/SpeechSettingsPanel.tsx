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
  allowedLanguageCodes: readonly string[]
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
  allowedLanguageCodes,
  onLanguageChange,
  onVoiceChange,
  onRateChange,
}: SpeechSettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--color-border)] bg-room-2/95 p-4 sm:p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
          <svg className="h-3.5 w-3.5 text-brass" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Voice & Playback
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LanguageSelector
          language={language}
          voices={voices}
          allowedCodes={allowedLanguageCodes}
          onChange={onLanguageChange}
        />
        <SpeedControl rate={rate} onChange={onRateChange} />
      </div>
      <div className="w-full min-w-0">
        <VoiceSelector
          language={language}
          voiceURI={voiceURI}
          voices={voices}
          voicesLoaded={voicesLoaded}
          onChange={onVoiceChange}
        />
      </div>
    </div>
  )
}
