import { apiFetch } from '../api/client'
import type { AuditLogEntry } from '../../types/admin'

export function fetchAuditLog(params: { limit?: number; offset?: number } = {}): Promise<AuditLogEntry[]> {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch<{ entries: AuditLogEntry[] }>(`/admin/audit-log${qs ? `?${qs}` : ''}`).then((res) => res.entries)
}
