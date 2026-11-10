# Mini MERN E-Commerce

A deliberately small but complete MERN learning project. It uses MongoDB,
Express, React, and Node.js to demonstrate product search and pagination,
cookie-based authentication, image uploads, a Redux cart, checkout, and basic
admin sales reporting. It does not process payments.

## Requirements and local setup

- Node.js 20.19+ or 22.12+
- npm
- MongoDB Community Server running locally

Install dependencies from the project root:

```powershell
npm install
```

Create `server/.env` from the template, then replace the example JWT secret
with a random secret of at least 32 characters:

```powershell
Copy-Item server\.env.example server\.env
```

`server/.env` is ignored by Git. The app expects the local database URI in the
template. Start the API and frontend in separate terminals:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open `http://localhost:5173`. The API listens at `http://localhost:5000`; its
`GET /api/health` endpoint returns HTTP 200 only when MongoDB is connected.
The API waits for MongoDB before listening.

To create or promote an administrator, set `ADMIN_NAME`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD` in `server/.env` and run:

```powershell
npm run seed:admin
```

Public registration always creates a customer; it never accepts a role from
the browser.

To quickly add a sample catalog with product-matched images, run this from the
project root:

```powershell
npm run seed:products
```

The script adds 100 sample products to the configured MongoDB database. It
leaves matching products unchanged, so it is safe to run again. Product images
are loaded from Unsplash and require an internet connection to display.

## Project map and request flow

```text
client/
  src/
    components/       Shared Bootstrap UI and route guards
    features/auth/    Authentication Redux slice and async thunks
    features/cart/    Cart Redux slice
    hooks/            useAuth and useDebounce
    pages/            Customer and admin route-level screens
    services/api.js   Axios client and image URL helper
    store/            Redux store
server/
  src/
    app.js             Express middleware, static uploads, and route mounting
    server.js          Environment loading, database connection, startup/shutdown
    config/            MongoDB and upload-folder configuration
    controllers/       HTTP request/response handling
    middleware/        Authentication, authorization, validation, Multer
    models/            User, Product, and Order Mongoose schemas
    routes/            REST endpoint definitions
    services/          Database queries and business operations
  uploads/             Local development product images
```

Typical request flow:

```text
React page → Axios → Express route → auth/validation middleware
→ controller → service → Mongoose model → MongoDB
```

For example, checkout sends product IDs and quantities to `POST /api/orders`.
The route requires a logged-in customer, the controller validates the cart
shape, the order service reserves stock and computes prices from MongoDB, and
the Order model stores a price/name snapshot.

## API overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer and log in |
| POST | `/api/auth/login` | Public | Log in |
| POST | `/api/auth/logout` | Public | Clear the auth cookie |
| GET | `/api/auth/me` | Customer/admin | Return the current user |
| GET | `/api/cart` | Customer/admin | Read the current user’s cart |
| PUT | `/api/cart` | Customer/admin | Replace the current user’s cart |
| POST | `/api/cart/merge` | Customer/admin | Merge a guest cart into the current user’s cart |
| GET | `/api/products` | Public | Search, filter, sort, paginate |
| GET | `/api/products/categories` | Public | List categories in use |
| GET | `/api/products/:id` | Public | Read one product |
| POST | `/api/products` | Admin | Create a product with an image |
| PUT | `/api/products/:id` | Admin | Update product fields and optionally its image |
| DELETE | `/api/products/:id` | Admin | Delete a product and its image |
| POST | `/api/orders` | Customer/admin | Place an order from the saved cart |
| GET | `/api/orders/mine` | Customer/admin | Read the current user’s orders |
| GET | `/api/orders` | Admin | Read all orders |
| PATCH | `/api/orders/:id/status` | Admin | Set Pending, Shipped, or Delivered |
| GET | `/api/admin/stats` | Admin | Read store and sales statistics |

Product-list example:

```text
GET /api/products?page=1&limit=8&search=phone&category=Electronics
  &minPrice=20&maxPrice=200&sort=price_asc
