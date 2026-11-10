import User from '../models/User.js'

export async function createCustomer({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error('An account with that email already exists.')
    error.status = 409
    throw error
  }
  return User.create({ name: name.trim(), email: normalizedEmail, password })
}

export async function authenticateUser(email, password) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  if (!user || !(await user.comparePassword(password))) return null
  return user
}

export function findUserById(userId) {
  return User.findById(userId)
}
