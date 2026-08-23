import { Router } from 'express'
import { pool } from '../db/pool.js'
import { getPreferences, upsertPreferences } from '../db/repositories/preferencesRepo.js'
import { preferencesBodySchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const preferencesRouter = Router()
preferencesRouter.use(requireAuth)

preferencesRouter.get('/', async (req, res) => {
  const preferences = await getPreferences(pool, req.userId!)
  res.status(200).json({ preferences })
})

preferencesRouter.put('/', async (req, res) => {
  const body = preferencesBodySchema.parse(req.body)
  const preferences = await upsertPreferences(pool, req.userId!, body)
  res.status(200).json({ preferences })
})
