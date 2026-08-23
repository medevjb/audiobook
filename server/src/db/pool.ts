import { Pool, type PoolClient } from 'pg'
import { env } from '../env.js'

export const pool = new Pool({ connectionString: env.DATABASE_URL })

/**
 * Runs `fn` inside a transaction. Admin mutations use this to write their
 * data change and its `audit_log` row atomically — an action and its audit
 * record can never diverge.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
