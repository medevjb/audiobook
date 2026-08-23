import type { Pool, PoolClient } from 'pg'
import type { AdminUserSummary, AuthUser, UserRole, UserStatus } from '../../types.js'

export interface UserRecord extends AuthUser {
  passwordHash: string
  status: UserStatus
}

export async function createUser(pool: Pool, email: string, passwordHash: string): Promise<AuthUser> {
  const result = await pool.query<{ id: string; email: string; role: UserRole }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
    [email, passwordHash],
  )
  return result.rows[0]!
}

export async function findUserByEmail(pool: Pool, email: string): Promise<UserRecord | undefined> {
  const result = await pool.query<{ id: string; email: string; password_hash: string; role: UserRole; status: UserStatus }>(
    'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
    [email],
  )
  const row = result.rows[0]
  return row && { id: row.id, email: row.email, role: row.role, status: row.status, passwordHash: row.password_hash }
}

export async function findUserById(pool: Pool, id: string): Promise<AuthUser | undefined> {
  const result = await pool.query<{ id: string; email: string; role: UserRole }>(
    'SELECT id, email, role FROM users WHERE id = $1',
    [id],
  )
  return result.rows[0]
}

interface AdminUserRow {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: Date
}

function toAdminSummary(row: AdminUserRow): AdminUserSummary {
  return { id: row.id, email: row.email, role: row.role, status: row.status, createdAt: row.created_at.getTime() }
}

export async function listUsersForAdmin(
  pool: Pool,
  params: { q?: string; limit: number; offset: number },
): Promise<AdminUserSummary[]> {
  const result = await pool.query<AdminUserRow>(
    `SELECT id, email, role, status, created_at FROM users
     WHERE ($1::text IS NULL OR email ILIKE '%' || $1 || '%')
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [params.q ?? null, params.limit, params.offset],
  )
  return result.rows.map(toAdminSummary)
}

export async function getUserDetailForAdmin(pool: Pool, userId: string): Promise<AdminUserSummary | undefined> {
  const result = await pool.query<AdminUserRow>(
    'SELECT id, email, role, status, created_at FROM users WHERE id = $1',
    [userId],
  )
  const row = result.rows[0]
  return row && toAdminSummary(row)
}

export async function setUserStatus(
  client: PoolClient,
  userId: string,
  status: UserStatus,
): Promise<AdminUserSummary | undefined> {
  const result = await client.query<AdminUserRow>(
    'UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING id, email, role, status, created_at',
    [userId, status],
  )
  const row = result.rows[0]
  return row && toAdminSummary(row)
}

export async function setUserRole(
  client: PoolClient,
  userId: string,
  role: UserRole,
): Promise<AdminUserSummary | undefined> {
  const result = await client.query<AdminUserRow>(
    'UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING id, email, role, status, created_at',
    [userId, role],
  )
  const row = result.rows[0]
  return row && toAdminSummary(row)
}
