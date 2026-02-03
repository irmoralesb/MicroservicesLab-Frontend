import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token } = useAuth()
  const location = useLocation()

  if(!token){
    return <Navigate to="/login" state={{from:location}} replace />
  }
  
  return <>{children}</>
}
