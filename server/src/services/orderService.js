import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

async function restoreStock(reservations) {
  const results = await Promise.allSettled(
    reservations.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
    ),
  )
  const failures = results.filter((result) => result.status === 'rejected')
  if (failures.length) {
    throw new AggregateError(failures.map(({ reason }) => reason), 'Could not restore all reserved product stock.')
  }
}

export async function placeOrder(userId, items) {
  const quantities = new Map()
  for (const item of items) {
    if (!mongoose.isValidObjectId(item?.productId) || !Number.isInteger(item.quantity) || item.quantity < 1) {
      const error = new Error('Each item needs a valid product ID and positive whole-number quantity.')
      error.status = 400
      throw error
    }
    const productId = item.productId.toString()
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity)
  }

  const reservations = []
  const orderProducts = []
  try {
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      )
      if (!product) {
        const exists = await Product.exists({ _id: productId })
        const error = new Error(exists ? 'One or more items no longer have enough stock.' : 'One or more products no longer exist.')
        error.status = exists ? 409 : 404
        throw error
      }

      reservations.push({ productId, quantity })
      orderProducts.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
      })
    }

    const totalAmount = orderProducts.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return await Order.create({ user: userId, products: orderProducts, totalAmount })
  } catch (error) {
    try {
      await restoreStock(reservations)
    } catch (rollbackError) {
      console.error('Stock rollback failed after order creation error:', rollbackError)
      throw new AggregateError([error, rollbackError], 'Order failed and stock rollback was incomplete.')
    }
    throw error
  }
}

export function findOrdersByUser(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 })
}

export function findAllOrders() {
  return Order.find().populate('user', 'name email').sort({ createdAt: -1 })
}

export function changeOrderStatus(orderId, status) {
  return Order.findByIdAndUpdate(orderId, { status }, { new: true }).populate('user', 'name email')
}
