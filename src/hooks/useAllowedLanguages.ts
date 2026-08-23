import { useEffect, useState } from 'react'
import { fetchAllowedLanguages } from '../services/settings/languagesApi'
import { LANGUAGES } from '../utils/language'

const ALL_CODES = LANGUAGES.map((l) => l.code)

/**
 * The admin-controlled language allowlist for the reader's language
 * selector. Defaults to every known language while loading or on failure —
 * a fetch error must never make the selector show nothing.
 */
export function useAllowedLanguages(): string[] {
  const [codes, setCodes] = useState<string[]>(ALL_CODES)

  useEffect(() => {
    fetchAllowedLanguages()
      .then(setCodes)
      .catch(() => undefined)
  }, [])

  return codes
}
