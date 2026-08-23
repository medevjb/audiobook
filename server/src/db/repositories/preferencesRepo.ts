import type { Pool } from 'pg'
import type { UserPreferencesDto } from '../../types.js'

interface PreferencesRow {
  language: string
  voice_uri: string | null
  rate: number
  auto_advance: boolean
}

const DEFAULT_PREFERENCES: UserPreferencesDto = { language: 'en', rate: 1.0, autoAdvance: true }

function toDto(row: PreferencesRow): UserPreferencesDto {
  return {
    language: row.language,
    rate: row.rate,
    autoAdvance: row.auto_advance,
    ...(row.voice_uri !== null && { voiceURI: row.voice_uri }),
  }
}

export async function getPreferences(pool: Pool, userId: string): Promise<UserPreferencesDto> {
  const result = await pool.query<PreferencesRow>(
    'SELECT language, voice_uri, rate, auto_advance FROM user_preferences WHERE user_id = $1',
    [userId],
  )
  const row = result.rows[0]
  return row ? toDto(row) : DEFAULT_PREFERENCES
}

export async function upsertPreferences(
  pool: Pool,
  userId: string,
  preferences: UserPreferencesDto,
): Promise<UserPreferencesDto> {
  const result = await pool.query<PreferencesRow>(
    `INSERT INTO user_preferences (user_id, language, voice_uri, rate, auto_advance)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       language = EXCLUDED.language, voice_uri = EXCLUDED.voice_uri, rate = EXCLUDED.rate,
       auto_advance = EXCLUDED.auto_advance, updated_at = now()
     RETURNING language, voice_uri, rate, auto_advance`,
    [userId, preferences.language, preferences.voiceURI ?? null, preferences.rate, preferences.autoAdvance],
  )
  return toDto(result.rows[0]!)
}
