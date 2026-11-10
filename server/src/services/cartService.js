import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

function publicItems(cart) {
  return cart.items.flatMap(({ product, quantity }) => product ? [{
    productId: product._id.toString(),
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
    quantity,
  }] : [])
}

async function loadCart(userId) {
  return Cart.findOne({ user: userId }).populate('items.product', 'name price image stock')
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length > 50) {
    const error = new Error('Provide no more than 50 cart items.')
    error.status = 400
    throw error
  }

  const quantities = new Map()
  for (const item of items) {
    if (!mongoose.isValidObjectId(item?.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      const error = new Error('Each cart item needs a valid product ID and positive whole-number quantity.')
      error.status = 400
      throw error
    }
    const productId = item.productId.toString()
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity)
  }
  return quantities
}

async function storeItems(userId, quantities, { merge = false } = {}) {
  const productIds = [...quantities.keys()]
  const products = await Product.find({ _id: { $in: productIds } }).select('_id stock')
  if (products.length !== productIds.length) {
    const error = new Error('One or more cart products no longer exist.')
    error.status = 404
    throw error
  }

  const productsById = new Map(products.map((product) => [product._id.toString(), product]))
  const items = [...quantities].map(([productId, quantity]) => {
    const product = productsById.get(productId)
    if (!merge && quantity > product.stock) {
      const error = new Error('One or more cart items exceed available stock.')
      error.status = 409
      throw error
    }
    return { product: productId, quantity: Math.min(quantity, product.stock) }
  }).filter((item) => item.quantity > 0)

  await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  const cart = await loadCart(userId)
  return publicItems(cart)
}

export async function getCart(userId) {
  const cart = await loadCart(userId)
  return cart ? publicItems(cart) : []
}

export async function replaceCart(userId, items) {
  return storeItems(userId, validateItems(items))
}

export async function mergeCart(userId, items) {
  const quantities = validateItems(items)
  const cart = await Cart.findOne({ user: userId }).select('items')
  for (const item of cart?.items || []) {
    const productId = item.product.toString()
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity)
  }
  if (quantities.size > 50) {
    const error = new Error('A cart cannot contain more than 50 different products.')
    error.status = 400
    throw error
  }
  return storeItems(userId, quantities, { merge: true })
}

export async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } })
}
