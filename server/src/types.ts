export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'suspended'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AdminUserSummary {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: number
}

export interface AppSettingsDto {
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

export interface PublicSettingsDto {
  siteName: string
  tagline: string
  logoUrl?: string
}

export interface AuditLogEntryDto {
  id: string
  actorEmail: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: unknown
  createdAt: number
}

export interface BookSummaryDto {
  bookId: string
  filename: string
  size: number
  lastModified: number
  totalPages: number
  addedAt: number
}

export interface BookProgressDto {
  bookId: string
  filename: string
  currentPage: number
  totalPages: number
  updatedAt: number
  language?: string
  voiceURI?: string
  rate?: number
  autoAdvance?: boolean
}

export interface UserPreferencesDto {
  language: string
  voiceURI?: string
  rate: number
  autoAdvance: boolean
}
