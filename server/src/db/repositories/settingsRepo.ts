import type { Pool, PoolClient } from 'pg'
import type { AppSettingsDto, PublicSettingsDto } from '../../types.js'

interface SettingsRow {
  site_name: string
  tagline: string
  logo_url: string | null
  session_ttl_hours: number
  min_password_length: number
  signups_enabled: boolean
  maintenance_mode: boolean
  maintenance_message: string | null
  allowed_languages: string[]
  updated_at: Date
}

const SELECT_COLUMNS =
  'site_name, tagline, logo_url, session_ttl_hours, min_password_length, signups_enabled, maintenance_mode, maintenance_message, allowed_languages, updated_at'

function toDto(row: SettingsRow): AppSettingsDto {
  return {
    siteName: row.site_name,
    tagline: row.tagline,
    sessionTtlHours: row.session_ttl_hours,
    minPasswordLength: row.min_password_length,
    signupsEnabled: row.signups_enabled,
    maintenanceMode: row.maintenance_mode,
    allowedLanguages: row.allowed_languages,
    updatedAt: row.updated_at.getTime(),
    ...(row.logo_url !== null && { logoUrl: row.logo_url }),
    ...(row.maintenance_message !== null && { maintenanceMessage: row.maintenance_message }),
  }
}

/** The singleton settings row (id=1) always exists — seeded by migration 0007. */
export async function getSettings(pool: Pool): Promise<AppSettingsDto> {
  const result = await pool.query<SettingsRow>(`SELECT ${SELECT_COLUMNS} FROM app_settings WHERE id = 1`)
  return toDto(result.rows[0]!)
}

export async function getPublicSettings(pool: Pool): Promise<PublicSettingsDto> {
  const result = await pool.query<{ site_name: string; tagline: string; logo_url: string | null }>(
    'SELECT site_name, tagline, logo_url FROM app_settings WHERE id = 1',
  )
  const row = result.rows[0]!
  return { siteName: row.site_name, tagline: row.tagline, ...(row.logo_url !== null && { logoUrl: row.logo_url }) }
}

/** Cheap, authenticated-only lookup for the reader's language selector — no need for the full settings row. */
export async function getAllowedLanguages(pool: Pool): Promise<string[]> {
  const result = await pool.query<{ allowed_languages: string[] }>('SELECT allowed_languages FROM app_settings WHERE id = 1')
  return result.rows[0]!.allowed_languages
}

export interface SettingsPatch {
  siteName: string
  tagline: string
  logoUrl?: string
  sessionTtlHours: number
  minPasswordLength: number
  signupsEnabled: boolean
  maintenanceMode: boolean
  maintenanceMessage?: string
  allowedLanguages: string[]
}

export async function updateSettings(
  client: PoolClient,
  patch: SettingsPatch,
  actorUserId: string,
): Promise<AppSettingsDto> {
  const result = await client.query<SettingsRow>(
    `UPDATE app_settings SET
       site_name = $1, tagline = $2, logo_url = $3, session_ttl_hours = $4, min_password_length = $5,
       signups_enabled = $6, maintenance_mode = $7, maintenance_message = $8, allowed_languages = $9,
       updated_at = now(), updated_by = $10
     WHERE id = 1
     RETURNING ${SELECT_COLUMNS}`,
    [
      patch.siteName,
      patch.tagline,
      patch.logoUrl ?? null,
      patch.sessionTtlHours,
      patch.minPasswordLength,
      patch.signupsEnabled,
      patch.maintenanceMode,
      patch.maintenanceMessage ?? null,
      patch.allowedLanguages,
      actorUserId,
    ],
  )
  return toDto(result.rows[0]!)
}
