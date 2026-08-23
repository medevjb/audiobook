import type { Response } from 'express'
import { Router } from 'express'
import { pool, withTransaction } from '../../db/pool.js'
import * as auditLogRepo from '../../db/repositories/auditLogRepo.js'
import { listLibraryByUser } from '../../db/repositories/libraryRepo.js'
import { listProgressByUser } from '../../db/repositories/progressRepo.js'
import { getUserDetailForAdmin, listUsersForAdmin, setUserRole, setUserStatus } from '../../db/repositories/usersRepo.js'
import { adminUsersQuerySchema, roleChangeBodySchema } from '../../lib/validation.js'
import type { UserStatus } from '../../types.js'

export const adminUsersRouter = Router()

adminUsersRouter.get('/', async (req, res) => {
  const { q, limit, offset } = adminUsersQuerySchema.parse(req.query)
  const users = await listUsersForAdmin(pool, { q, limit, offset })
  res.status(200).json({ users })
})

adminUsersRouter.get('/:id', async (req, res) => {
  const user = await getUserDetailForAdmin(pool, req.params.id!)
  if (!user) {
    res.status(404).json({ error: { code: 'not-found', message: 'User not found.' } })
    return
  }
  res.status(200).json({ user })
})

adminUsersRouter.get('/:id/library', async (req, res) => {
  const books = await listLibraryByUser(pool, req.params.id)
  res.status(200).json({ books })
})

adminUsersRouter.get('/:id/progress', async (req, res) => {
  const progress = await listProgressByUser(pool, req.params.id, 50)
  res.status(200).json({ progress })
})

async function changeStatus(
  res: Response,
  actorUserId: string,
  targetId: string,
  status: UserStatus,
  action: string,
) {
  const user = await withTransaction(async (client) => {
    const updated = await setUserStatus(client, targetId, status)
    if (updated) {
      await auditLogRepo.record(client, { actorUserId, action, targetType: 'user', targetId })
    }
    return updated
  })

  if (!user) {
    res.status(404).json({ error: { code: 'not-found', message: 'User not found.' } })
    return
  }
  res.status(200).json({ user })
}

adminUsersRouter.post('/:id/suspend', (req, res) =>
  changeStatus(res, req.userId!, req.params.id, 'suspended', 'user.suspend'),
)
adminUsersRouter.post('/:id/reactivate', (req, res) =>
  changeStatus(res, req.userId!, req.params.id, 'active', 'user.reactivate'),
)

adminUsersRouter.put('/:id/role', async (req, res) => {
  const targetId = req.params.id
  const actorUserId = req.userId!

  // An admin can't change their own role from the panel — otherwise the
  // only admin could demote themselves with no other admin left to fix it,
  // and the only recovery path would be back to the manual database update.
  if (targetId === actorUserId) {
    res.status(400).json({ error: { code: 'forbidden', message: 'You cannot change your own role.' } })
    return
  }

  const { role } = roleChangeBodySchema.parse(req.body)

  const before = await getUserDetailForAdmin(pool, targetId)
  const user = await withTransaction(async (client) => {
    const updated = await setUserRole(client, targetId, role)
    if (updated) {
      await auditLogRepo.record(client, {
        actorUserId,
        action: 'user.role_change',
        targetType: 'user',
        targetId,
        metadata: { from: before?.role, to: role },
      })
    }
    return updated
  })

  if (!user) {
    res.status(404).json({ error: { code: 'not-found', message: 'User not found.' } })
    return
  }
  res.status(200).json({ user })
})
