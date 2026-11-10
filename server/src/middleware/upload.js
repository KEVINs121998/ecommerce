import { randomUUID } from 'node:crypto'
import { open, unlink } from 'node:fs/promises'
import multer from 'multer'
import { uploadsDirectory } from '../config/uploads.js'

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename(request, file, callback) {
    callback(null, `${randomUUID()}${allowedTypes.get(file.mimetype)}`)
  },
})

function imageOnly(request, file, callback) {
  if (!allowedTypes.has(file.mimetype)) {
    callback(new Error('Upload a JPEG, PNG, or WEBP image.'))
    return
  }

  callback(null, true)
}

export const uploadProductImage = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('image')

export async function verifyUploadedImage(request, response, next) {
  if (!request.file) return next()

  let file
  try {
    file = await open(request.file.path, 'r')
    const header = Buffer.alloc(12)
    const { bytesRead } = await file.read(header, 0, header.length, 0)
    const signature = header.subarray(0, bytesRead)
    const validImage =
      (request.file.mimetype === 'image/jpeg' && signature.length >= 3 &&
        signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff) ||
      (request.file.mimetype === 'image/png' && signature.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )) ||
      (request.file.mimetype === 'image/webp' && signature.toString('ascii', 0, 4) === 'RIFF' &&
        signature.toString('ascii', 8, 12) === 'WEBP')

    await file.close()
    file = undefined
    if (!validImage) {
      await unlink(request.file.path)
      return response.status(400).json({ success: false, message: 'The uploaded file is not a valid JPEG, PNG, or WEBP image.' })
    }

    return next()
  } catch (error) {
    if (file) await file.close()
    await unlink(request.file.path).catch((cleanupError) => {
      console.error('Could not remove an invalid product image upload:', cleanupError)
    })
    return next(error)
  }
}
