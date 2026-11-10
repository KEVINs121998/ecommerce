import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '../../services/api.js'

const GUEST_CART_KEY = 'mini-mern-guest-cart'
let saveQueue = Promise.resolve()

function readGuestCart() {
  if (typeof window === 'undefined') return []

  try {
    window.localStorage.removeItem('mini-mern-cart')
    const savedItems = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || '[]')
    if (!Array.isArray(savedItems)) throw new Error('Saved guest cart data is not an array.')
    return savedItems.filter((item) =>
      item && typeof item.productId === 'string' &&
      typeof item.name === 'string' && Number.isFinite(item.price) &&
      Number.isInteger(item.quantity) && item.quantity > 0,
    )
  } catch (error) {
    console.error('Could not restore the guest cart:', error)
    return []
  }
}

export const loadCart = createAsyncThunk('cart/load', async ({ userId }, { rejectWithValue }) => {
  try {
    const guestItems = readGuestCart()
    const response = guestItems.length
      ? await api.post('/cart/merge', {
        items: guestItems.map(({ productId, quantity }) => ({ productId, quantity })),
      })
      : await api.get('/cart')
    if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_CART_KEY)
    return { userId, items: response.data.data.items }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const saveCart = createAsyncThunk('cart/save', async ({ userId, items }, { getState, rejectWithValue }) => {
  const request = saveQueue.then(() => {
    if (getState().auth?.user?.id !== userId) return null
    return api.put('/cart', {
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    })
  })
  saveQueue = request.then(() => undefined, () => undefined)

  try {
    const response = await request
    return { userId, items: response?.data.data.items }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: readGuestCart(), ownerId: null, status: 'idle', error: null, saveError: null },
  reducers: {
    addToCart(state, action) {
      const product = action.payload
      const productId = product._id || product.id
      if (!productId || product.stock < 1) return

      const existing = state.items.find((item) => item.productId === productId)
      if (existing) {
        existing.stock = product.stock
        existing.quantity = Math.min(existing.quantity + 1, product.stock)
      } else {
        state.items.push({
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: 1,
        })
      }
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.productId !== action.payload)
    },
    increaseQuantity(state, action) {
      const item = state.items.find((cartItem) => cartItem.productId === action.payload)
      if (item && item.quantity < item.stock) item.quantity += 1
    },
    decreaseQuantity(state, action) {
      const item = state.items.find((cartItem) => cartItem.productId === action.payload)
      if (item && item.quantity > 1) item.quantity -= 1
    },
    clearCart(state) {
      state.items = []
    },
    switchToGuestCart(state) {
      state.items = []
      state.ownerId = null
      state.status = 'ready'
      state.error = null
      state.saveError = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadCart.pending, (state, action) => {
        state.items = []
        state.ownerId = action.meta.arg.userId
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return
        state.items = action.payload.items
        state.status = 'ready'
      })
      .addCase(loadCart.rejected, (state, action) => {
        if (state.ownerId !== action.meta.arg.userId) return
        state.status = 'error'
        state.error = action.payload || action.error.message
      })
      .addCase(saveCart.pending, (state) => {
        state.saveError = null
      })
      .addCase(saveCart.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return
        state.saveError = null
      })
      .addCase(saveCart.rejected, (state, action) => {
        if (state.ownerId !== action.meta.arg.userId) return
        state.saveError = action.payload || action.error.message
      })
  },
})

export const { addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, switchToGuestCart } =
  cartSlice.actions
export default cartSlice.reducer
