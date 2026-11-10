import {
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  findProductById,
  listCategories as getCategories,
  listProducts as getProducts,
  updateProduct as updateProductRecord,
} from '../services/productService.js'

export async function listProducts(request, response) {
  const result = await getProducts(request.query)
  return response.json({ success: true, ...result })
}

export async function listCategories(request, response) {
  const categories = await getCategories()
  return response.json({ success: true, data: categories })
}

export async function getProduct(request, response) {
  const product = await findProductById(request.params.id)
  if (!product) {
    return response.status(404).json({ success: false, message: 'Product not found.' })
  }
  return response.json({ success: true, data: product })
}

export async function createProduct(request, response) {
  if (!request.file) {
    return response.status(400).json({ success: false, message: 'A product image is required.' })
  }
  const product = await createProductRecord(request.validatedProduct, request.file)
  return response.status(201).json({ success: true, data: product })
}

export async function updateProduct(request, response) {
  const product = await updateProductRecord(request.params.id, request.validatedProduct, request.file)
  if (!product) {
    return response.status(404).json({ success: false, message: 'Product not found.' })
  }
  return response.json({ success: true, data: product })
}

export async function deleteProduct(request, response) {
  const product = await deleteProductRecord(request.params.id)
  if (!product) {
    return response.status(404).json({ success: false, message: 'Product not found.' })
  }
  return response.json({ success: true, message: 'Product deleted.' })
}
