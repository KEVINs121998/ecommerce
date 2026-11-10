import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import Product from '../models/Product.js'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

const products = [
  {
    name: 'Studio Wireless Headphones',
    description: 'Comfortable over-ear headphones for music, calls, and focused work.',
    price: 89.99,
    category: 'Electronics',
    stock: 24,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Everyday Wristwatch',
    description: 'A clean, versatile watch with a minimalist dial and durable strap.',
    price: 64.5,
    category: 'Accessories',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Classic Red Sneakers',
    description: 'Lightweight everyday sneakers with a cushioned sole.',
    price: 72,
    category: 'Fashion',
    stock: 32,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Canvas Travel Backpack',
    description: 'A practical carry-on backpack with room for daily essentials.',
    price: 49.99,
    category: 'Accessories',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Modern Desk Lamp',
    description: 'An adjustable desk lamp to brighten a reading nook or workspace.',
    price: 38,
    category: 'Home',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Compact Mirrorless Camera',
    description: 'A compact camera for travel, portraits, and everyday photography.',
    price: 549,
    category: 'Electronics',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'A pair of simple ceramic mugs for coffee, tea, or cocoa.',
    price: 22.5,
    category: 'Home',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'A reusable insulated bottle for keeping drinks close at hand.',
    price: 19.95,
    category: 'Outdoor',
    stock: 36,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Ergonomic Desk Chair',
    description: 'A supportive office chair with a breathable back and adjustable height.',
    price: 179,
    category: 'Home',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'A tactile keyboard for comfortable typing at home or in the office.',
    price: 94,
    category: 'Electronics',
    stock: 14,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Daily Skincare Set',
    description: 'A simple skincare set for a refreshing morning or evening routine.',
    price: 34.99,
    category: 'Beauty',
    stock: 22,
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Smartphone',
    description: 'A modern smartphone for capturing photos, staying connected, and streaming.',
    price: 399,
    category: 'Electronics',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  },
]

