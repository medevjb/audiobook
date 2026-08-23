import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Pool } from 'pg'
import { pool } from './pool.js'

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db', 'migrations')

export async function runMigrations(targetPool: Pool): Promise<string[]> {
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const applied = new Set(
    (await targetPool.query<{ id: string }>('SELECT id FROM schema_migrations')).rows.map((row) => row.id),
  )

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const newlyApplied: string[] = []
  for (const file of files) {
    if (applied.has(file)) continue

    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    const client = await targetPool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file])
      await client.query('COMMIT')
      newlyApplied.push(file)
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error })
    } finally {
      client.release()
    }
  }

  return newlyApplied
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  const applied = await runMigrations(pool)
  if (applied.length === 0) {
    console.log('No pending migrations.')
  } else {
    console.log(`Applied ${applied.length} migration(s): ${applied.join(', ')}`)
  }
  await pool.end()
}
