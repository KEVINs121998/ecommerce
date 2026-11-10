import mongoose from 'mongoose'

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env before starting the API.')
  }

  await mongoose.connect(mongoUri)
  console.info(`MongoDB connected to database "${mongoose.connection.name}".`)
}
