import jwt from 'jsonwebtoken'
import { findUserById } from '../services/authService.js'

export async function requireAuth(request, response, next) {
  const token = request.cookies?.token

  if (!token) {
    return response.status(401).json({ success: false, message: 'Please log in to continue.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await findUserById(payload.sub)

    if (!user) {
      return response.status(401).json({ success: false, message: 'Your account is no longer available.' })
    }

    request.user = user
    return next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' })
    }

    return next(error)
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ success: false, message: 'Administrator access is required.' })
  }

  return next()
}
