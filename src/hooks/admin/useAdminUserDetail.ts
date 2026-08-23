import { useCallback, useEffect, useState } from 'react'
import {
  changeUserRole,
  getUser,
  getUserLibrary,
  getUserProgress,
  reactivateUser,
  suspendUser,
} from '../../services/admin/adminUsersApi'
import type { AdminUserSummary } from '../../types/admin'
import type { UserRole } from '../../types/auth'
import type { BookSummary } from '../../types/book'
import type { BookProgress } from '../../types/reader'

export function useAdminUserDetail(id: string | undefined) {
  const [user, setUser] = useState<AdminUserSummary | undefined>(undefined)
  const [library, setLibrary] = useState<BookSummary[]>([])
  const [progress, setProgress] = useState<BookProgress[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) return
    const [userResult, libraryResult, progressResult] = await Promise.all([
      getUser(id),
      getUserLibrary(id).catch(() => []),
      getUserProgress(id).catch(() => []),
    ])
    setUser(userResult)
    setLibrary(libraryResult)
    setProgress(progressResult)
    setLoaded(true)
  }, [id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const suspend = useCallback(async () => {
    if (!id) return
    setUser(await suspendUser(id))
  }, [id])

  const reactivate = useCallback(async () => {
    if (!id) return
    setUser(await reactivateUser(id))
  }, [id])

  const changeRole = useCallback(
    async (role: UserRole) => {
      if (!id) return
      setUser(await changeUserRole(id, role))
    },
    [id],
  )

  return { user, library, progress, loaded, refresh, suspend, reactivate, changeRole }
}
