import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { pool } from '../test/setup.js'

const app = createApp()
const XRW = { 'X-Requested-With': 'audiobook-app' }

describe('POST /api/auth/signup', () => {
  it('creates a user with a hashed password and starts a session', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'Alice@Example.com', password: 'correcthorsebatterystaple' })

    expect(res.status).toBe(201)
    expect(res.body.user).toEqual({ id: expect.any(String), email: 'alice@example.com', role: 'user' })
    expect(res.headers['set-cookie']?.[0]).toMatch(/^audiobook_session=/)

    const row = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['alice@example.com'])
    expect(row.rows[0].password_hash).not.toBe('correcthorsebatterystaple')
    expect(row.rows[0].password_hash).toMatch(/^\$2b\$/)
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/signup').set(XRW).send({ email: 'bob@example.com', password: 'password123' })
    const res = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'bob@example.com', password: 'password123' })

    expect(res.status).toBe(409)
  })

  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/signup').set(XRW).send({ email: 'x@example.com', password: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/signup').set(XRW).send({ email: 'carol@example.com', password: 'password123' })
    const res = await request(app).post('/api/auth/login').set(XRW).send({ email: 'carol@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.headers['set-cookie']?.[0]).toMatch(/^audiobook_session=/)
  })

  it('rejects a wrong password', async () => {
    await request(app).post('/api/auth/signup').set(XRW).send({ email: 'dave@example.com', password: 'password123' })
    const res = await request(app).post('/api/auth/login').set(XRW).send({ email: 'dave@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).send({ email: 'nobody@example.com', password: 'password123' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns the current user with a valid session', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/signup').set(XRW).send({ email: 'erin@example.com', password: 'password123' })
    const res = await agent.get('/api/auth/me')

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('erin@example.com')
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the session so /me subsequently 401s', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/signup').set(XRW).send({ email: 'frank@example.com', password: 'password123' })
    const logoutRes = await agent.post('/api/auth/logout').set(XRW)
    expect(logoutRes.status).toBe(204)

    const meRes = await agent.get('/api/auth/me')
    expect(meRes.status).toBe(401)
  })
})

describe('CSRF header enforcement', () => {
  it('rejects a mutating request missing X-Requested-With', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'grace@example.com', password: 'password123' })
    expect(res.status).toBe(403)
  })
})

describe('settings-driven auth behavior', () => {
  it('blocks signup and login while maintenance mode is on', async () => {
    await pool.query("UPDATE app_settings SET maintenance_mode = true, maintenance_message = 'Back soon.' WHERE id = 1")

    const signupRes = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'maint@example.com', password: 'password123' })
    expect(signupRes.status).toBe(503)
    expect(signupRes.body.error).toEqual({ code: 'maintenance-mode', message: 'Back soon.' })

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set(XRW)
      .send({ email: 'maint@example.com', password: 'password123' })
    expect(loginRes.status).toBe(503)
  })

  it('blocks signup when signups are disabled, without affecting login', async () => {
    await request(app).post('/api/auth/signup').set(XRW).send({ email: 'early@example.com', password: 'password123' })
    await pool.query('UPDATE app_settings SET signups_enabled = false WHERE id = 1')

    const signupRes = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'toolate@example.com', password: 'password123' })
    expect(signupRes.status).toBe(403)
    expect(signupRes.body.error.code).toBe('signups-disabled')

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set(XRW)
      .send({ email: 'early@example.com', password: 'password123' })
    expect(loginRes.status).toBe(200)
  })

  it('enforces the configured minimum password length, not a hardcoded one', async () => {
    await pool.query('UPDATE app_settings SET min_password_length = 12 WHERE id = 1')

    const res = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'shortpw@example.com', password: 'short123' }) // 8 chars: fine under the old static rule
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('password-too-short')
  })

  it('rejects login for a suspended account before a session is created', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .set(XRW)
      .send({ email: 'suspended@example.com', password: 'password123' })
    await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [signupRes.body.user.id])

    const res = await request(app)
      .post('/api/auth/login')
      .set(XRW)
      .send({ email: 'suspended@example.com', password: 'password123' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('account-suspended')
    expect(res.headers['set-cookie']).toBeUndefined()
  })
})
