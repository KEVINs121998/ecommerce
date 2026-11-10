import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import cartReducer from '../features/cart/cartSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
})

store.subscribe(() => {
  if (typeof window === 'undefined') return
  const { items, ownerId } = store.getState().cart
  if (ownerId) return
  try {
    window.localStorage.setItem('mini-mern-guest-cart', JSON.stringify(items))
  } catch (error) {
    console.error('Could not save the guest cart in this browser:', error)
  }
})
