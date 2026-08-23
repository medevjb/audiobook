import { Router } from 'express'
import { pool } from '../db/pool.js'
import { getAllowedLanguages, getPublicSettings } from '../db/repositories/settingsRepo.js'
import { requireAuth } from '../middleware/requireAuth.js'

/** Unauthenticated — only the branding subset, for the pre-login landing page. */
export const publicSettingsRouter = Router()

publicSettingsRouter.get('/', async (_req, res) => {
  const settings = await getPublicSettings(pool)
  res.status(200).json({ settings })
})

/**
 * Authenticated (any signed-in user, not admin-only) — the language
 * selector needs this, distinct from the admin-only full settings route.
 */
export const languagesSettingsRouter = Router()
languagesSettingsRouter.use(requireAuth)

languagesSettingsRouter.get('/', async (_req, res) => {
  const languages = await getAllowedLanguages(pool)
  res.status(200).json({ languages })
})
