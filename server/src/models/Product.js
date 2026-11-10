import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    image: { type: String, required: true },
  },
  { timestamps: true },
)

productSchema.index({ category: 1, price: 1 })
productSchema.index({ name: 1 })
productSchema.index({ createdAt: -1 })

const Product = mongoose.model('Product', productSchema)

export default Product
