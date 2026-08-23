import { Router } from 'express'
import { pool } from '../../db/pool.js'
import * as auditLogRepo from '../../db/repositories/auditLogRepo.js'
import { auditLogQuerySchema } from '../../lib/validation.js'

export const adminAuditLogRouter = Router()

adminAuditLogRouter.get('/', async (req, res) => {
  const { limit, offset } = auditLogQuerySchema.parse(req.query)
  const entries = await auditLogRepo.list(pool, { limit, offset })
  res.status(200).json({ entries })
})
