import { apiFetch } from '../api/client'

/** Authenticated — any signed-in user, not admin-only. */
export function fetchAllowedLanguages(): Promise<string[]> {
  return apiFetch<{ languages: string[] }>('/settings/languages').then((res) => res.languages)
}
