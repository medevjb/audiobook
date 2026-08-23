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

describe('admin/users routes', () => {
  it('rejects a non-admin session with 403', async () => {
    const { agent } = await signUpAgent('regular@example.com')
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('forbidden')
  })

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('lists users for an admin', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)
    await signUpAgent('other@example.com')

    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(2)
  })

  it('searches users by email', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)
    await signUpAgent('findme@example.com')
    await signUpAgent('someoneelse@example.com')

    const res = await agent.get('/api/admin/users?q=findme')
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].email).toBe('findme@example.com')
  })

  it('returns a user detail', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)
    const { userId: targetId } = await signUpAgent('target@example.com')

    const res = await agent.get(`/api/admin/users/${targetId}`)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ id: targetId, email: 'target@example.com', role: 'user', status: 'active' })
  })

  it('404s for an unknown user id', async () => {
    const { agent, userId } = await signUpAgent('admin@example.com')
    await promoteToAdmin(userId)

    const res = await agent.get('/api/admin/users/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  describe('suspend / reactivate', () => {
    it("suspends a user's account", async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { userId: targetId } = await signUpAgent('target@example.com')

      const res = await agent.post(`/api/admin/users/${targetId}/suspend`).set(XRW)
      expect(res.status).toBe(200)
      expect(res.body.user.status).toBe('suspended')
    })

    it("kills the suspended user's existing session on their very next request — not just their next login", async () => {
      const { agent: adminAgent, userId: adminId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(adminId)
      const { agent: targetAgent, userId: targetId } = await signUpAgent('target@example.com')

      // The session is live before suspension.
      const beforeRes = await targetAgent.get('/api/library')
      expect(beforeRes.status).toBe(200)

      await adminAgent.post(`/api/admin/users/${targetId}/suspend`).set(XRW)

      const afterRes = await targetAgent.get('/api/library')
      expect(afterRes.status).toBe(403)
      expect(afterRes.body.error.code).toBe('account-suspended')
    })

    it('reactivates a suspended account, allowing login again', async () => {
      const { agent: adminAgent, userId: adminId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(adminId)
      const { userId: targetId } = await signUpAgent('target@example.com')

      await adminAgent.post(`/api/admin/users/${targetId}/suspend`).set(XRW)
      const loginBlockedRes = await request(app)
        .post('/api/auth/login')
        .set(XRW)
        .send({ email: 'target@example.com', password: 'password123' })
      expect(loginBlockedRes.status).toBe(403)
      expect(loginBlockedRes.body.error.code).toBe('account-suspended')

      const reactivateRes = await adminAgent.post(`/api/admin/users/${targetId}/reactivate`).set(XRW)
      expect(reactivateRes.status).toBe(200)
      expect(reactivateRes.body.user.status).toBe('active')

      const loginRes = await request(app)
        .post('/api/auth/login')
        .set(XRW)
        .send({ email: 'target@example.com', password: 'password123' })
      expect(loginRes.status).toBe(200)
    })

    it('404s suspending an unknown user', async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)

      const res = await agent.post('/api/admin/users/00000000-0000-0000-0000-000000000000/suspend').set(XRW)
      expect(res.status).toBe(404)
    })
  })

  describe('role change', () => {
    it('promotes a user to admin', async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { userId: targetId } = await signUpAgent('target@example.com')

      const res = await agent.put(`/api/admin/users/${targetId}/role`).set(XRW).send({ role: 'admin' })
      expect(res.status).toBe(200)
      expect(res.body.user.role).toBe('admin')
    })

    it('demotes an admin back to user', async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { userId: targetId } = await signUpAgent('target@example.com')
      await promoteToAdmin(targetId)

      const res = await agent.put(`/api/admin/users/${targetId}/role`).set(XRW).send({ role: 'user' })
      expect(res.status).toBe(200)
      expect(res.body.user.role).toBe('user')
    })

    it('rejects an admin changing their own role', async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)

      const res = await agent.put(`/api/admin/users/${userId}/role`).set(XRW).send({ role: 'user' })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('forbidden')

      const stillAdminRes = await agent.get(`/api/admin/users/${userId}`)
      expect(stillAdminRes.body.user.role).toBe('admin')
    })

    it('writes an audit_log entry with the from/to roles', async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { userId: targetId } = await signUpAgent('target@example.com')

      await agent.put(`/api/admin/users/${targetId}/role`).set(XRW).send({ role: 'admin' })

      const res = await agent.get('/api/admin/audit-log')
      const entry = res.body.entries.find((e: { action: string }) => e.action === 'user.role_change')
      expect(entry.metadata).toEqual({ from: 'user', to: 'admin' })
    })

    it('rejects non-admins', async () => {
      const { agent } = await signUpAgent('regular@example.com')
      const { userId: targetId } = await signUpAgent('target@example.com')

      const res = await agent.put(`/api/admin/users/${targetId}/role`).set(XRW).send({ role: 'admin' })
      expect(res.status).toBe(403)
    })
  })

  describe('reading activity (library / progress)', () => {
    it("returns the target user's library and progress, not the admin's own", async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { agent: targetAgent, userId: targetId } = await signUpAgent('target@example.com')

      await targetAgent
        .put('/api/library/book-1')
        .set(XRW)
        .send({ filename: 'book.pdf', size: 1000, lastModified: 1700000000000, totalPages: 42, addedAt: 1700000000000 })
      await targetAgent
        .put('/api/progress/book-1')
        .set(XRW)
        .send({ filename: 'book.pdf', currentPage: 12, totalPages: 42 })

      const libraryRes = await agent.get(`/api/admin/users/${targetId}/library`)
      expect(libraryRes.status).toBe(200)
      expect(libraryRes.body.books).toHaveLength(1)
      expect(libraryRes.body.books[0].bookId).toBe('book-1')

      const progressRes = await agent.get(`/api/admin/users/${targetId}/progress`)
      expect(progressRes.status).toBe(200)
      expect(progressRes.body.progress).toHaveLength(1)
      expect(progressRes.body.progress[0].currentPage).toBe(12)
    })

    it("does not leak another user's library into the requested user's view", async () => {
      const { agent, userId } = await signUpAgent('admin@example.com')
      await promoteToAdmin(userId)
      const { agent: userAAgent, userId: userAId } = await signUpAgent('userA@example.com')
      const { userId: userBId } = await signUpAgent('userB@example.com')

      await userAAgent
        .put('/api/library/secret-book')
        .set(XRW)
        .send({ filename: 'secret.pdf', size: 1000, lastModified: 1, totalPages: 10, addedAt: 1 })

      const res = await agent.get(`/api/admin/users/${userBId}/library`)
      expect(res.body.books).toEqual([])

      const ownerRes = await agent.get(`/api/admin/users/${userAId}/library`)
      expect(ownerRes.body.books).toHaveLength(1)
    })

    it('rejects non-admins', async () => {
      const { agent } = await signUpAgent('regular@example.com')
      const { userId: targetId } = await signUpAgent('target@example.com')

      expect((await agent.get(`/api/admin/users/${targetId}/library`)).status).toBe(403)
      expect((await agent.get(`/api/admin/users/${targetId}/progress`)).status).toBe(403)
    })
  })
})
