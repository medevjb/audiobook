import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.js'
import { pool } from '../../test/setup.js'

const app = createApp()
const XRW = { 'X-Requested-With': 'audiobook-app' }

async function signUpAgent(email: string) {
  const agent = request.agent(app)
  const res = await agent.post('/api/auth/signup').set(XRW).send({ email, password: 'password123' })
  return { agent, userId: res.body.user.id as string }
}

async function promoteToAdmin(userId: string) {
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId])
}

const validPatch = {
  siteName: 'Renamed App',
  tagline: 'A new tagline.',
  sessionTtlHours: 24,
  minPasswordLength: 10,
  signupsEnabled: false,
  maintenanceMode: false,
  allowedLanguages: ['en', 'bn', 'fr'],
}

describe('admin/settings routes', () => {
  it('rejects non-admins on GET and PUT', async () => {
    const { agent } = await signUpAgent('regular@example.com')
    expect((await agent.get('/api/admin/settings')).status).toBe(403)
    expect((await agent.put('/api/admin/settings').set(XRW).send(validPatch)).status).toBe(403)
  })

  it('returns the default settings', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)

    const res = await agent.get('/api/admin/settings')
    expect(res.status).toBe(200)
    expect(res.body.settings).toMatchObject({ siteName: 'Aloud', signupsEnabled: true, maintenanceMode: false })
  })

  it('updates settings and persists them', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)

    const putRes = await agent.put('/api/admin/settings').set(XRW).send(validPatch)
    expect(putRes.status).toBe(200)
    expect(putRes.body.settings).toMatchObject(validPatch)

    const getRes = await agent.get('/api/admin/settings')
    expect(getRes.body.settings).toMatchObject(validPatch)
  })

  it('rejects an empty allowedLanguages array', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)

    const res = await agent.put('/api/admin/settings').set(XRW).send({ ...validPatch, allowedLanguages: [] })
    expect(res.status).toBe(400)
  })

  it('writes exactly one audit_log row with before/after values', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)

    await agent.put('/api/admin/settings').set(XRW).send(validPatch)

    const res = await agent.get('/api/admin/audit-log')
    const settingsEntries = res.body.entries.filter((e: { action: string }) => e.action === 'settings.update')
    expect(settingsEntries).toHaveLength(1)
    expect(settingsEntries[0].metadata.before.siteName).toBe('Aloud')
    expect(settingsEntries[0].metadata.after.siteName).toBe('Renamed App')
  })
})
