import { useSelector } from 'react-redux'

export function useAuth() {
  const { user, status, error, requestStatus } = useSelector((state) => state.auth)
  return {
    user,
    status,
    error,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isLoading: requestStatus === 'loading',
  }
}
