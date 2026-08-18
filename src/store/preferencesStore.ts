import { create } from 'zustand'
import type { UserPreferences } from '../types/preferences'
import { loadPreferences, savePreferences } from '../services/storage/preferencesStorage'

interface PreferencesState {
  preferences: UserPreferences
  /** Merges a change and persists it. The store is the only writer. */
  update(patch: Partial<UserPreferences>): void
}

/**
 * Global defaults (PRD §27). Per-book overrides live in `readerStore.progress`
 * and are combined by `resolveReadingSettings` — never merged into this store.
 */
export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: loadPreferences(),
  update(patch) {
    const preferences = { ...get().preferences, ...patch }
    set({ preferences })
    savePreferences(preferences)
  },
}))
