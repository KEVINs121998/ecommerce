import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const uploadsDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url))

mkdirSync(uploadsDirectory, { recursive: true })

export function getUploadPath(filename) {
  return path.join(uploadsDirectory, path.basename(filename))
}
