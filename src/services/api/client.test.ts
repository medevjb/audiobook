import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('apiFetch', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends credentials and the required headers', async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(200, { ok: true }))

    await apiFetch('/health')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({ 'X-Requested-With': 'audiobook-app' }),
      }),
    )
  })

  it('serializes a json body for mutating requests', async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(200, { ok: true }))

    await apiFetch('/library/book-1', { method: 'PUT', json: { filename: 'a.pdf' } })

    const [, init] = vi.mocked(global.fetch).mock.calls[0]!
    expect(init?.body).toBe(JSON.stringify({ filename: 'a.pdf' }))
  })

  it('returns undefined for a 204 response', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiFetch('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('returns the parsed body on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(200, { books: [] }))
    await expect(apiFetch('/library')).resolves.toEqual({ books: [] })
  })

  it('maps a known error code from the response body', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse(401, { error: { code: 'auth-required', message: 'Not signed in.' } }),
    )

    await expect(apiFetch('/library')).rejects.toMatchObject({ code: 'auth-required', message: 'Not signed in.' })
  })

  it('falls back to auth-required for a 401 with no recognizable body', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('not json', { status: 401 }))
    await expect(apiFetch('/library')).rejects.toMatchObject({ code: 'auth-required' })
  })

  it('falls back to sync-failed for other error statuses', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 500 }))
    await expect(apiFetch('/library')).rejects.toMatchObject({ code: 'sync-failed' })
  })

  it('wraps a network failure as sync-failed', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiFetch('/library')).rejects.toMatchObject({ code: 'sync-failed' })
  })
})
