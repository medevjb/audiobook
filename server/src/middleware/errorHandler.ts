import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'invalid-request', message: 'Invalid request body.', issues: err.issues } })
    return
  }

  if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
    // Postgres unique_violation (e.g. duplicate email on signup)
    res.status(409).json({ error: { code: 'conflict', message: 'That value is already in use.' } })
    return
  }

  console.error(err)
  res.status(500).json({ error: { code: 'internal-error', message: 'Something went wrong.' } })
}
