import type { UserRole } from './auth'

export type UserStatus = 'active' | 'suspended'

export interface AdminUserSummary {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: number
}

export interface AppSettings {
  siteName: string
  tagline: string
  logoUrl?: string
  sessionTtlHours: number
  minPasswordLength: number
  signupsEnabled: boolean
  maintenanceMode: boolean
  maintenanceMessage?: string
  allowedLanguages: string[]
  updatedAt: number
}

export interface PublicSettings {
  siteName: string
  tagline: string
  logoUrl?: string
}

export interface AuditLogEntry {
  id: string
  actorEmail: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: unknown
  createdAt: number
}
