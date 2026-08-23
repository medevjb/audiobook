import { apiFetch } from '../api/client'
import type { UserPreferences } from '../../types/preferences'

export function fetchPreferences(): Promise<UserPreferences> {
  return apiFetch<{ preferences: UserPreferences }>('/preferences').then((res) => res.preferences)
}

export function upsertPreferences(preferences: UserPreferences): Promise<UserPreferences> {
  return apiFetch<{ preferences: UserPreferences }>('/preferences', { method: 'PUT', json: preferences }).then(
    (res) => res.preferences,
  )
}
