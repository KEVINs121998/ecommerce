import assert from 'node:assert/strict'
import { test } from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import cartReducer, {
  addToCart,
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from '../src/features/cart/cartSlice.js'

function createTestStore() {
  return configureStore({ reducer: { cart: cartReducer } })
}

const product = {
  _id: 'product-1',
  name: 'Desk lamp',
  price: 24.5,
  image: '/uploads/lamp.jpg',
  stock: 2,
}

test('cart adds products and caps quantity at available stock', () => {
  const store = createTestStore()
  store.dispatch(addToCart(product))
  store.dispatch(addToCart(product))
  store.dispatch(addToCart(product))

  assert.equal(store.getState().cart.items.length, 1)
  assert.equal(store.getState().cart.items[0].quantity, 2)
})

test('cart quantity controls and remove/clear actions work', () => {
  const store = createTestStore()
  store.dispatch(addToCart(product))
  store.dispatch(increaseQuantity('product-1'))
  store.dispatch(decreaseQuantity('product-1'))
  assert.equal(store.getState().cart.items[0].quantity, 1)

  store.dispatch(removeFromCart('product-1'))
  assert.equal(store.getState().cart.items.length, 0)

  store.dispatch(addToCart(product))
  store.dispatch(clearCart())
  assert.equal(store.getState().cart.items.length, 0)
})
