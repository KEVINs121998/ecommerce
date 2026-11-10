import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../src/app.js'

let server
let baseUrl

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
})

test('health endpoint reports the disconnected database state', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    success: false,
    service: 'api',
    database: 'disconnected',
  })
})

test('authentication middleware rejects requests without a cookie', async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`)
  assert.equal(response.status, 401)
  assert.equal((await response.json()).success, false)
})

test('cart routes require authentication', async () => {
  const response = await fetch(`${baseUrl}/api/cart`)
  assert.equal(response.status, 401)
  assert.equal((await response.json()).success, false)
})

test('registration validates input before attempting a database write', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'not-an-email', password: 'short' }),
  })
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /Name must be/)
})

test('login validates an empty request body', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' })
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /Email and password/)
})

test('product listing validates pagination before querying the database', async () => {
  const response = await fetch(`${baseUrl}/api/products?page=zero&limit=100`)
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /Page and limit/)
})

test('product listing validates the price range before querying the database', async () => {
  const response = await fetch(`${baseUrl}/api/products?minPrice=20&maxPrice=10`)
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /price range/)
})

test('product routes reject malformed object IDs', async () => {
  const response = await fetch(`${baseUrl}/api/products/not-an-id`)
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /valid resource ID/)
})

test('unknown API routes return a JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`)
  assert.equal(response.status, 404)
  assert.equal((await response.json()).success, false)
})

test('malformed JSON receives a client error', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email":',
  })
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /invalid JSON/)
})
