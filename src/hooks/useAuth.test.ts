import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/auth/authService'
import { useAuthStore } from '../store/authStore'
import { AppError } from '../utils/errors'
import { useAuth } from './useAuth'

vi.mock('../services/auth/authService')

const user = { id: 'u1', email: 'alice@example.com', role: 'user' as const }

beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.setState({ user: undefined, status: 'idle', error: undefined })
})

describe('useAuth', () => {
  it('checkSession resolves to authenticated when a session exists', async () => {
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue(user)

    const { result } = renderHook(() => useAuth())
    await result.current.checkSession()

    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('checkSession resolves to unauthenticated when there is no session', async () => {
    vi.mocked(authService.fetchCurrentUser).mockRejectedValue(new AppError('auth-required', 'Not signed in.'))

    const { result } = renderHook(() => useAuth())
    await result.current.checkSession()

    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useAuthStore.getState().user).toBeUndefined()
  })

  it('login sets the user and authenticated status on success', async () => {
    vi.mocked(authService.login).mockResolvedValue(user)

    const { result } = renderHook(() => useAuth())
    await result.current.login('alice@example.com', 'password123')

    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('login throws an AppError on failure without changing status', async () => {
    vi.mocked(authService.login).mockRejectedValue(new AppError('invalid-credentials', 'Incorrect email or password.'))

    const { result } = renderHook(() => useAuth())
    await expect(result.current.login('alice@example.com', 'wrong')).rejects.toMatchObject({
      code: 'invalid-credentials',
    })
    expect(useAuthStore.getState().status).toBe('idle')
  })

  it('signup sets the user and authenticated status on success', async () => {
    vi.mocked(authService.signup).mockResolvedValue(user)

    const { result } = renderHook(() => useAuth())
    await result.current.signup('alice@example.com', 'password123')

    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('logout clears the user even if the request fails', async () => {
    useAuthStore.setState({ user, status: 'authenticated' })
    vi.mocked(authService.logout).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useAuth())
    await result.current.logout()

    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useAuthStore.getState().user).toBeUndefined()
  })
})
