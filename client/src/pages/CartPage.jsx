import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AlertMessage from '../components/AlertMessage.jsx'
import CartItem from '../components/CartItem.jsx'
import { clearCart, decreaseQuantity, increaseQuantity, loadCart, removeFromCart, saveCart } from '../features/cart/cartSlice.js'
import { useAuth } from '../hooks/useAuth.js'
import api, { getErrorMessage } from '../services/api.js'

function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const items = useSelector((state) => state.cart.items)
  const saveError = useSelector((state) => state.cart.saveError)
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleIncrease = useCallback((productId) => dispatch(increaseQuantity(productId)), [dispatch])
  const handleDecrease = useCallback((productId) => dispatch(decreaseQuantity(productId)), [dispatch])
  const handleRemove = useCallback((productId) => dispatch(removeFromCart(productId)), [dispatch])

  async function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/cart' } } })
      return
    }

    setError('')
    setLoading(true)
    try {
      await dispatch(saveCart({ userId: user.id, items })).unwrap()
      const { data } = await api.post('/orders')
      dispatch(clearCart())
      navigate('/orders', { state: { confirmation: `Order ${data.data._id} placed successfully.` } })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container py-4 py-lg-5">
      <h1 className="h2 mb-4">Your cart</h1>
      <AlertMessage>{error}</AlertMessage>
      <AlertMessage>{saveError}</AlertMessage>
      {saveError && user && <button className="btn btn-outline-primary mb-3" onClick={() => dispatch(loadCart({ userId: user.id }))}>Reload cart</button>}
      {items.length === 0 ? (
        <section className="card border-0 shadow-sm"><div className="card-body p-5 text-center">
          <p className="text-body-secondary">Your cart is empty.</p><Link className="btn btn-primary" to="/">Browse products</Link>
        </div></section>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {items.map((item) => (
              <CartItem key={item.productId} item={item} onIncrease={handleIncrease} onDecrease={handleDecrease} onRemove={handleRemove} />
            ))}
          </div>
          <aside className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h5">Order summary</h2>
                <div className="d-flex justify-content-between my-3"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                <p className="small text-body-secondary">This learning project does not process payments.</p>
                <button className="btn btn-primary w-100" disabled={loading} onClick={handleCheckout}>
                  {loading ? 'Placing order…' : 'Place order'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

export default CartPage
