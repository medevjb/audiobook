import { config } from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeEach } from 'vitest'

// Must run before any module that reads process.env (env.ts) is evaluated.
// Static imports are hoisted in ESM, so those modules are loaded dynamically
// here, after config(), rather than via a top-level `import`.
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env.test') })

const { pool } = await import('../db/pool.js')
const { runMigrations } = await import('../db/migrate.js')

await runMigrations(pool)

beforeEach(async () => {
  // app_settings.updated_by references users(id), so TRUNCATE users CASCADE
  // below also wipes the app_settings singleton row (CASCADE follows FKs
  // *into* app_settings, regardless of whether it's named in the TRUNCATE
  // list). Re-seed it with an upsert afterward rather than an UPDATE, since
  // the row may not exist at that point.
  await pool.query(
    'TRUNCATE users, sessions, library_books, reading_progress, user_preferences, audit_log RESTART IDENTITY CASCADE',
  )
  await pool.query(`
    INSERT INTO app_settings (id, site_name, tagline, logo_url, session_ttl_hours, min_password_length, signups_enabled, maintenance_mode, maintenance_message, allowed_languages, updated_at, updated_by)
    VALUES (1, 'Aloud', 'Turn any PDF into a natural, immersive reading and listening experience.', NULL, 720, 8, true, false, NULL, ARRAY['en','bn','fr','zh','es','de','hi','ar','ja','pt','it','ko'], now(), NULL)
    ON CONFLICT (id) DO UPDATE SET
      site_name = EXCLUDED.site_name,
      tagline = EXCLUDED.tagline,
      logo_url = EXCLUDED.logo_url,
      session_ttl_hours = EXCLUDED.session_ttl_hours,
      min_password_length = EXCLUDED.min_password_length,
      signups_enabled = EXCLUDED.signups_enabled,
      maintenance_mode = EXCLUDED.maintenance_mode,
      maintenance_message = EXCLUDED.maintenance_message,
      allowed_languages = EXCLUDED.allowed_languages,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `)
})

afterAll(async () => {
  await pool.end()
})

export { pool }
