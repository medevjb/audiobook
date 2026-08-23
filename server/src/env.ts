import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ALLOWED_ORIGIN: z.string().min(1, 'ALLOWED_ORIGIN is required'),
  SESSION_COOKIE_NAME: z.string().min(1).default('audiobook_session'),
})

export const env = envSchema.parse(process.env)
