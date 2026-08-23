import { useCallback, useMemo } from 'react'
import * as authService from '../services/auth/authService'
import { useAuthStore } from '../store/authStore'
import { toAppError } from '../utils/errors'

/**
 * All async auth orchestration — the store itself stays a pure reducer.
 * Mirrors `useReadingProgress`'s shape: callers invoke these at the moments
 * that matter rather than the hook reactively watching anything.
 */
export function useAuth() {
  const checkSession = useCallback(async () => {
    useAuthStore.getState().setStatus('checking')
    try {
      const user = await authService.fetchCurrentUser()
      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setStatus('authenticated')
    } catch {
      useAuthStore.getState().setUser(undefined)
      useAuthStore.getState().setStatus('unauthenticated')
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const user = await authService.login(email, password)
      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setStatus('authenticated')
      useAuthStore.getState().setError(undefined)
    } catch (cause) {
      throw toAppError(cause, 'invalid-credentials', 'Incorrect email or password.')
    }
  }, [])

  const signup = useCallback(async (email: string, password: string) => {
    try {
      const user = await authService.signup(email, password)
      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setStatus('authenticated')
      useAuthStore.getState().setError(undefined)
    } catch (cause) {
      throw toAppError(cause, 'sync-failed', 'Could not create your account.')
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined)
    useAuthStore.getState().setUser(undefined)
    useAuthStore.getState().setStatus('unauthenticated')
  }, [])

  return useMemo(() => ({ checkSession, login, signup, logout }), [checkSession, login, signup, logout])
}
