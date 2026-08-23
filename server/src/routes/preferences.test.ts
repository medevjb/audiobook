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

describe('GET /api/preferences', () => {
  it('returns defaults for an account with no saved preferences', async () => {
    const agent = await signUpAgent('alice@example.com')
    const res = await agent.get('/api/preferences')
    expect(res.status).toBe(200)
    expect(res.body.preferences).toEqual({ language: 'en', rate: 1.0, autoAdvance: true })
  })
})

describe('PUT /api/preferences', () => {
  it('saves and returns updated preferences', async () => {
    const agent = await signUpAgent('bob@example.com')
    const res = await agent
      .put('/api/preferences')
      .set(XRW)
      .send({ language: 'bn', voiceURI: 'voice-1', rate: 1.5, autoAdvance: false })

    expect(res.status).toBe(200)
    expect(res.body.preferences).toEqual({ language: 'bn', voiceURI: 'voice-1', rate: 1.5, autoAdvance: false })

    const getRes = await agent.get('/api/preferences')
    expect(getRes.body.preferences.language).toBe('bn')
  })
})

describe('cross-user isolation', () => {
  it("user B's preferences are unaffected by user A's writes", async () => {
    const agentA = await signUpAgent('userA@example.com')
    const agentB = await signUpAgent('userB@example.com')
    await agentA.put('/api/preferences').set(XRW).send({ language: 'ar', rate: 2.0, autoAdvance: false })

    const res = await agentB.get('/api/preferences')
    expect(res.body.preferences).toEqual({ language: 'en', rate: 1.0, autoAdvance: true })
  })
})
