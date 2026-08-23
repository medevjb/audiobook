import type { NextFunction, Request, Response } from 'express'

/** Composed after `requireAuth`, which populates `req.userRole`. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: { code: 'forbidden', message: 'Admin access required.' } })
    return
  }
  next()
}
