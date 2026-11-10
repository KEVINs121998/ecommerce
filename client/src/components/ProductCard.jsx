import { memo } from 'react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../services/api.js'

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="card h-100 product-card">
      <Link to={`/products/${product._id}`} className="product-image-wrap">
        <img
          className="card-img-top product-image"
          src={getImageUrl(product.image)}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <span className="small text-body-secondary">{product.category}</span>
        <h2 className="h6 card-title mt-1">
          <Link className="link-dark text-decoration-none" to={`/products/${product._id}`}>
            {product.name}
          </Link>
        </h2>
        <p className="fw-semibold mb-3">${product.price.toFixed(2)}</p>
        <button
          className="btn btn-primary mt-auto"
          disabled={product.stock < 1}
          onClick={() => onAddToCart(product)}
        >
          {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
        </button>
      </div>
    </article>
  )
}

export default memo(ProductCard)
