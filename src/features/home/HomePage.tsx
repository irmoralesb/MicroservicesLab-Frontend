import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/auth/context/AuthContext'
import { fetchWithAuth, identityUrl } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ServiceResponse } from '@/shared/types'

export function HomePage() {
  const { user, token } = useAuth()
  const [services, setServices] = useState<ServiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUserServices = useCallback(async () => {
    if (!user?.id || !token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.userServices.getForUser(user.id)),
        { method: 'GET' },
        token
      )
      const data = await res.json().catch(() => [])
      if (res.ok) {
        setServices(Array.isArray(data) ? data : [])
      } else {
        setError(data.detail ?? 'Failed to load services')
        setServices([])
      }
    } catch {
      setError('Failed to load services')
      setServices([])
    }
    setLoading(false)
  }, [user?.id, token])

  useEffect(() => {
    loadUserServices()
  }, [loadUserServices])

  const handleServiceClick = (service: ServiceResponse) => {
    if (service.url) {
      window.open(service.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-4 text-2xl font-semibold text-slate-800">Home</h1>
      <p className="mb-6 text-slate-600">
        Welcome{user?.email ? `, ${user.email}` : ''}. You are signed in.
      </p>

      {error && (
        <div
          className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Your Services</h2>
        {loading ? (
          <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
            No services assigned to you yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <button
                key={service.id ?? service.name}
                type="button"
                onClick={() => handleServiceClick(service)}
                disabled={!service.url || !service.is_active}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-6 text-left shadow transition-all hover:border-slate-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900">
                    {service.name}
                  </h3>
                  {!service.is_active && (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      Inactive
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="mb-4 flex-1 text-sm text-slate-600">
                    {service.description}
                  </p>
                )}
                {service.url ? (
                  <div className="mt-auto text-sm text-slate-500">
                    <span className="group-hover:text-slate-700">Browse →</span>
                  </div>
                ) : (
                  <div className="mt-auto text-sm text-slate-400">
                    No URL configured
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
