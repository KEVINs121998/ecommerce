import { getCart as loadCart, mergeCart as mergeUserCart, replaceCart as replaceUserCart } from '../services/cartService.js'

export async function getCart(request, response) {
  const items = await loadCart(request.user._id)
  return response.json({ success: true, data: { items } })
}

export async function replaceCart(request, response) {
  const items = await replaceUserCart(request.user._id, request.body?.items)
  return response.json({ success: true, data: { items } })
}

export async function mergeCart(request, response) {
  const items = await mergeUserCart(request.user._id, request.body?.items)
  return response.json({ success: true, data: { items } })
}
