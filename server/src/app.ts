import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { adminRouter } from './routes/admin/index.js'
import { authRouter } from './routes/auth.js'
import { libraryRouter } from './routes/library.js'
import { preferencesRouter } from './routes/preferences.js'
import { progressRouter } from './routes/progress.js'
import { languagesSettingsRouter, publicSettingsRouter } from './routes/settings.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const REQUIRED_HEADER_VALUE = 'audiobook-app'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }))
  app.use(cookieParser())
  app.use(express.json())

  // Lightweight CSRF defense-in-depth: SameSite=Lax cookies already block
  // cross-site form posts, but this stops any request that isn't coming from
  // our own frontend code (a plain cross-site GET-triggered form can't set
  // custom headers).
  app.use((req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next()
      return
    }
    if (req.get('X-Requested-With') !== REQUIRED_HEADER_VALUE) {
      res.status(403).json({ error: { code: 'forbidden', message: 'Missing required request header.' } })
      return
    }
    next()
  })

  app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }))
  app.use('/api/settings/public', publicSettingsRouter)
  app.use('/api/settings/languages', languagesSettingsRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/library', libraryRouter)
  app.use('/api/progress', progressRouter)
  app.use('/api/preferences', preferencesRouter)
  app.use('/api/admin', adminRouter)

  app.use(errorHandler)

  return app
}
