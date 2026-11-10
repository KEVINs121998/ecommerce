import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import api, { getErrorMessage } from '../services/api.js'

function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    api.get('/admin/stats', { signal: controller.signal })
      .then(({ data }) => setStats(data.data))
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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><p className="text-uppercase text-primary fw-semibold mb-1">Store management</p><h1 className="h2 mb-0">Admin dashboard</h1></div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/admin/products">Manage products</Link>
          <Link className="btn btn-primary" to="/admin/orders">Manage orders</Link>
        </div>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {loading ? <LoadingSpinner label="Loading sales statistics" /> : stats && (
        <>
          <div className="row g-3 mb-5">
            <div className="col-12 col-md-4"><StatCard label="Products" value={stats.totalProducts} /></div>
            <div className="col-12 col-md-4"><StatCard label="Orders" value={stats.totalOrders} /></div>
            <div className="col-12 col-md-4"><StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} /></div>
          </div>
          <div className="row g-4">
            <section className="col-12 col-lg-6">
              <h2 className="h5">Sales by month</h2>
              {stats.salesByMonth.length ? (
                <div className="table-responsive"><table className="table align-middle">
                  <thead><tr><th>Month</th><th>Revenue</th><th>Units sold</th></tr></thead>
                  <tbody>{stats.salesByMonth.map((month) => (
                    <tr key={month._id}><td>{month._id}</td><td>${month.revenue.toFixed(2)}</td><td>{month.unitsSold}</td></tr>
                  ))}</tbody>
                </table></div>
              ) : <p className="text-body-secondary">Sales will appear here after the first order.</p>}
            </section>
            <section className="col-12 col-lg-6">
              <h2 className="h5">Best-selling products</h2>
              {stats.bestSellingProducts.length ? (
                <ol className="list-group list-group-numbered">
                  {stats.bestSellingProducts.map((product) => (
                    <li className="list-group-item d-flex justify-content-between" key={product.productId}>
                      <span>{product.name}<small className="d-block text-body-secondary">{product.unitsSold} sold</small></span>
                      <strong>${product.revenue.toFixed(2)}</strong>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-body-secondary">No products have been sold yet.</p>}
            </section>
          </div>
        </>
      )}
    </main>
  )
}

function StatCard({ label, value }) {
  return <article className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-body-secondary mb-1">{label}</p><p className="h3 mb-0">{value}</p></div></article>
}

export default AdminDashboardPage
