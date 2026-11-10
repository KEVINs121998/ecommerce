import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import api, { getErrorMessage, getImageUrl } from '../services/api.js'

const emptyProduct = { name: '', description: '', price: '', category: '', stock: '' }

function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [form, setForm] = useState(emptyProduct)
  const [file, setFile] = useState(null)
  const [existingImage, setExistingImage] = useState('')
  const [error, setError] = useState('')
  const [loadedProductId, setLoadedProductId] = useState(null)
  const [saving, setSaving] = useState(false)
  const loading = isEditing && loadedProductId !== id
  useEffect(() => {
    if (!isEditing) return undefined
    const controller = new AbortController()
    api.get(`/products/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        const product = data.data
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price),
          category: product.category,
          stock: String(product.stock),
        })
        setExistingImage(product.image)
        setLoadedProductId(id)
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getErrorMessage(requestError))
          setLoadedProductId(id)
        }
      })
    return () => controller.abort()
  }, [id, isEditing])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.append(key, value))
    if (file) formData.append('image', file)

    try {
      if (isEditing) await api.put(`/products/${id}`, formData)
      else await api.post('/products', formData)
      navigate('/admin/products')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="container"><LoadingSpinner label="Loading product" /></main>

  return (
    <main className="container py-4 py-lg-5">
      <Link to="/admin/products" className="text-decoration-none">&larr; Manage products</Link>
      <div className="row justify-content-center mt-3">
        <div className="col-12 col-lg-8">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 mb-4">{isEditing ? 'Edit product' : 'Add product'}</h1>
              <AlertMessage>{error}</AlertMessage>
              <form onSubmit={handleSubmit}>
                <div className="mb-3"><label className="form-label" htmlFor="product-name">Name</label><input id="product-name" className="form-control" name="name" required maxLength={120} value={form.name} onChange={handleChange} /></div>
                <div className="mb-3"><label className="form-label" htmlFor="product-description">Description</label><textarea id="product-description" className="form-control" name="description" rows="4" required maxLength={2000} value={form.description} onChange={handleChange} /></div>
                <div className="row g-3">
                  <div className="col-12 col-md-4"><label className="form-label" htmlFor="product-price">Price</label><input id="product-price" className="form-control" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} /></div>
                  <div className="col-12 col-md-4"><label className="form-label" htmlFor="product-category">Category</label><input id="product-category" className="form-control" name="category" required maxLength={60} value={form.category} onChange={handleChange} /></div>
                  <div className="col-12 col-md-4"><label className="form-label" htmlFor="product-stock">Stock</label><input id="product-stock" className="form-control" name="stock" type="number" min="0" step="1" required value={form.stock} onChange={handleChange} /></div>
                </div>
                <div className="mt-3 mb-4">
                  <label className="form-label" htmlFor="product-image">Product image ({isEditing ? 'optional when keeping the current image' : 'required'})</label>
                  <input id="product-image" className="form-control" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required={!isEditing} onChange={(event) => setFile(event.target.files?.[0] || null)} />
                  <div className="form-text">JPEG, PNG, or WEBP; maximum size 5 MB.</div>
                  {existingImage && <img className="mt-3 product-preview rounded" src={getImageUrl(existingImage)} alt="Current product" />}
                  {file && <p className="small text-body-secondary mt-2 mb-0">New image selected: {file.name}</p>}
                </div>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default AdminProductFormPage
