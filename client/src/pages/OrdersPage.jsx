import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import api, { getErrorMessage } from '../services/api.js'

function OrdersPage() {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/orders/mine', { signal: controller.signal })
      .then(({ data }) => setOrders(data.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="container py-4 py-lg-5">
      <h1 className="h2 mb-4">My orders</h1>
      <AlertMessage variant="success">{location.state?.confirmation}</AlertMessage>
      <AlertMessage>{error}</AlertMessage>
      {loading ? <LoadingSpinner label="Loading orders" /> : orders.length ? (
        <div className="d-grid gap-3">
          {orders.map((order) => (
            <article className="card" key={order._id}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <h2 className="h6 mb-0">Order {order._id}</h2>
                  <span className="badge text-bg-secondary">{order.status}</span>
                </div>
                <p className="small text-body-secondary mt-2">Placed {new Date(order.createdAt).toLocaleString()}</p>
                <ul className="mb-3">
                  {order.products.map((item) => <li key={`${order._id}-${item.product}`}>{item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}</li>)}
                </ul>
                <strong>Total: ${order.totalAmount.toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : !loading && <p className="text-body-secondary">You have not placed any orders yet.</p>}
    </main>
  )
}

export default OrdersPage
