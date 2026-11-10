import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { MulterError } from 'multer'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cartRoutes from './routes/cartRoutes.js'

const app = express()

app.use(cors({
  origin(origin, callback) {
    const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
    callback(null, !origin || origin === allowedOrigin)
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(fileURLToPath(new URL('../uploads/', import.meta.url)), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d',
}))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/cart', cartRoutes)

app.get('/api/health', (request, response) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1

  response.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    service: 'api',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
  })
})

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  })
})

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  if (error instanceof MulterError) {
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return response.status(statusCode).json({ success: false, message: error.message })
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ success: false, message: 'Request body contains invalid JSON.' })
  }

  if (error.message === 'Upload a JPEG, PNG, or WEBP image.') {
    return response.status(400).json({ success: false, message: error.message })
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({ success: false, message: error.message })
  }

  if (error.code === 11000) {
    return response.status(409).json({ success: false, message: 'A record with that value already exists.' })
  }

  const statusCode = Number.isInteger(error.status) ? error.status : 500
  const message = statusCode >= 500 ? 'An unexpected server error occurred.' : error.message

  if (statusCode >= 500) console.error(error)
  response.status(statusCode).json({ success: false, message })
})

export default app
