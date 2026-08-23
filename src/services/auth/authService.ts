import { apiFetch } from '../api/client'
import type { AuthUser } from '../../types/auth'

export function signup(email: string, password: string): Promise<AuthUser> {
  return apiFetch<{ user: AuthUser }>('/auth/signup', { method: 'POST', json: { email, password } }).then(
    (res) => res.user,
  )
}

export function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<{ user: AuthUser }>('/auth/login', { method: 'POST', json: { email, password } }).then(
    (res) => res.user,
  )
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' })
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<{ user: AuthUser }>('/auth/me').then((res) => res.user)
}
