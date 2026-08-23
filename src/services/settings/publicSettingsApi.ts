import { apiFetch } from '../api/client'
import type { PublicSettings } from '../../types/admin'

/** Unauthenticated — used by the landing page before anyone signs in. */
export function fetchPublicSettings(): Promise<PublicSettings> {
  return apiFetch<{ settings: PublicSettings }>('/settings/public').then((res) => res.settings)
}
