import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'
import { fetchWithAuth, identityUrl } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { UpdateProfileRequest, UserProfileResponse } from '@/shared/types'

const MAX_NAME_LENGTH = 50
const MAX_EMAIL_LENGTH = 100

export function UpdateProfilePage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<UpdateProfileRequest>({
    first_name: '',
    middle_name: null,
    last_name: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetchWithAuth(
          identityUrl(endpoints.profile.me),
          { method: 'GET' },
          token,
        )

        const data = await res.json().catch(() => ({}))

        if (res.ok) {
          const profile = data as UserProfileResponse
          setForm({
            first_name: profile.first_name,
            middle_name: profile.middle_name ?? null,
            last_name: profile.last_name,
            email: profile.email,
          })
        } else {
          setError(data.detail ?? 'Failed to load profile')
        }
      } catch {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [user?.id, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.profile.selected(user.id)),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
        token,
      )

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        setError(data.detail ?? 'Failed to update profile')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Update Profile</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Middle name
            </label>
            <input
              type="text"
              maxLength={MAX_NAME_LENGTH}
              value={form.middle_name ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, middle_name: e.target.value || null }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              maxLength={MAX_EMAIL_LENGTH}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          {error && (
            <div
              className="rounded bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded bg-green-50 px-3 py-2 text-sm text-green-700"
              role="alert"
            >
              Profile updated successfully! Redirecting...
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
