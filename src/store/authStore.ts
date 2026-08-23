import { create } from 'zustand'
import type { AuthStatus, AuthUser } from '../types/auth'
import type { ReaderError } from '../types/reader'

interface AuthState {
  user?: AuthUser
  status: AuthStatus
  error?: ReaderError
  setUser(user: AuthUser | undefined): void
  setStatus(status: AuthStatus): void
  setError(error: ReaderError | undefined): void
}

/**
 * Pure state, no service calls — unlike `preferencesStore`, which hand-rolls
 * its own persistence. All async auth orchestration (signup/login/logout/
 * session check) lives in `useAuth`, following the architecture's "stores
 * never call a service" rule for every *new* store in this codebase.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  setUser(user) {
    set({ user })
  },
  setStatus(status) {
    set({ status })
  },
  setError(error) {
    set({ error })
  },
}))
