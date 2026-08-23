import { apiFetch } from '../api/client'
import type { BookProgress } from '../../types/reader'

export function fetchProgress(limit = 50): Promise<BookProgress[]> {
  return apiFetch<{ progress: BookProgress[] }>(`/progress?limit=${limit}`).then((res) => res.progress)
}

export function upsertProgress(progress: BookProgress): Promise<BookProgress> {
  const { bookId, updatedAt: _updatedAt, ...body } = progress
  return apiFetch<{ progress: BookProgress }>(`/progress/${encodeURIComponent(bookId)}`, {
    method: 'PUT',
    json: body,
  }).then((res) => res.progress)
}

export function importProgress(progress: BookProgress[]): Promise<number> {
  return apiFetch<{ imported: number }>('/progress/import', { method: 'POST', json: { progress } }).then(
    (res) => res.imported,
  )
}
