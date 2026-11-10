import jwt from 'jsonwebtoken'
import { authenticateUser, createCustomer } from '../services/authService.js'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: userId.toString(), expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function register(request, response) {
  const { name, email, password } = request.body || {}
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return response.status(400).json({ success: false, message: 'Name must be between 1 and 80 characters.' })
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ success: false, message: 'Enter a valid email address.' })
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return response.status(400).json({ success: false, message: 'Password must be between 8 and 72 characters.' })
  }

  const user = await createCustomer({ name, email, password })
  response.cookie('token', createToken(user._id), cookieOptions())
  return response.status(201).json({ success: true, data: { user: publicUser(user) } })
}

export async function login(request, response) {
  const { email, password } = request.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    return response.status(401).json({ success: false, message: 'Email or password is incorrect.' })
  }

  response.cookie('token', createToken(user._id), cookieOptions())
  return response.json({ success: true, data: { user: publicUser(user) } })
}

export function logout(request, response) {
  const { maxAge, ...options } = cookieOptions()
  response.clearCookie('token', options)
  return response.json({ success: true, message: 'You have been logged out.' })
}

export function currentUser(request, response) {
  return response.json({ success: true, data: { user: publicUser(request.user) } })
}
