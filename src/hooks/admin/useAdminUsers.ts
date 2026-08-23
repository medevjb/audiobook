import { useCallback, useEffect, useState } from 'react'
import { listUsers } from '../../services/admin/adminUsersApi'
import type { AdminUserSummary } from '../../types/admin'

/** Same fetch/refresh shape as `useLibrary` — the list of accounts, searchable by email. */
export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')

  const refresh = useCallback(async () => {
    const result = await listUsers({ q: query || undefined, limit: 100 })
    setUsers(result)
    setLoaded(true)
  }, [query])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { users, loaded, query, setQuery, refresh }
}
