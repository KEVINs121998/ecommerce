import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice.js'
import { useAuth } from '../hooks/useAuth.js'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((total, item) => total + item.quantity, 0),
  )
  const [error, setError] = useState('')

  async function handleLogout() {
    setError('')
    try {
      await dispatch(logout()).unwrap()
      navigate('/')
    } catch (logoutError) {
      setError(logoutError)
    }
  }

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`

  return (
    <header className="bg-white border-bottom">
      <nav className="container navbar navbar-expand-lg py-3" aria-label="Main navigation">
        <Link className="navbar-brand fw-bold text-primary me-4" to="/">Mini Shop</Link>
        <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          <NavLink className={linkClass} to="/">Shop</NavLink>
          <NavLink className={linkClass} to="/cart">
            Cart <span className="badge text-bg-primary ms-1">{cartCount}</span>
          </NavLink>
          {user && <NavLink className={linkClass} to="/orders">My orders</NavLink>}
          {isAdmin && <NavLink className={linkClass} to="/admin">Admin</NavLink>}
          <div className="ms-lg-auto d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="small text-body-secondary">Hi, {user.name}</span>
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink className="btn btn-outline-primary btn-sm" to="/login">Log in</NavLink>
                <NavLink className="btn btn-primary btn-sm" to="/register">Register</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
      {error && <div className="container pb-2"><div className="alert alert-danger mb-0">{error}</div></div>}
    </header>
  )
}

export default Navbar
