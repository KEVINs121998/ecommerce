import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet } from 'react-router-dom'
import AlertMessage from './components/AlertMessage.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import Navbar from './components/Navbar.jsx'
import { checkAuth } from './features/auth/authSlice.js'
import { loadCart, saveCart, switchToGuestCart } from './features/cart/cartSlice.js'
import { useAuth } from './hooks/useAuth.js'

function App() {
  const dispatch = useDispatch()
  const { user, status, error } = useAuth()
  const cart = useSelector((state) => state.cart)
  const previousUserId = useRef(null)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  useEffect(() => {
    if (status !== 'ready') return
    if (user) {
      dispatch(loadCart({ userId: user.id }))
    } else if (previousUserId.current) {
      dispatch(switchToGuestCart())
    }
    previousUserId.current = user?.id || null
  }, [dispatch, status, user])

  useEffect(() => {
    if (!user || cart.ownerId !== user.id || cart.status !== 'ready') return undefined
    dispatch(saveCart({ userId: user.id, items: cart.items }))
    return undefined
  }, [cart.items, cart.ownerId, cart.status, dispatch, user])

  if (status === 'loading') {
    return <main className="container"><LoadingSpinner label="Checking your session" /></main>
  }

  if (status === 'error') {
    return (
      <main className="container py-5">
        <AlertMessage>{error}</AlertMessage>
        <p>Sign-in status could not be checked. Make sure the API and database are available, then retry.</p>
        <button className="btn btn-primary" onClick={() => dispatch(checkAuth())}>Retry connection</button>
      </main>
    )
  }

  if (user && (cart.ownerId !== user.id || cart.status === 'loading')) {
    return <main className="container"><LoadingSpinner label="Loading your cart" /></main>
  }

  if (user && cart.status === 'error') {
    return (
      <main className="container py-5">
        <AlertMessage>{cart.error}</AlertMessage>
        <p>Your saved cart could not be loaded. Make sure the API and database are available, then retry.</p>
        <button className="btn btn-primary" onClick={() => dispatch(loadCart({ userId: user.id }))}>Retry</button>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <Outlet />
      <footer className="container py-4 mt-auto border-top text-center text-body-secondary small">
        Mini MERN Shop · Learning project
      </footer>
    </>
  )
}

export function NotFoundPage() {
  return (
    <main className="container py-5 text-center">
      <h1 className="h2">Page not found</h1>
      <p className="text-body-secondary">The page you requested does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to shop</Link>
    </main>
  )
}

export default App
