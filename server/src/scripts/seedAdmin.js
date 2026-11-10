import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import User from '../models/User.js'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() || !ADMIN_PASSWORD ||
      ADMIN_PASSWORD.length < 8 || Buffer.byteLength(ADMIN_PASSWORD, 'utf8') > 72) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD between 8 and 72 UTF-8 bytes in server/.env.')
  }

  await connectDatabase()
  const email = ADMIN_EMAIL.trim().toLowerCase()
  const user = await User.findOne({ email }).select('+password') || new User({ email })
  user.name = ADMIN_NAME.trim()
  user.password = ADMIN_PASSWORD
  user.role = 'admin'
  await user.save()
  console.info(`Administrator account ready for ${email}.`)
}

seedAdmin()
  .catch((error) => {
    console.error('Could not create the administrator account:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
