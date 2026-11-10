import { changeOrderStatus, findAllOrders, findOrdersByUser, placeOrder } from '../services/orderService.js'
import { clearCart, getCart } from '../services/cartService.js'

export async function createOrder(request, response) {
  const cartItems = await getCart(request.user._id)
  if (cartItems.length === 0) {
    return response.status(400).json({ success: false, message: 'Your cart is empty.' })
  }

  const order = await placeOrder(request.user._id, cartItems)
  await clearCart(request.user._id)
  return response.status(201).json({ success: true, data: order })
}

export async function listMyOrders(request, response) {
  const orders = await findOrdersByUser(request.user._id)
  return response.json({ success: true, data: orders })
}

export async function listAllOrders(request, response) {
  const orders = await findAllOrders()
  return response.json({ success: true, data: orders })
}

export async function updateOrderStatus(request, response) {
  const status = request.body?.status
  if (!['Pending', 'Shipped', 'Delivered'].includes(status)) {
    return response.status(400).json({ success: false, message: 'Status must be Pending, Shipped, or Delivered.' })
  }
  const order = await changeOrderStatus(request.params.id, status)
  if (!order) {
    return response.status(404).json({ success: false, message: 'Order not found.' })
  }
  return response.json({ success: true, data: order })
}
