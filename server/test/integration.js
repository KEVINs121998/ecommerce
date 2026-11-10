import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import app from '../src/app.js'
import { getUploadPath } from '../src/config/uploads.js'
import User from '../src/models/User.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

const testDatabaseName = `mern_ecommerce_test_${randomUUID().replaceAll('-', '')}`

function assertLocalMongoUri(mongoUri) {
  let parsedUri
  try {
    parsedUri = new URL(mongoUri)
  } catch {
    throw new Error('Integration tests require a valid local MONGODB_URI in server/.env.')
  }
  if (!['localhost', '127.0.0.1', '::1'].includes(parsedUri.hostname)) {
    throw new Error('Integration tests only run against a local MongoDB server.')
  }
  return parsedUri
}

async function request(baseUrl, route, options = {}, cookie) {
  const headers = new Headers(options.headers)
  if (cookie) headers.set('Cookie', cookie)
  const response = await fetch(`${baseUrl}/api${route}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  return { response, data }
}

async function main() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set a JWT_SECRET of at least 32 characters in server/.env.')
  }
  const mongoUri = process.env.MONGODB_URI
  const testUri = assertLocalMongoUri(mongoUri)
  testUri.pathname = `/${testDatabaseName}`

  await mongoose.connect(mongoUri)
  const existingDatabases = await mongoose.connection.db.admin().listDatabases({ nameOnly: true })
  if (existingDatabases.databases.some(({ name }) => name === testDatabaseName)) {
    throw new Error(`${testDatabaseName} already exists. The integration test will not overwrite it.`)
  }
  await mongoose.disconnect()
  process.env.MONGODB_URI = testUri.toString()

  let server
  let databaseCreated = false
  const uploadedImages = []
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    databaseCreated = true
    const admin = await User.create({
      name: 'Integration Admin',
      email: 'admin@integration.test',
      password: 'integration-admin-password',
      role: 'admin',
    })
    assert.equal(admin.role, 'admin')

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve)
    })
    const baseUrl = `http://127.0.0.1:${server.address().port}`

    let result = await request(baseUrl, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'integration-admin-password' }),
    })
    assert.equal(result.response.status, 200)
    const adminCookie = result.response.headers.get('set-cookie').split(';', 1)[0]

    result = await request(baseUrl, '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Customer',
        email: 'customer@integration.test',
        password: 'integration-customer-password',
        role: 'admin',
      }),
    })
    assert.equal(result.response.status, 201)
    assert.equal(result.data.data.user.role, 'customer')
    const customerCookie = result.response.headers.get('set-cookie').split(';', 1)[0]

    result = await request(baseUrl, '/admin/stats', {}, customerCookie)
    assert.equal(result.response.status, 403)

    const imageBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=',
      'base64',
    )
    async function createProduct(name, price, stock) {
      const form = new FormData()
      form.set('name', name)
      form.set('description', `${name} for integration testing`)
      form.set('price', String(price))
      form.set('category', 'Accessories')
      form.set('stock', String(stock))
      form.set('image', new Blob([imageBytes], { type: 'image/png' }), `${name}.png`)
      const created = await request(baseUrl, '/products', { method: 'POST', body: form }, adminCookie)
      assert.equal(created.response.status, 201, JSON.stringify(created.data))
      uploadedImages.push(created.data.data.image)
      return created.data.data
    }

    const lamp = await createProduct('Desk Lamp', 24.5, 4)
    const secondLamp = await createProduct('Reading Lamp', 18, 3)

    const updatedLampForm = new FormData()
    updatedLampForm.set('name', 'Desk Lamp')
    updatedLampForm.set('description', 'Updated desk lamp')
    updatedLampForm.set('price', '24.5')
    updatedLampForm.set('category', 'Accessories')
    updatedLampForm.set('stock', '4')
    updatedLampForm.set('image', new Blob([imageBytes], { type: 'image/png' }), 'replacement.png')
    result = await request(baseUrl, `/products/${lamp._id}`, { method: 'PUT', body: updatedLampForm }, adminCookie)
    assert.equal(result.response.status, 200)
    assert.notEqual(result.data.data.image, lamp.image)
    uploadedImages.push(result.data.data.image)
    const imageResponse = await fetch(`${baseUrl}${result.data.data.image}`)
    assert.equal(imageResponse.status, 200)
    assert.match(imageResponse.headers.get('content-type'), /image\/png/)

    result = await request(baseUrl, '/products?search=desk&category=Accessories&minPrice=20&maxPrice=30&sort=price_asc&page=1&limit=1')
    assert.equal(result.response.status, 200)
    assert.equal(result.data.data.length, 1)
    assert.equal(result.data.pagination.totalItems, 1)
    assert.equal(result.data.data[0]._id, lamp._id)
    result = await request(baseUrl, '/products?sort=constructor&page=1&limit=1')
    assert.equal(result.response.status, 200)
    result = await request(baseUrl, '/products/categories')
    assert.deepEqual(result.data.data, ['Accessories'])

    const fakeImage = new FormData()
    fakeImage.set('name', 'Invalid image')
    fakeImage.set('description', 'Should be rejected')
    fakeImage.set('price', '1')
    fakeImage.set('category', 'Accessories')
    fakeImage.set('stock', '1')
    fakeImage.set('image', new Blob(['not an image'], { type: 'image/png' }), 'fake.png')
    result = await request(baseUrl, '/products', { method: 'POST', body: fakeImage }, adminCookie)
    assert.equal(result.response.status, 400)

    const unsupportedImage = new FormData()
    unsupportedImage.set('name', 'Unsupported image')
    unsupportedImage.set('description', 'Should be rejected')
    unsupportedImage.set('price', '1')
    unsupportedImage.set('category', 'Accessories')
    unsupportedImage.set('stock', '1')
    unsupportedImage.set('image', new Blob(['not an image'], { type: 'text/plain' }), 'fake.txt')
    result = await request(baseUrl, '/products', { method: 'POST', body: unsupportedImage }, adminCookie)
    assert.equal(result.response.status, 400)

    const tooLargeImage = new FormData()
    tooLargeImage.set('name', 'Oversized image')
    tooLargeImage.set('description', 'Should be rejected')
    tooLargeImage.set('price', '1')
    tooLargeImage.set('category', 'Accessories')
    tooLargeImage.set('stock', '1')
    tooLargeImage.set('image', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png')
    result = await request(baseUrl, '/products', { method: 'POST', body: tooLargeImage }, adminCookie)
    assert.equal(result.response.status, 413)

    result = await request(baseUrl, '/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: lamp._id, quantity: 2 }] }),
    }, customerCookie)
    assert.equal(result.response.status, 200, JSON.stringify(result.data))

    result = await request(baseUrl, '/cart', {}, adminCookie)
    assert.equal(result.data.data.items.length, 0)
    result = await request(baseUrl, '/cart', {}, customerCookie)
    assert.equal(result.data.data.items[0].quantity, 2)

    result = await request(baseUrl, '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, customerCookie)
    assert.equal(result.response.status, 201, JSON.stringify(result.data))
    assert.equal(result.data.data.totalAmount, 49)

    result = await request(baseUrl, '/cart', {}, customerCookie)
    assert.equal(result.data.data.items.length, 0)

    result = await request(baseUrl, '/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: secondLamp._id, quantity: 99 }] }),
    }, customerCookie)
    assert.equal(result.response.status, 409)

    result = await request(baseUrl, `/products/${lamp._id}`)
    assert.equal(result.data.data.stock, 2)

    result = await request(baseUrl, '/orders/mine', {}, customerCookie)
    assert.equal(result.data.data.length, 1)

    result = await request(baseUrl, '/admin/stats', {}, adminCookie)
    assert.equal(result.response.status, 200)
    assert.equal(result.data.data.totalProducts, 2)
    assert.equal(result.data.data.totalOrders, 1)
    assert.equal(result.data.data.totalRevenue, 49)
    assert.equal(result.data.data.salesByMonth[0].unitsSold, 2)
    assert.equal(result.data.data.bestSellingProducts[0].name, 'Desk Lamp')

    result = await request(baseUrl, '/orders', {}, adminCookie)
    assert.equal(result.data.data.length, 1)
    const orderId = result.data.data[0]._id
    result = await request(baseUrl, `/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shipped' }),
    }, adminCookie)
    assert.equal(result.data.data.status, 'Shipped')
    result = await request(baseUrl, `/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' }),
    }, adminCookie)
    assert.equal(result.response.status, 400)

    result = await request(baseUrl, `/products/${secondLamp._id}`, {
      method: 'DELETE',
    }, adminCookie)
    assert.equal(result.response.status, 200)
    result = await request(baseUrl, `/products/${lamp._id}`, {
      method: 'DELETE',
    }, adminCookie)
    assert.equal(result.response.status, 200)

    console.log('Integration tests passed: auth/roles, product CRUD and image checks, filtering/pagination, checkout/stock rollback, order history/status, and analytics.')
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    }
    if (databaseCreated) {
      await mongoose.connection.dropDatabase()
    }
    for (const imagePath of uploadedImages) {
      await unlink(getUploadPath(imagePath.replace('/uploads/', ''))).catch((error) => {
        if (error.code !== 'ENOENT') console.error('Could not clean up an integration-test image:', error)
      })
    }
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
