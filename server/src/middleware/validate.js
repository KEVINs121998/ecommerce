import { unlink } from 'node:fs/promises'

export async function validateProductBody(request, response, next) {
  const { name, description, price, category, stock } = request.body || {}
  const errors = []

  if (typeof name !== 'string' || !name.trim()) errors.push('Name is required.')
  if (typeof description !== 'string' || !description.trim()) errors.push('Description is required.')
  if (typeof category !== 'string' || !category.trim()) errors.push('Category is required.')

  const parsedPrice = Number(price)
  const parsedStock = Number(stock)
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) errors.push('Price must be a non-negative number.')
  if (!Number.isInteger(parsedStock) || parsedStock < 0) errors.push('Stock must be a non-negative whole number.')

  if (errors.length > 0) {
    if (request.file) await unlink(request.file.path)
    return response.status(400).json({ success: false, message: errors.join(' ') })
  }

  request.validatedProduct = {
    name: name.trim(),
    description: description.trim(),
    price: parsedPrice,
    category: category.trim(),
    stock: parsedStock,
  }
  return next()
}

export function validateObjectId(request, response, next) {
  if (!/^[\da-f]{24}$/i.test(request.params.id)) {
    return response.status(400).json({ success: false, message: 'A valid resource ID is required.' })
  }

  return next()
}
