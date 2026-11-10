import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { addToCart } from '../features/cart/cartSlice.js'
import api, { getErrorMessage, getImageUrl } from '../services/api.js'

function ProductPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [product, setProduct] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loading = loadedId !== id

  useEffect(() => {
    const controller = new AbortController()
    api.get(`/products/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setProduct(data.data)
        setError('')
        setLoadedId(id)
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getErrorMessage(requestError))
          setProduct(null)
          setLoadedId(id)
        }
      })
    return () => controller.abort()
  }, [id])

  const handleAddToCart = useCallback(() => {
    dispatch(addToCart(product))
    setNotice(`${product.name} added to cart.`)
  }, [dispatch, product])

  if (loading) return <main className="container"><LoadingSpinner label="Loading product" /></main>
  if (error || !product) {
    return <main className="container py-5"><AlertMessage>{error || 'Product not found.'}</AlertMessage><Link to="/">Back to shop</Link></main>
  }

  return (
    <main className="container py-4 py-lg-5">
      <Link to="/" className="text-decoration-none">&larr; Back to shop</Link>
      <div className="row g-4 g-lg-5 mt-1">
        <div className="col-12 col-md-6">
          <img className="img-fluid rounded product-detail-image" src={getImageUrl(product.image)} alt={product.name} />
        </div>
        <div className="col-12 col-md-6">
          <span className="badge text-bg-light border">{product.category}</span>
          <h1 className="h2 mt-3">{product.name}</h1>
          <p className="h4 text-primary">${product.price.toFixed(2)}</p>
          <p className="text-body-secondary">{product.description}</p>
          <p>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          <AlertMessage variant="success">{notice}</AlertMessage>
          <button className="btn btn-primary btn-lg" disabled={product.stock < 1} onClick={handleAddToCart}>Add to cart</button>
        </div>
      </div>
    </main>
  )
}

export default ProductPage
