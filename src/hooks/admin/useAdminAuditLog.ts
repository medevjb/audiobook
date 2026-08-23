import { useCallback, useEffect, useState } from 'react'
import { fetchAuditLog } from '../../services/admin/adminAuditLogApi'
import type { AuditLogEntry } from '../../types/admin'

export function useAdminAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const result = await fetchAuditLog({ limit: 100 })
    setEntries(result)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { entries, loaded, refresh }
}
