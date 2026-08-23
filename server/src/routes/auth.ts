import type { Response } from 'express'
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db/pool.js'
import { createSession, deleteSessionByTokenHash } from '../db/repositories/sessionsRepo.js'
import { createUser, findUserByEmail, findUserById } from '../db/repositories/usersRepo.js'
import { getSettings } from '../db/repositories/settingsRepo.js'
import { hashPassword, verifyPassword } from '../lib/passwords.js'
import { COOKIE_NAME, createSessionToken, hashToken, sessionCookieOptions } from '../lib/sessions.js'
import { loginSchema, signupSchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

// A precomputed, unusable hash — compared against on login when the email
// doesn't exist, so bcrypt.compare's timing is the same either way and
// response latency can't be used to enumerate registered emails.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 12)

async function startSession(res: Response, userId: string, ttlHours: number) {
  const rawToken = createSessionToken()
  await createSession(pool, {
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
  })
  res.cookie(COOKIE_NAME, rawToken, sessionCookieOptions(ttlHours))
}

authRouter.post('/signup', async (req, res) => {
  const settings = await getSettings(pool)

  if (settings.maintenanceMode) {
    res.status(503).json({
      error: { code: 'maintenance-mode', message: settings.maintenanceMessage ?? 'The app is temporarily unavailable for maintenance.' },
    })
    return
  }
  if (!settings.signupsEnabled) {
    res.status(403).json({ error: { code: 'signups-disabled', message: 'New signups are currently disabled.' } })
    return
  }

  const { email, password } = signupSchema.parse(req.body)
  if (password.length < settings.minPasswordLength) {
    res.status(400).json({
      error: { code: 'password-too-short', message: `Password must be at least ${settings.minPasswordLength} characters.` },
    })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await createUser(pool, email, passwordHash)
  await startSession(res, user.id, settings.sessionTtlHours)
  res.status(201).json({ user })
})

authRouter.post('/login', async (req, res) => {
  const settings = await getSettings(pool)

  if (settings.maintenanceMode) {
    res.status(503).json({
      error: { code: 'maintenance-mode', message: settings.maintenanceMessage ?? 'The app is temporarily unavailable for maintenance.' },
    })
    return
  }

  const { email, password } = loginSchema.parse(req.body)
  const record = await findUserByEmail(pool, email)

  // Always run bcrypt.compare, even for an unknown email, so response timing
  // doesn't reveal which emails exist.
  const passwordHash = record?.passwordHash ?? DUMMY_PASSWORD_HASH
  const valid = await verifyPassword(password, passwordHash)

  if (!record || !valid) {
    res.status(401).json({ error: { code: 'invalid-credentials', message: 'Incorrect email or password.' } })
    return
  }

  if (record.status === 'suspended') {
    res.status(403).json({ error: { code: 'account-suspended', message: 'This account has been suspended.' } })
    return
  }

  await startSession(res, record.id, settings.sessionTtlHours)
  res.status(200).json({ user: { id: record.id, email: record.email, role: record.role } })
})

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (token) await deleteSessionByTokenHash(pool, hashToken(token))
  res.clearCookie(COOKIE_NAME, sessionCookieOptions(0))
  res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(pool, req.userId!)
  if (!user) {
    res.status(401).json({ error: { code: 'auth-required', message: 'Not signed in.' } })
    return
  }
  res.status(200).json({ user })
})
