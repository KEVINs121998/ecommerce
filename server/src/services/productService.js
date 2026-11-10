import { unlink } from 'node:fs/promises'
import Product from '../models/Product.js'
import { getUploadPath } from '../config/uploads.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function parsePageNumber(value, fallback, maximum) {
  const number = Number(value ?? fallback)
  return Number.isInteger(number) && number >= 1 && number <= maximum ? number : null
}

export async function listProducts(query) {
  const page = parsePageNumber(query.page, 1, 1_000_000)
  const limit = parsePageNumber(query.limit, 8, 50)
  const minPrice = query.minPrice === undefined ? undefined : Number(query.minPrice)
  const maxPrice = query.maxPrice === undefined ? undefined : Number(query.maxPrice)

  if (!page || !limit) {
    const error = new Error('Page and limit must be positive whole numbers; limit cannot exceed 50.')
    error.status = 400
    throw error
  }
  if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    const error = new Error('Enter a valid non-negative price range.')
    error.status = 400
    throw error
  }

  const match = {}
  if (typeof query.search === 'string' && query.search.trim()) {
    match.name = { $regex: escapeRegex(query.search.trim().slice(0, 100)), $options: 'i' }
  }
  if (typeof query.category === 'string' && query.category.trim()) {
    match.category = query.category.trim()
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    match.price = {}
    if (minPrice !== undefined) match.price.$gte = minPrice
    if (maxPrice !== undefined) match.price.$lte = maxPrice
  }

  const sortBy = {
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 },
    name_asc: { name: 1, _id: 1 },
    newest: { createdAt: -1, _id: -1 },
  }
  const sort = Object.hasOwn(sortBy, query.sort) ? sortBy[query.sort] : sortBy.newest

  const [result = { data: [], metadata: [] }] = await Product.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        metadata: [{ $count: 'totalItems' }],
      },
    },
  ])
  const totalItems = result.metadata[0]?.totalItems ?? 0
  const totalPages = Math.ceil(totalItems / limit)

  return {
    data: result.data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  }
}

export async function listCategories() {
  const categories = await Product.aggregate([
    { $group: { _id: '$category' } },
    { $sort: { _id: 1 } },
  ])
  return categories.map(({ _id }) => _id)
}

export function findProductById(productId) {
  return Product.findById(productId)
}

export async function createProduct(productData, imageFile) {
  try {
    return await Product.create({ ...productData, image: `/uploads/${imageFile.filename}` })
  } catch (error) {
    await unlink(imageFile.path).catch((cleanupError) => {
      console.error('Could not remove an unused uploaded product image:', cleanupError)
    })
    throw error
  }
}

export async function updateProduct(productId, productData, imageFile) {
  const product = await Product.findById(productId)
  if (!product) {
    if (imageFile) await unlink(imageFile.path)
    return null
  }

  const oldImage = product.image
  Object.assign(product, productData)
  if (imageFile) product.image = `/uploads/${imageFile.filename}`

  try {
    await product.save()
  } catch (error) {
    if (imageFile) {
      await unlink(imageFile.path).catch((cleanupError) => {
        console.error('Could not remove an unused uploaded product image:', cleanupError)
      })
    }
    throw error
  }

  if (imageFile && oldImage) {
    await unlink(getUploadPath(oldImage.replace('/uploads/', ''))).catch((error) => {
      if (error.code !== 'ENOENT') console.error('Could not remove the replaced product image:', error)
    })
  }

  return product
}

export async function deleteProduct(productId) {
  const product = await Product.findByIdAndDelete(productId)
  if (product?.image) {
    await unlink(getUploadPath(product.image.replace('/uploads/', ''))).catch((error) => {
      if (error.code !== 'ENOENT') console.error('Could not remove the deleted product image:', error)
    })
  }
  return product
}
