import { Router } from 'express'
import { pool } from '../db/pool.js'
import { bulkImportProgress, listProgressByUser, upsertProgress } from '../db/repositories/progressRepo.js'
import { progressBodySchema, progressImportSchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const progressRouter = Router()
progressRouter.use(requireAuth)

progressRouter.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500)
  const progress = await listProgressByUser(pool, req.userId!, limit)
  res.status(200).json({ progress })
})

progressRouter.put('/:bookId', async (req, res) => {
  const body = progressBodySchema.parse(req.body)
  const progress = await upsertProgress(pool, req.userId!, req.params.bookId!, body)
  res.status(200).json({ progress })
})

progressRouter.post('/import', async (req, res) => {
  const { progress } = progressImportSchema.parse(req.body)
  const imported = await bulkImportProgress(pool, req.userId!, progress)
  res.status(200).json({ imported })
})
