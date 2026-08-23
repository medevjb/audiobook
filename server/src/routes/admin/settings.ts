import { Router } from 'express'
import { pool, withTransaction } from '../../db/pool.js'
import * as auditLogRepo from '../../db/repositories/auditLogRepo.js'
import { getSettings, updateSettings } from '../../db/repositories/settingsRepo.js'
import { adminSettingsBodySchema } from '../../lib/validation.js'

export const adminSettingsRouter = Router()

adminSettingsRouter.get('/', async (_req, res) => {
  const settings = await getSettings(pool)
  res.status(200).json({ settings })
})

adminSettingsRouter.put('/', async (req, res) => {
  const patch = adminSettingsBodySchema.parse(req.body)
  const before = await getSettings(pool)

  const settings = await withTransaction(async (client) => {
    const updated = await updateSettings(client, patch, req.userId!)
    await auditLogRepo.record(client, {
      actorUserId: req.userId!,
      action: 'settings.update',
      targetType: 'app_settings',
      targetId: '1',
      metadata: { before, after: updated },
    })
    return updated
  })

  res.status(200).json({ settings })
})
