import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()
const XRW = { 'X-Requested-With': 'audiobook-app' }

async function signUpAgent(email: string) {
  const agent = request.agent(app)
  await agent.post('/api/auth/signup').set(XRW).send({ email, password: 'password123' })
  return agent
}

const sampleBook = { filename: 'book.pdf', size: 1000, lastModified: 1700000000000, totalPages: 42, addedAt: 1700000000000 }

describe('GET /api/library', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/library')
    expect(res.status).toBe(401)
  })

  it('returns an empty list for a new account', async () => {
    const agent = await signUpAgent('alice@example.com')
    const res = await agent.get('/api/library')
    expect(res.status).toBe(200)
    expect(res.body.books).toEqual([])
  })
})

describe('PUT /api/library/:bookId', () => {
  it('upserts a book for the authenticated user', async () => {
    const agent = await signUpAgent('bob@example.com')
    const putRes = await agent.put('/api/library/book-1').set(XRW).send(sampleBook)

    expect(putRes.status).toBe(200)
    expect(putRes.body.book).toMatchObject({ bookId: 'book-1', filename: 'book.pdf', totalPages: 42 })

    const listRes = await agent.get('/api/library')
    expect(listRes.body.books).toHaveLength(1)
  })
})

describe('DELETE /api/library/:bookId', () => {
  it('removes the book', async () => {
    const agent = await signUpAgent('carol@example.com')
    await agent.put('/api/library/book-1').set(XRW).send(sampleBook)
    const delRes = await agent.delete('/api/library/book-1').set(XRW)
    expect(delRes.status).toBe(204)

    const listRes = await agent.get('/api/library')
    expect(listRes.body.books).toEqual([])
  })
})

describe('POST /api/library/import', () => {
  it('bulk upserts idempotently', async () => {
    const agent = await signUpAgent('dave@example.com')
    const books = [
      { ...sampleBook, bookId: 'book-1' },
      { ...sampleBook, bookId: 'book-2' },
    ]
    const first = await agent.post('/api/library/import').set(XRW).send({ books })
    expect(first.body.imported).toBe(2)

    const second = await agent.post('/api/library/import').set(XRW).send({ books })
    expect(second.body.imported).toBe(2)

    const listRes = await agent.get('/api/library')
    expect(listRes.body.books).toHaveLength(2)
  })
})

describe('cross-user isolation', () => {
  let agentA: Awaited<ReturnType<typeof signUpAgent>>
  let agentB: Awaited<ReturnType<typeof signUpAgent>>

  beforeEach(async () => {
    agentA = await signUpAgent('userA@example.com')
    agentB = await signUpAgent('userB@example.com')
    await agentA.put('/api/library/secret-book').set(XRW).send(sampleBook)
  })

  it("user B's library list never contains user A's books", async () => {
    const res = await agentB.get('/api/library')
    expect(res.body.books).toEqual([])
  })

  it("user B cannot delete user A's book by id", async () => {
    const delRes = await agentB.delete('/api/library/secret-book').set(XRW)
    expect(delRes.status).toBe(204) // no-op delete, not an error — but must not affect user A

    const stillThereRes = await agentA.get('/api/library')
    expect(stillThereRes.body.books).toHaveLength(1)
  })

  it("user B overwriting the same bookId does not affect user A's row", async () => {
    await agentB.put('/api/library/secret-book').set(XRW).send({ ...sampleBook, filename: 'evil.pdf' })

    const aRes = await agentA.get('/api/library')
    expect(aRes.body.books[0].filename).toBe('book.pdf')
  })
})
