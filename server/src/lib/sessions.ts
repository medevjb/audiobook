import type { CookieOptions } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { env } from '../env.js'

export const COOKIE_NAME = env.SESSION_COOKIE_NAME

/**
 * TTL is passed in, sourced from `app_settings.session_ttl_hours` at the
 * moment a session is created — not a static env-derived constant, so an
 * admin changing the security policy takes effect for newly created sessions
 * without needing to touch every live session row.
 */
export function sessionCookieOptions(ttlHours: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttlHours * 60 * 60 * 1000,
  }
}

/** A fresh, unguessable raw token — this is what goes in the cookie. Never stored as-is. */
export function createSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/** Only this hash is persisted, so a DB read/leak alone can't be replayed as a live session. */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}
