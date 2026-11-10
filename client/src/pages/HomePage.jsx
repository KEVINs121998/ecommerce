import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart } from '../features/cart/cartSlice.js'
import useDebounce from '../hooks/useDebounce.js'
import api, { getErrorMessage } from '../services/api.js'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Pagination from '../components/Pagination.jsx'
import ProductList from '../components/ProductList.jsx'
import SearchBar from '../components/SearchBar.jsx'

function HomePage() {
  const dispatch = useDispatch()
  const searchInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalItems: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    api.get('/products/categories', { signal: controller.signal })
      .then(({ data }) => setCategories(data.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(getErrorMessage(requestError))
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = { page, limit: 8, sort }
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
    if (category) params.category = category
    if (minPrice !== '') params.minPrice = minPrice
    if (maxPrice !== '') params.maxPrice = maxPrice

    api.get('/products', { params, signal: controller.signal })
      .then(({ data }) => {
        setProducts(data.data)
        setPagination(data.pagination)
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, debouncedSearch, category, minPrice, maxPrice, sort])

  const handleAddToCart = useCallback((product) => {
    dispatch(addToCart(product))
    setNotice(`${product.name} added to cart.`)
  }, [dispatch])

  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
    setLoading(true)
    setError('')
  }

  function handlePageChange(nextPage) {
    setPage(nextPage)
    setLoading(true)
  }

  return (
    <main className="container py-4 py-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-uppercase text-primary fw-semibold mb-1">Find something you love</p>
          <h1 className="h2 mb-0">Shop products</h1>
        </div>
        <span className="text-body-secondary">{pagination.totalItems} {pagination.totalItems === 1 ? 'product' : 'products'}</span>
      </div>
      <section className="card border-0 shadow-sm mb-4" aria-label="Product filters">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <SearchBar value={search} onChange={(value) => updateFilter(setSearch, value)} inputRef={searchInputRef} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="category-filter">Category</label>
              <select id="category-filter" className="form-select" value={category} onChange={(event) => updateFilter(setCategory, event.target.value)}>
                <option value="">All categories</option>
                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="min-price">Minimum price</label>
              <input id="min-price" className="form-control" type="number" min="0" step="0.01" value={minPrice} onChange={(event) => updateFilter(setMinPrice, event.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="max-price">Maximum price</label>
              <input id="max-price" className="form-control" type="number" min="0" step="0.01" value={maxPrice} onChange={(event) => updateFilter(setMaxPrice, event.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="sort-products">Sort</label>
              <select id="sort-products" className="form-select" value={sort} onChange={(event) => updateFilter(setSort, event.target.value)}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name_asc">Name</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      <AlertMessage>{error}</AlertMessage>
      {notice && <AlertMessage variant="success">{notice}</AlertMessage>}
      {loading ? <LoadingSpinner label="Loading products" /> : <ProductList products={products} onAddToCart={handleAddToCart} />}
      {!loading && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
    </main>
  )
}

export default HomePage
