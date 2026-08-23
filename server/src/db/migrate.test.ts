import { describe, expect, it } from 'vitest'
import { pool } from '../test/setup.js'
import { runMigrations } from './migrate.js'

describe('runMigrations', () => {
  it('is idempotent — a second run applies nothing', async () => {
    const first = await runMigrations(pool)
    expect(first).toEqual([])

    const second = await runMigrations(pool)
    expect(second).toEqual([])
  })
})