```

Response shape:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 40,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

`limit` defaults to 8 and is capped at 50. Supported sorts are `newest`,
`price_asc`, `price_desc`, and `name_asc`. Search is escaped before it is used
in a case-insensitive regular expression.

## MongoDB models and relationships

- **User** stores name, unique normalized email, bcrypt-hashed password, and
  `customer`/`admin` role. Passwords are excluded from normal queries and JSON.
- **Cart** stores product references and quantities for one user. Signed-in
  carts are saved in MongoDB; anonymous carts stay in browser storage and merge
  into the account cart on sign-in.
- **Product** stores name, description, price, category, stock, and an image
  path such as `/uploads/<generated-name>.png`.
- **Order** references its user and stores product references alongside
  purchase-time name, image, price, and quantity snapshots.

The order’s product array is embedded because it is a small, bounded list for
one checkout and preserves what was purchased if a product is later edited or
deleted. It still stores a Product ObjectId for analytics. `populate()` is used
to show a customer’s name/email on admin order screens. `$lookup` is used by
the analytics pipeline to join a product’s current details. Neither approach
copies the complete user or product document into every order.

Indexes:

- `User.email`: unique index, preventing duplicate accounts.
- `Product.category + price`: supports category and price filtering.
- `Product.name` and `Product.createdAt`: support unfiltered name and newest
  sorts. `$sort` is placed before `$facet` so MongoDB can use a compatible
  index; some combined search/filter/sort shapes may still require an in-memory
  sort.
- `Order.user + createdAt`: supports a customer’s newest-first order history.
- MongoDB automatically indexes `_id`, which is used by product lookups.
  The all-time dashboard aggregation reads the orders collection; a date
  filter could use an Order `createdAt` index if added later.

The name search uses a case-insensitive contains-style regular expression;
that search can scan products rather than use a normal B-tree name index.
That is acceptable for this small teaching catalog. A larger catalog should
use a normalized search field, MongoDB text search, or Atlas Search.

## Aggregation pipelines used by real features

### Product filtering, sorting, and server-side pagination

Sample input documents:

```json
[
  { "_id": "p1", "name": "Phone", "category": "Electronics", "price": 100 },
  { "_id": "p2", "name": "Phone Case", "category": "Accessories", "price": 20 },
  { "_id": "p3", "name": "Phone Mini", "category": "Electronics", "price": 80 }
]
```

For `search=phone`, `category=Electronics`, `sort=price_asc`, `page=1`,
`limit=1`, the service runs:

```js
[
  { $match: { name: /phone/i, category: 'Electronics' } },
  { $sort: { price: 1, _id: 1 } },
  {
    $facet: {
      data: [
        { $skip: 0 },
        { $limit: 1 }
      ],
      metadata: [{ $count: 'totalItems' }]
    }
  }
]
```

Execution order matters: `$match` reduces the candidate set first, then
`$sort` orders it with `_id` as a stable tie-breaker. `$facet` runs two
branches over that filtered, ordered set. The `data` branch skips and limits;
the `metadata` branch counts all filtered matches, not just the current page.
For these sample inputs, the service returns Phone Mini and a total of two
items. `$skip` is `(page - 1) * limit`; `$limit` bounds the response and memory
sent to the browser. The service derives `totalPages`, `hasNextPage`, and
`hasPreviousPage` from the total.

This is server-side pagination: MongoDB filters and sorts the full result set
and sends only one page. Client-side pagination downloads every product first
and is simpler for tiny static lists, but wastes bandwidth and memory as the
catalog grows.

### Admin totals, monthly sales, and best sellers

An Order stores purchase-time line items like:

```json
{
  "createdAt": "2026-11-09T08:00:00.000Z",
  "totalAmount": 49,
  "products": [
    { "product": "p1", "name": "Desk Lamp", "price": 24.5, "quantity": 2 }
  ]
}
```

The dashboard combines product count with an Order aggregation using `$facet`:

```js
[
  {
    $facet: {
      totals: [
        { $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        } }
      ],
      salesByMonth: [
        { $unwind: '$products' },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
          unitsSold: { $sum: '$products.quantity' }
        } },
        { $sort: { _id: 1 } }
      ],
      bestSellingProducts: [
        { $unwind: '$products' },
        { $group: {
          _id: '$products.product',
          name: { $first: '$products.name' },
          unitsSold: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
        } },
        { $sort: { unitsSold: -1, _id: 1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'currentProduct'
        } },
        { $unwind: { path: '$currentProduct', preserveNullAndEmptyArrays: true } },
        { $project: {
          _id: 0,
          productId: '$_id',
          name: { $ifNull: ['$currentProduct.name', '$name'] },
          unitsSold: 1,
          revenue: 1
        } }
      ]
    }
  }
]
```

`$facet` sends the same order collection through independent report branches.
The `totals` `$group` counts orders and sums order totals. `$unwind` turns each
embedded order line into an individual record. `$group` calculates month or
product totals; `$dateToString` creates a year-month key; `$sort` orders months
and ranks best sellers; `$limit` keeps the top five. `$lookup` joins the
current Product document by ObjectId and `$unwind` unwraps its one-item result.
`preserveNullAndEmptyArrays` keeps historical sales if a product was deleted.
`$project` shapes the API output. Total revenue includes every placed order;
monthly and per-product revenue use the saved purchase price and quantity.

For the sample order above, the branches contribute:

```json
{
  "totalOrders": 1,
  "totalRevenue": 49,
  "salesByMonth": [{ "_id": "2026-11", "revenue": 49, "unitsSold": 2 }],
  "bestSellingProducts": [{
    "productId": "p1",
    "name": "Desk Lamp",
    "unitsSold": 2,
    "revenue": 49
  }]
}
```

The category dropdown uses a smaller real aggregation:
`$group: { _id: '$category' }` followed by `$sort: { _id: 1 }`. It returns
distinct categories from existing products without adding a separate Category
collection.

## File upload and authentication

Product forms submit `FormData` as `multipart/form-data`. Multer parses that
request and places the uploaded image in `server/uploads/`. The backend accepts
JPEG, PNG, and WEBP, checks the MIME type and file signature, limits files to
5 MB, and assigns a generated filename. Express serves those files from
`/uploads`; MongoDB stores only the generated path.

JSON represents structured text data and is convenient for ordinary API
requests. `FormData` can send both text fields and binary files in one request.
When using Axios, pass `FormData` directly so it can set the multipart boundary.
Multer exposes the file metadata as `req.file` and the text fields as
`req.body`. Keeping a path rather than binary image data in the product keeps
documents smaller and allows static file serving. Local disk is for
development; object storage such as S3 can be used in a production deployment.

Registration hashes passwords with bcryptjs. Login returns a JWT in an
HTTP-only, same-site cookie; browser JavaScript cannot read that cookie. Axios
uses `withCredentials`, CORS allows the configured client origin, and
`requireAuth`/`requireAdmin` protect routes. A separate seed command creates an
administrator; public users cannot choose their role.

## React hooks and Redux Toolkit

- `useState` keeps form values, errors, request status, filters, and modal-like
  UI state local to the page that owns it.
- `useEffect` loads data from the API and cancels stale fetches with
  `AbortController` on unmount or changed dependencies.
- `useMemo` calculates the cart subtotal, a derived value reused during render.
- `useCallback` keeps add/remove/quantity handlers stable when passed to
  memoized children.
- `useRef` focuses the product-search input and stores the debounce timer;
  updating a ref does not itself render the component again.
- `React.memo(ProductCard)` can skip a card render when its product and callback
  props are unchanged. It does not help if props are recreated every render or
  if the card itself must update.
- `useDebounce` is a custom hook that delays search requests and cleans up its
  timer when the query changes or the component unmounts.
- `useAuth` is a custom hook over the Redux auth state.

Redux Toolkit holds only cross-page auth and cart state. Form values and
temporary loading flags remain local. `createAsyncThunk` models pending,
fulfilled, and rejected API calls; slices use Immer so reducer code can update
draft state with familiar assignment syntax while Redux still produces
immutable state. Redux DevTools shows dispatched actions and state changes.
Context can be enough for a small app, but Redux is useful here to demonstrate
shared cart/auth state and inspectable async flows.

## Learning phases in this implementation

1. **Setup:** npm workspaces split the Vite client and Express server.
2. **Server and database:** `server.js` loads config, awaits MongoDB, and then
   listens; `/api/health` reports database readiness.
3. **Models:** User, Product, and Order schemas validate data and define
   references and indexes.
4. **Authentication:** registration, login/logout, cookie JWT, and role guards.
5. **Product CRUD:** public product read endpoints and admin create/update/delete.
6. **Multer:** validated local image uploads and static serving.
7. **Aggregation and pagination:** `$match`, `$facet`, `$sort`, `$skip`,
   `$limit`, `$count`, `$group`, `$unwind`, and `$lookup` support actual store
   and dashboard features.
8. **React UI:** Bootstrap pages, route layouts, API services, and protected
   routes.
9. **Hooks:** fetch lifecycles, debounce, subtotal calculation, stable
   callbacks, search focus, and memoized product cards.
10. **Redux Toolkit:** async auth state and shared, locally persisted cart.
11. **Orders:** checkout derives trusted prices from the database, reserves
    stock, stores purchase snapshots, and exposes customer history.
12. **Admin:** product/order management and aggregation-based sales cards.
13. **Testing:** unit/API tests plus a guarded local MongoDB integration run.

## Tests and verification

```powershell
npm test
npm run test:integration
npm run build
npm run lint
npm audit
```

`npm run test:integration` requires the local MongoDB in `server/.env`. It uses
a uniquely named temporary database and deletes only that database afterward;
it refuses non-local MongoDB hosts. The suite covers auth, role checks, product
upload/search/pagination, checkout/stock, order history/status, and dashboard
analytics. `npm test` needs no MongoDB service.

## Important learning trade-offs

- The order service uses conditional stock decrements and rolls back reservations
  if an order fails. This works with a local standalone MongoDB for a learning
  project, but a production checkout should use a replica-set transaction and
  a defined idempotency strategy.
- Prices use JavaScript numbers to keep the example readable. A real store
  should store integer minor units or use a precise decimal type.
- The cart is persisted in browser local storage for convenience. It is not
  trusted: the server reloads product prices and stock before creating an order.
- There is no payment provider, coupon system, delivery tracking, or complex
  inventory system, by design.
- The admin screen uses a simple table and monthly rows rather than a charting
  library so the aggregation output remains easy to inspect.
"# ecommerce" 
