import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'

export function Header() {
  const { token, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const adminRef = useRef<HTMLDivElement>(null)

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
                <div className="relative" ref={adminRef}>
                  <button
                    type="button"
                    onClick={() => setAdminOpen((o) => !o)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Administration
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminOpen && (
                    <div
                      className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded border border-slate-600 bg-slate-800 shadow-lg"
                      onMouseLeave={() => setAdminOpen(false)}
                    >
                      <Link
                        to="/admin/sites"
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                        onClick={() => setAdminOpen(false)}
                      >
                        Sites
                      </Link>
                      <Link
                        to="/admin/users"
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                        onClick={() => setAdminOpen(false)}
                      >
                        Users
                      </Link>
                    </div>
                  )}
                </div>
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
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Administration
                    </div>
                    <Link
                      to="/admin/sites"
                      className="rounded px-3 py-2 pl-6 text-slate-200 hover:bg-slate-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sites
                    </Link>
                    <Link
                      to="/admin/users"
                      className="rounded px-3 py-2 pl-6 text-slate-200 hover:bg-slate-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Users
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
