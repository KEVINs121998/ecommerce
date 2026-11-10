import { useEffect, useState } from 'react'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import api, { getErrorMessage } from '../services/api.js'

function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/orders', { signal: controller.signal })
      .then(({ data }) => setOrders(data.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function handleStatusChange(orderId, status) {
    setError('')
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status })
      setOrders((current) => current.map((order) => order._id === orderId ? data.data : order))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <main className="container py-4 py-lg-5">
      <h1 className="h2 mb-4">Manage orders</h1>
      <AlertMessage>{error}</AlertMessage>
      {loading ? <LoadingSpinner label="Loading orders" /> : orders.length ? (
        <div className="d-grid gap-3">
          {orders.map((order) => (
            <article className="card" key={order._id}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div><h2 className="h6">Order {order._id}</h2><p className="mb-1">{order.user?.name} · {order.user?.email}</p><small className="text-body-secondary">{new Date(order.createdAt).toLocaleString()}</small></div>
                  <label className="d-flex align-items-center gap-2">
                    <span>Status</span>
                    <select className="form-select" value={order.status} onChange={(event) => handleStatusChange(order._id, event.target.value)}>
                      <option>Pending</option><option>Shipped</option><option>Delivered</option>
                    </select>
                  </label>
                </div>
                <ul className="mt-3">{order.products.map((item) => <li key={`${order._id}-${item.product}`}>{item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}</li>)}</ul>
                <strong>Total: ${order.totalAmount.toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : !loading && <p className="text-body-secondary">There are no orders yet.</p>}
    </main>
  )
}

export default AdminOrdersPage
