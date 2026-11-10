import Order from '../models/Order.js'
import Product from '../models/Product.js'

export async function getDashboardStats() {
  const [productCount, [analytics = {}]] = await Promise.all([
    Product.countDocuments(),
    Order.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }],
          salesByMonth: [
            { $unwind: '$products' },
            { $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
              unitsSold: { $sum: '$products.quantity' },
            } },
            { $sort: { _id: 1 } },
          ],
          bestSellingProducts: [
            { $unwind: '$products' },
            { $group: {
              _id: '$products.product',
              name: { $first: '$products.name' },
              unitsSold: { $sum: '$products.quantity' },
              revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
            } },
            { $sort: { unitsSold: -1, _id: 1 } },
            { $limit: 5 },
            { $lookup: {
              from: Product.collection.name,
              localField: '_id',
              foreignField: '_id',
              as: 'currentProduct',
            } },
            { $unwind: { path: '$currentProduct', preserveNullAndEmptyArrays: true } },
            { $project: {
              _id: 0,
              productId: '$_id',
              name: { $ifNull: ['$currentProduct.name', '$name'] },
              unitsSold: 1,
              revenue: 1,
            } },
          ],
        },
      },
    ]),
  ])
  const totals = analytics.totals?.[0] || { totalOrders: 0, totalRevenue: 0 }

  return {
    totalProducts: productCount,
    totalOrders: totals.totalOrders,
    totalRevenue: totals.totalRevenue,
    salesByMonth: analytics.salesByMonth || [],
    bestSellingProducts: analytics.bestSellingProducts || [],
  }
}
