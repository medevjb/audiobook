import { z } from 'zod'

// Kept in sync with the frontend's `LANGUAGES` list (src/utils/language.ts,
// PRD §21). No shared package between the two TS projects, so this is a
// deliberate duplication, same as the frontend's own KNOWN_CODES/ReaderErrorCode.
export const LANGUAGE_CODES = ['en', 'bn', 'fr', 'zh', 'es', 'de', 'hi', 'ar', 'ja', 'pt', 'it', 'ko'] as const

const emailSchema = z.string().trim().toLowerCase().pipe(z.email())
// The real minimum is enforced dynamically against app_settings.minPasswordLength
// (see routes/auth.ts) since it's admin-configurable — this is just a sanity bound.
const passwordSchema = z.string().min(1).max(200)

export const signupSchema = z.object({ email: emailSchema, password: passwordSchema })
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema })

export const bookSummaryBodySchema = z.object({
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  lastModified: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
  addedAt: z.number().int().nonnegative(),
})

const bookSummaryImportSchema = bookSummaryBodySchema.extend({ bookId: z.string().min(1) })
export const libraryImportSchema = z.object({ books: z.array(bookSummaryImportSchema).max(1000) })

export const progressBodySchema = z.object({
  filename: z.string().min(1),
  currentPage: z.number().int().positive(),
  totalPages: z.number().int().positive(),
  language: z.string().min(1).optional(),
  voiceURI: z.string().optional(),
  rate: z.number().positive().optional(),
  autoAdvance: z.boolean().optional(),
})

const progressImportItemSchema = progressBodySchema.extend({
  bookId: z.string().min(1),
  updatedAt: z.number().int().nonnegative(),
})
export const progressImportSchema = z.object({ progress: z.array(progressImportItemSchema).max(1000) })

export const preferencesBodySchema = z.object({
  language: z.string().min(1),
  voiceURI: z.string().optional(),
  rate: z.number().positive(),
  autoAdvance: z.boolean(),
})

export const adminSettingsBodySchema = z.object({
  siteName: z.string().trim().min(1).max(200),
  tagline: z.string().trim().min(1).max(500),
  logoUrl: z.string().trim().url().optional(),
  sessionTtlHours: z.number().int().positive().max(8760),
  minPasswordLength: z.number().int().min(1).max(128),
  signupsEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().max(1000).optional(),
  allowedLanguages: z.array(z.enum(LANGUAGE_CODES)).min(1, 'At least one language must stay enabled.'),
})

export const roleChangeBodySchema = z.object({
  role: z.enum(['user', 'admin']),
})

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export const auditLogQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})
