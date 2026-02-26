import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'

export function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout(); 
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold text-slate-800">Home</h1>
      <p className="mb-6 text-slate-600">
        Welcome{user?.email ? `, ${user.email}` : ''}. You are signed in.
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="text-slate-700 underline hover:text-slate-900"
      >
        Logout
      </button>
    </div>
  )
}
