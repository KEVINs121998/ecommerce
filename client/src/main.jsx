import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App, { NotFoundPage } from './App.jsx'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminOrdersPage from './pages/AdminOrdersPage.jsx'
import AdminProductFormPage from './pages/AdminProductFormPage.jsx'
import AdminProductsPage from './pages/AdminProductsPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import CartPage from './pages/CartPage.jsx'
import HomePage from './pages/HomePage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import { store } from './store/store.js'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products/:id', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'login', element: <AuthPage mode="login" /> },
      { path: 'register', element: <AuthPage mode="register" /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'orders', element: <OrdersPage /> }],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', element: <AdminDashboardPage /> },
          { path: 'admin/products', element: <AdminProductsPage /> },
          { path: 'admin/products/new', element: <AdminProductFormPage /> },
          { path: 'admin/products/:id/edit', element: <AdminProductFormPage /> },
          { path: 'admin/orders', element: <AdminOrdersPage /> },
        ],
      },
      { path: 'not-found', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/not-found" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
