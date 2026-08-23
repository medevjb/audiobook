import type { NextFunction, Request, Response } from 'express'
import { pool } from '../db/pool.js'
import { deleteSessionByTokenHash, findValidSessionByTokenHash, touchSessionLastSeen } from '../db/repositories/sessionsRepo.js'
import { COOKIE_NAME, hashToken } from '../lib/sessions.js'
import type { UserRole } from '../types.js'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: UserRole
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  const session = token ? await findValidSessionByTokenHash(pool, hashToken(token)) : undefined

  if (!session) {
    res.status(401).json({ error: { code: 'auth-required', message: 'Not signed in.' } })
    return
  }

  // Checked on every request, not just login, so a suspension takes effect
  // immediately rather than on the user's next sign-in.
  if (session.status === 'suspended') {
    await deleteSessionByTokenHash(pool, session.tokenHash)
    res.status(403).json({ error: { code: 'account-suspended', message: 'This account has been suspended.' } })
    return
  }

  req.userId = session.userId
  req.userRole = session.role
  void touchSessionLastSeen(pool, session.tokenHash)
  next()
}
