import { create } from 'zustand'
import type { PlaybackStatus } from '../types/reader'
import type { SpeechChunk, Voice } from '../services/speech/types'

interface SpeechState {
  playback: PlaybackStatus
  /** Voices reported by the engine; empty until `voiceschanged` fires (PRD §20). */
  voices: Voice[]
  voicesLoaded: boolean
  /** Chunks for the current page, in reading order (PRD §15). */
  chunks: SpeechChunk[]
  /** Index of the chunk being spoken, for highlighting (PRD §23). */
  currentChunkIndex: number

  setPlayback(playback: PlaybackStatus): void
  setVoices(voices: Voice[]): void
  setChunks(chunks: SpeechChunk[]): void
  setCurrentChunkIndex(index: number): void
  reset(): void
}

const initialState = {
  playback: 'stopped' as PlaybackStatus,
  voices: [] as Voice[],
  voicesLoaded: false,
  chunks: [] as SpeechChunk[],
  currentChunkIndex: 0,
}

export const useSpeechStore = create<SpeechState>((set) => ({
  ...initialState,

  setPlayback(playback) {
    set({ playback })
  },

  setVoices(voices) {
    set({ voices, voicesLoaded: true })
  },

  setChunks(chunks) {
    set({ chunks, currentChunkIndex: 0 })
  },

  setCurrentChunkIndex(currentChunkIndex) {
    set({ currentChunkIndex })
  },

  reset() {
    set({ ...initialState })
  },
}))
