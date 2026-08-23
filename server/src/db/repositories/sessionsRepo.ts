import type { Pool } from 'pg'
import type { UserRole, UserStatus } from '../../types.js'

export interface SessionRecord {
  userId: string
  tokenHash: string
  role: UserRole
  status: UserStatus
}

export async function createSession(
  pool: Pool,
  params: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string },
): Promise<void> {
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at, user_agent, ip) VALUES ($1, $2, $3, $4, $5)',
    [params.tokenHash, params.userId, params.expiresAt, params.userAgent ?? null, params.ip ?? null],
  )
}

export async function findValidSessionByTokenHash(pool: Pool, tokenHash: string): Promise<SessionRecord | undefined> {
  const result = await pool.query<{ user_id: string; token_hash: string; role: UserRole; status: UserStatus }>(
    `SELECT s.user_id, s.token_hash, u.role, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash],
  )
  const row = result.rows[0]
  return row && { userId: row.user_id, tokenHash: row.token_hash, role: row.role, status: row.status }
}

export async function touchSessionLastSeen(pool: Pool, tokenHash: string): Promise<void> {
  await pool.query('UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1', [tokenHash])
}

export async function deleteSessionByTokenHash(pool: Pool, tokenHash: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash])
}
