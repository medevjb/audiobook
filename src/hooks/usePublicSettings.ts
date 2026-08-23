import { useEffect, useState } from 'react'
import { fetchPublicSettings } from '../services/settings/publicSettingsApi'
import type { PublicSettings } from '../types/admin'

const DEFAULTS: PublicSettings = {
  siteName: 'Aloud',
  tagline: 'Turn any PDF into a natural, immersive reading and listening experience.',
}

/** Branding for the pre-login landing page. Falls back to the same defaults the DB seeds. */
export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULTS)

  useEffect(() => {
    fetchPublicSettings()
      .then(setSettings)
      .catch(() => undefined)
  }, [])

  return settings
}
