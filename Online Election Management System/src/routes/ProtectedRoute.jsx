import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/ui/LoadingScreen'

export const ProtectedRoute = ({ children, roles }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && profile && !roles.includes(profile.role)) {
    const redirect = {
      admin:            '/admin',
      election_creator: '/creator',
      voter:            '/voter',
    }
    return <Navigate to={redirect[profile.role] || '/'} replace />
  }

  return children
}

export const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user && profile) {
    const redirect = {
      admin:            '/admin',
      election_creator: '/creator',
      voter:            '/voter',
    }
    return <Navigate to={redirect[profile.role] || '/'} replace />
  }
  return children
}
