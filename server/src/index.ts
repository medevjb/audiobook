import { createApp } from './app.js'
import { env } from './env.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`audiobook-reader server listening on http://127.0.0.1:${env.PORT}`)
})
