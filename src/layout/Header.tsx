import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'

export function Header() {
  const { token, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-slate-800 text-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold">
          MicroservicesLab
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {token && (
            <>
              <Link
                to="/"
                className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Home
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Admin users
                  </Link>
                  <Link
                    to="/admin/services"
                    className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Services
                  </Link>
                  <Link
                    to="/admin/roles"
                    className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Roles
                  </Link>
                </>
              )}
              {/* Placeholder for future microservices */}
              <span className="rounded px-2 py-1 text-slate-500">More services…</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Logout
              </button>
            </>
          )}
          {!token && (
            <Link
              to="/login"
              className="rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded p-2 text-slate-200 hover:bg-slate-700 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-slate-700 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {token && (
              <>
                <Link
                  to="/"
                  className="rounded px-3 py-2 text-slate-200 hover:bg-slate-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="rounded px-3 py-2 text-slate-200 hover:bg-slate-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin users
                    </Link>
                    <Link
                      to="/admin/services"
                      className="rounded px-3 py-2 text-slate-200 hover:bg-slate-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Services
                    </Link>
                    <Link
                      to="/admin/roles"
                      className="rounded px-3 py-2 text-slate-200 hover:bg-slate-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Roles
                    </Link>
                  </>
                )}
                <span className="rounded px-3 py-2 text-slate-500">More services…</span>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    setMenuOpen(false)
                  }}
                  className="rounded px-3 py-2 text-left text-slate-200 hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            )}
            {!token && (
              <Link
                to="/login"
                className="rounded px-3 py-2 text-slate-200 hover:bg-slate-700"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
