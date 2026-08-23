import { useCallback, useEffect, useState } from 'react'
import { fetchAdminSettings, updateAdminSettings } from '../../services/admin/adminSettingsApi'
import type { AppSettings } from '../../types/admin'

export function useAdminSettings() {
  const [settings, setSettings] = useState<AppSettings | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const result = await fetchAdminSettings()
    setSettings(result)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(async (patch: Omit<AppSettings, 'updatedAt'>) => {
    const result = await updateAdminSettings(patch)
    setSettings(result)
    return result
  }, [])

  return { settings, loaded, refresh, save }
}
