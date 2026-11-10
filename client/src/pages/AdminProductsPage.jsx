import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Pagination from '../components/Pagination.jsx'
import api, { getErrorMessage, getImageUrl } from '../services/api.js'

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalPages: 0 })
  const [loadedPage, setLoadedPage] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loading = loadedPage !== page

  useEffect(() => {
    const controller = new AbortController()
    api.get('/products', { params: { page, limit: 50 }, signal: controller.signal })
      .then(({ data }) => {
        setProducts(data.data)
        setPagination(data.pagination)
        setLoadedPage(page)
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getErrorMessage(requestError))
          setLoadedPage(page)
        }
      })
    return () => controller.abort()
  }, [page])

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/products/${product._id}`)
      setProducts((current) => current.filter((item) => item._id !== product._id))
      setNotice(`${product.name} was deleted.`)
      if (products.length === 1 && page > 1) setPage(page - 1)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <main className="container py-4 py-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h2 mb-0">Manage products</h1>
        <Link className="btn btn-primary" to="/admin/products/new">Add product</Link>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <AlertMessage variant="success">{notice}</AlertMessage>
      {loading ? <LoadingSpinner label="Loading products" /> : products.length ? (
        <div className="table-responsive card border-0 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product._id}>
                <td><div className="d-flex align-items-center gap-2"><img className="admin-product-image rounded" src={getImageUrl(product.image)} alt="" /><span>{product.name}</span></div></td>
                <td>{product.category}</td><td>${product.price.toFixed(2)}</td><td>{product.stock}</td>
                <td><div className="d-flex gap-2">
                  <Link className="btn btn-sm btn-outline-primary" to={`/admin/products/${product._id}/edit`}>Edit</Link>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product)}>Delete</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="text-body-secondary">No products yet.</p>}
      {!loading && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </main>
  )
}

export default AdminProductsPage
