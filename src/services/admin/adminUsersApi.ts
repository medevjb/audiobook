import { apiFetch } from '../api/client'
import type { AdminUserSummary } from '../../types/admin'
import type { BookSummary } from '../../types/book'
import type { BookProgress } from '../../types/reader'
import type { UserRole } from '../../types/auth'

export function listUsers(params: { q?: string; limit?: number; offset?: number } = {}): Promise<AdminUserSummary[]> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.limit) query.set('limit', String(params.limit))
  if (params.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch<{ users: AdminUserSummary[] }>(`/admin/users${qs ? `?${qs}` : ''}`).then((res) => res.users)
}

export function getUser(id: string): Promise<AdminUserSummary> {
  return apiFetch<{ user: AdminUserSummary }>(`/admin/users/${encodeURIComponent(id)}`).then((res) => res.user)
}

export function suspendUser(id: string): Promise<AdminUserSummary> {
  return apiFetch<{ user: AdminUserSummary }>(`/admin/users/${encodeURIComponent(id)}/suspend`, { method: 'POST' }).then(
    (res) => res.user,
  )
}

export function reactivateUser(id: string): Promise<AdminUserSummary> {
  return apiFetch<{ user: AdminUserSummary }>(`/admin/users/${encodeURIComponent(id)}/reactivate`, {
    method: 'POST',
  }).then((res) => res.user)
}

export function changeUserRole(id: string, role: UserRole): Promise<AdminUserSummary> {
  return apiFetch<{ user: AdminUserSummary }>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PUT',
    json: { role },
  }).then((res) => res.user)
}

export function getUserLibrary(id: string): Promise<BookSummary[]> {
  return apiFetch<{ books: BookSummary[] }>(`/admin/users/${encodeURIComponent(id)}/library`).then((res) => res.books)
}

export function getUserProgress(id: string): Promise<BookProgress[]> {
  return apiFetch<{ progress: BookProgress[] }>(`/admin/users/${encodeURIComponent(id)}/progress`).then(
    (res) => res.progress,
  )
}
