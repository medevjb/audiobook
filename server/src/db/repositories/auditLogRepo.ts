import type { Pool, PoolClient } from 'pg'
import type { AuditLogEntryDto } from '../../types.js'

export interface AuditLogRecordParams {
  actorUserId: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: unknown
}

export async function record(client: PoolClient, params: AuditLogRecordParams): Promise<void> {
  await client.query(
    'INSERT INTO audit_log (actor_user_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)',
    [
      params.actorUserId,
      params.action,
      params.targetType ?? null,
      params.targetId ?? null,
      params.metadata !== undefined ? JSON.stringify(params.metadata) : null,
    ],
  )
}

interface AuditLogRow {
  id: string
  actor_email: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: unknown
  created_at: Date
}

export async function list(pool: Pool, params: { limit: number; offset: number }): Promise<AuditLogEntryDto[]> {
  const result = await pool.query<AuditLogRow>(
    `SELECT a.id, u.email AS actor_email, a.action, a.target_type, a.target_id, a.metadata, a.created_at
     FROM audit_log a
     JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [params.limit, params.offset],
  )
  return result.rows.map((row) => ({
    id: row.id,
    actorEmail: row.actor_email,
    action: row.action,
    createdAt: row.created_at.getTime(),
    ...(row.target_type !== null && { targetType: row.target_type }),
    ...(row.target_id !== null && { targetId: row.target_id }),
    ...(row.metadata !== null && row.metadata !== undefined && { metadata: row.metadata }),
  }))
}
