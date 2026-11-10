import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '../../services/api.js'

export const checkAuth = createAsyncThunk('auth/check', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me')
    return response.data.data.user
  } catch (error) {
    if (error.response?.status === 401) return null
    return rejectWithValue(getErrorMessage(error))
  }
})

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials)
    return response.data.data.user
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', details)
    return response.data.data.user
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'loading', requestStatus: 'idle', error: null },
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.status = 'ready'
        state.user = action.payload
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || action.error.message
      })
      .addCase(login.pending, (state) => {
        state.requestStatus = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.requestStatus = 'idle'
        state.status = 'ready'
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.requestStatus = 'idle'
        state.error = action.payload || action.error.message
      })
      .addCase(register.pending, (state) => {
        state.requestStatus = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.requestStatus = 'idle'
        state.status = 'ready'
        state.user = action.payload
      })
      .addCase(register.rejected, (state, action) => {
        state.requestStatus = 'idle'
        state.error = action.payload || action.error.message
      })
      .addCase(logout.pending, (state) => {
        state.requestStatus = 'loading'
        state.error = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.requestStatus = 'idle'
        state.user = null
      })
      .addCase(logout.rejected, (state, action) => {
        state.requestStatus = 'idle'
        state.error = action.payload || action.error.message
      })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