const additionalProductDetails = [
  ['Bluetooth Earbuds', 'Electronics', 39.99],
  ['Portable Bluetooth Speaker', 'Electronics', 58],
  ['Wireless Charging Pad', 'Electronics', 21.5],
  ['USB-C Fast Charger', 'Electronics', 18.99],
  ['HD Webcam', 'Electronics', 67],
  ['Portable SSD 1TB', 'Electronics', 109],
  ['Noise-Canceling Headset', 'Electronics', 129],
  ['Fitness Smartwatch', 'Electronics', 119],
  ['Tablet Stand', 'Electronics', 25],
  ['Gaming Mouse', 'Electronics', 44],
  ['Laptop Sleeve', 'Electronics', 32],
  ['LED Monitor Light Bar', 'Electronics', 53],
  ['Action Camera', 'Electronics', 219],
  ['E-Reader', 'Electronics', 139],
  ['Scented Candle Set', 'Home', 27],
  ['Soft Knit Throw Blanket', 'Home', 46],
  ['Decorative Cushion Pair', 'Home', 35],
  ['Wall Clock', 'Home', 41],
  ['Tabletop Plant Pot', 'Home', 16],
  ['Bedside Table Organizer', 'Home', 29],
  ['Minimalist Wall Art', 'Home', 52],
  ['Folding Storage Basket', 'Home', 23],
  ['Cotton Bath Towel Set', 'Home', 39],
  ['Ceramic Flower Vase', 'Home', 31],
  ['Entryway Shoe Rack', 'Home', 74],
  ['Linen Duvet Cover', 'Home', 89],
  ['Reading Floor Lamp', 'Home', 96],
  ['Wooden Bookends', 'Home', 24],
  ['Everyday Cotton T-Shirt', 'Fashion', 19],
  ['Relaxed Fit Hoodie', 'Fashion', 54],
  ['Lightweight Denim Jacket', 'Fashion', 79],
  ['Classic Chino Trousers', 'Fashion', 59],
  ['Linen Summer Shirt', 'Fashion', 48],
  ['Running Shoes', 'Fashion', 84],
  ['Leather Ankle Boots', 'Fashion', 112],
  ['Canvas Slip-On Shoes', 'Fashion', 43],
  ['Warm Wool Scarf', 'Fashion', 29],
  ['Everyday Baseball Cap', 'Fashion', 22],
  ['Ribbed Knit Beanie', 'Fashion', 18],
  ['Weekend Joggers', 'Fashion', 45],
  ['Lightweight Rain Jacket', 'Fashion', 92],
  ['Polarized Sunglasses', 'Accessories', 37],
  ['Leather Card Holder', 'Accessories', 28],
  ['Travel Toiletry Bag', 'Accessories', 33],
  ['Classic Leather Belt', 'Accessories', 31],
  ['Everyday Tote Bag', 'Accessories', 42],
  ['Compact Travel Wallet', 'Accessories', 26],
  ['Stainless Steel Bracelet', 'Accessories', 35],
  ['Weekend Duffle Bag', 'Accessories', 68],
  ['Protective Phone Case', 'Accessories', 17],
  ['Polar Fleece Gloves', 'Accessories', 24],
  ['Packing Cube Set', 'Accessories', 30],
  ['Insulated Travel Tumbler', 'Outdoor', 27],
  ['Compact Camping Lantern', 'Outdoor', 34],
  ['Lightweight Hiking Daypack', 'Outdoor', 61],
  ['Packable Picnic Blanket', 'Outdoor', 39],
  ['Stainless Camping Cookware', 'Outdoor', 48],
  ['Reusable Hiking Cutlery', 'Outdoor', 14],
  ['Quick-Dry Travel Towel', 'Outdoor', 22],
  ['Compact Binoculars', 'Outdoor', 79],
  ['Waterproof Dry Bag', 'Outdoor', 29],
  ['Portable Hammock', 'Outdoor', 57],
  ['Insulated Lunch Bag', 'Outdoor', 25],
  ['Gentle Facial Cleanser', 'Beauty', 16],
  ['Daily Moisturizer', 'Beauty', 24],
  ['Hydrating Face Serum', 'Beauty', 32],
  ['Mineral Sunscreen SPF 30', 'Beauty', 21],
  ['Nourishing Hand Cream Set', 'Beauty', 18],
  ['Soft Makeup Brush Set', 'Beauty', 29],
  ['Botanical Shampoo', 'Beauty', 17],
  ['Conditioning Hair Mask', 'Beauty', 23],
  ['Citrus Body Wash', 'Beauty', 15],
  ['Reusable Makeup Pads', 'Beauty', 12],
  ['Pour-Over Coffee Dripper', 'Kitchen', 28],
  ['Glass Food Storage Set', 'Kitchen', 36],
  ['Bamboo Cutting Board', 'Kitchen', 25],
  ['Chef Knife', 'Kitchen', 49],
  ['Measuring Cup Set', 'Kitchen', 19],
  ['Cotton Kitchen Towel Set', 'Kitchen', 16],
  ['French Press Coffee Maker', 'Kitchen', 42],
  ['Reusable Silicone Food Bags', 'Kitchen', 23],
  ['Ceramic Serving Bowl', 'Kitchen', 34],
  ['Electric Milk Frother', 'Kitchen', 31],
  ['Glass Water Pitcher', 'Kitchen', 27],
  ['Digital Kitchen Scale', 'Kitchen', 22],
  ['Stainless Steel Colander', 'Kitchen', 18],
  ['Nonstick Frying Pan', 'Kitchen', 39],
  ['Acacia Wood Utensil Set', 'Kitchen', 26],
]

const categoryImages = {
  Electronics: [
    products[0].image,
    products[5].image,
    products[9].image,
    products[11].image,
  ],
  Home: [products[4].image, products[6].image, products[8].image],
  Fashion: [products[2].image],
  Accessories: [products[1].image, products[3].image],
  Outdoor: [products[7].image],
  Beauty: [products[10].image],
  Kitchen: [products[6].image],
}

const categoryImageCounts = new Map()
for (const [index, [name, category, price]] of additionalProductDetails.entries()) {
  const imageIndex = categoryImageCounts.get(category) || 0
  const images = categoryImages[category]
  products.push({
    name,
    description: `A practical ${name.toLowerCase()} selected for everyday use.`,
    price,
    category,
    stock: 10 + ((index * 7) % 41),
    image: images[imageIndex % images.length],
  })
  categoryImageCounts.set(category, imageIndex + 1)
}

if (products.length !== 100) {
  throw new Error(`The demo catalog must contain exactly 100 products; found ${products.length}.`)
}

async function seedProducts() {
  await connectDatabase()

  let inserted = 0
  let skipped = 0
  for (const product of products) {
    const result = await Product.updateOne(
      { name: product.name, category: product.category },
      { $setOnInsert: product },
      { upsert: true, runValidators: true },
    )
    if (result.upsertedCount) inserted += 1
    else skipped += 1
  }

  console.info(`Demo catalog ready: ${inserted} product(s) added, ${skipped} existing product(s) left unchanged.`)
}

seedProducts()
  .catch((error) => {
    console.error('Could not seed the demo product catalog:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
