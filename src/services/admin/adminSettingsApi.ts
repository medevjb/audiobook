import { apiFetch } from '../api/client'
import type { AppSettings } from '../../types/admin'

export function fetchAdminSettings(): Promise<AppSettings> {
  return apiFetch<{ settings: AppSettings }>('/admin/settings').then((res) => res.settings)
}

export function updateAdminSettings(patch: Omit<AppSettings, 'updatedAt'>): Promise<AppSettings> {
  return apiFetch<{ settings: AppSettings }>('/admin/settings', { method: 'PUT', json: patch }).then(
    (res) => res.settings,
  )
}
