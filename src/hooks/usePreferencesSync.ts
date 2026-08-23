import { useCallback, useMemo } from 'react'
import { upsertPreferences } from '../services/sync/preferencesApi'
import { useAuthStore } from '../store/authStore'
import { usePreferencesStore } from '../store/preferencesStore'

/**
 * Syncs global preferences to the account, kept out of `preferencesStore`
 * itself (unlike that store's existing localStorage persistence) so this new
 * async/service-touching code follows the architecture's hook-owns-async
 * rule rather than extending the store's existing exception to it.
 *
 * Best-effort: a failed sync never blocks or surfaces to the reading
 * experience — preferences are still saved locally either way.
 */
export function usePreferencesSync() {
  const save = useCallback(async () => {
    if (useAuthStore.getState().status !== 'authenticated') return
    await upsertPreferences(usePreferencesStore.getState().preferences).catch(() => undefined)
  }, [])

  return useMemo(() => ({ save }), [save])
}
