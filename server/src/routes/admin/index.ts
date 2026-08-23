import { Router } from 'express'
import { requireAdmin } from '../../middleware/requireAdmin.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { adminAuditLogRouter } from './auditLog.js'
import { adminSettingsRouter } from './settings.js'
import { adminUsersRouter } from './users.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)
adminRouter.use('/users', adminUsersRouter)
adminRouter.use('/settings', adminSettingsRouter)
adminRouter.use('/audit-log', adminAuditLogRouter)
