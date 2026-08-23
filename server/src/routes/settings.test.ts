import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()
const XRW = { 'X-Requested-With': 'audiobook-app' }

describe('GET /api/settings/public', () => {
  it('returns branding without authentication', async () => {
    const res = await request(app).get('/api/settings/public')
    expect(res.status).toBe(200)
    expect(res.body.settings).toMatchObject({ siteName: 'Aloud' })
  })
})

describe('GET /api/settings/languages', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/settings/languages')
    expect(res.status).toBe(401)
  })

  it('returns the default allowed languages for a signed-in user', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/signup').set(XRW).send({ email: 'reader@example.com', password: 'password123' })

    const res = await agent.get('/api/settings/languages')
    expect(res.status).toBe(200)
    expect(res.body.languages).toEqual(['en', 'bn', 'fr', 'zh', 'es', 'de', 'hi', 'ar', 'ja', 'pt', 'it', 'ko'])
  })
})
