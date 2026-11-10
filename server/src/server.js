import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import app from './app.js'
import { connectDatabase } from './config/database.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

async function startServer() {
  const port = Number(process.env.PORT || 5000)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a whole number between 1 and 65535.')
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters.')
  }

  await connectDatabase()

  const server = app.listen(port, () => {
    console.info(`API listening at http://localhost:${port}.`)
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      console.info(`${signal} received. Closing the API server.`)
      server.close(async (error) => {
        if (error) {
          console.error('Error while closing the API server:', error)
          process.exitCode = 1
        }

        try {
          await mongoose.disconnect()
          console.info('MongoDB connection closed.')
        } catch (disconnectError) {
          console.error('Error while closing the MongoDB connection:', disconnectError)
          process.exitCode = 1
        }
      })
    })
  }
}

startServer().catch((error) => {
  console.error('Failed to start the API server:', error)
  process.exitCode = 1
})
