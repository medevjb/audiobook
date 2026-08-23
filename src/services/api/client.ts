import { AppError } from '../../utils/errors'
import type { ReaderErrorCode } from '../../types/reader'

const KNOWN_CODES = new Set<ReaderErrorCode>([
  'auth-required',
  'invalid-credentials',
  'sync-failed',
  'account-suspended',
  'forbidden',
  'signups-disabled',
  'maintenance-mode',
  'password-too-short',
  'not-found',
])

function toKnownCode(code: string | undefined): ReaderErrorCode {
  return code && KNOWN_CODES.has(code as ReaderErrorCode) ? (code as ReaderErrorCode) : 'sync-failed'
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  json?: unknown
}

/**
 * The app's one adapter for the new "server" boundary, mirroring the rule
 * that only `services/` touches a browser API — here, `fetch`. Every failure
 * (network, HTTP, malformed body) is normalized into an `AppError` so
 * callers never branch on raw status codes.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'audiobook-app' },
      ...(options.json !== undefined && { body: JSON.stringify(options.json) }),
    })
  } catch (cause) {
    throw new AppError('sync-failed', 'Could not reach the server.', { cause })
  }

  if (response.status === 204) return undefined as T

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (!response.ok) {
    const errorBody = body as { error?: { code?: string; message?: string } } | undefined
    const fallbackCode: ReaderErrorCode = response.status === 401 ? 'auth-required' : 'sync-failed'
    const code = errorBody?.error?.code ? toKnownCode(errorBody.error.code) : fallbackCode
    throw new AppError(code, errorBody?.error?.message ?? 'Something went wrong talking to the server.')
  }

  return body as T
}
