import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import AlertMessage from '../components/AlertMessage.jsx'
import { clearAuthError, login, register } from '../features/auth/authSlice.js'
import { useAuth } from '../hooks/useAuth.js'

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { error, isLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    dispatch(clearAuthError())
    try {
      await dispatch(isRegister ? register({ name, email, password }) : login({ email, password })).unwrap()
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch {
      // The rejected thunk stores a message for the form to display.
    }
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-7 col-lg-5">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 mb-4">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
              <AlertMessage>{error}</AlertMessage>
              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="name">Name</label>
                    <input className="form-control" id="name" autoComplete="name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input className="form-control" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input className="form-control" id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <button className="btn btn-primary w-100" disabled={isLoading}>
                  {isLoading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
                </button>
              </form>
              <p className="text-center text-body-secondary mt-4 mb-0">
                {isRegister ? 'Already have an account? ' : 'New here? '}
                <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default AuthPage
