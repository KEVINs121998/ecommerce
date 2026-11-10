import mongoose from 'mongoose'

const orderProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: { type: [orderProductSchema], required: true, validate: (items) => items.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered'], default: 'Pending' },
  },
  { timestamps: true },
)

orderSchema.index({ user: 1, createdAt: -1 })

const Order = mongoose.model('Order', orderSchema)

export default Order
