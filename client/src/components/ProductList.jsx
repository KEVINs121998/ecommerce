import ProductCard from './ProductCard.jsx'

function ProductList({ products, onAddToCart }) {
  if (!products.length) {
    return <p className="text-center text-body-secondary py-5">No products match these filters.</p>
  }

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
      {products.map((product) => (
        <div className="col" key={product._id}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  )
}

export default ProductList
