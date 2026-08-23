import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()
const XRW = { 'X-Requested-With': 'audiobook-app' }

async function signUpAgent(email: string) {
  const agent = request.agent(app)
  await agent.post('/api/auth/signup').set(XRW).send({ email, password: 'password123' })
  return agent
}

const sampleProgress = { filename: 'book.pdf', currentPage: 12, totalPages: 42, language: 'en', rate: 1.25, autoAdvance: true }

describe('PUT /api/progress/:bookId', () => {
  it('upserts progress and stamps updatedAt server-side', async () => {
    const agent = await signUpAgent('alice@example.com')
    const before = Date.now()
    const res = await agent.put('/api/progress/book-1').set(XRW).send(sampleProgress)

    expect(res.status).toBe(200)
    expect(res.body.progress).toMatchObject({ bookId: 'book-1', currentPage: 12, language: 'en', rate: 1.25 })
    expect(res.body.progress.updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('GET /api/progress', () => {
  it('orders by most recently updated', async () => {
    const agent = await signUpAgent('bob@example.com')
    await agent.put('/api/progress/book-1').set(XRW).send(sampleProgress)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await agent.put('/api/progress/book-2').set(XRW).send(sampleProgress)

    const res = await agent.get('/api/progress')
    expect(res.body.progress.map((p: { bookId: string }) => p.bookId)).toEqual(['book-2', 'book-1'])
  })
})

describe('POST /api/progress/import', () => {
  it('preserves client-provided updatedAt timestamps', async () => {
    const agent = await signUpAgent('carol@example.com')
    const oldTimestamp = 1600000000000
    const res = await agent
      .post('/api/progress/import')
      .set(XRW)
      .send({ progress: [{ ...sampleProgress, bookId: 'book-1', updatedAt: oldTimestamp }] })

    expect(res.body.imported).toBe(1)
    const listRes = await agent.get('/api/progress')
    expect(listRes.body.progress[0].updatedAt).toBe(oldTimestamp)
  })
})

describe('cross-user isolation', () => {
  it("user B's progress list never contains user A's entries", async () => {
    const agentA = await signUpAgent('userA@example.com')
    const agentB = await signUpAgent('userB@example.com')
    await agentA.put('/api/progress/secret-book').set(XRW).send(sampleProgress)

    const res = await agentB.get('/api/progress')
    expect(res.body.progress).toEqual([])
  })
})
