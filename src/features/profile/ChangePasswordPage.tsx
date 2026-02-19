import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/AuthContext'
import { fetchWithAuth, identityUrl } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ChangePasswordRequest } from '@/shared/types'

export function ChangePasswordPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (form.new_password !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.auth.changePassword),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
        token,
      )

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setSuccess(true)
        setForm({ current_password: '', new_password: '' })
        setConfirmPassword('')
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        setError(data.detail ?? 'Failed to change password')
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
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Change Password</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              type="password"
              required
              maxLength={100}
              value={form.current_password}
              onChange={(e) =>
                setForm((f) => ({ ...f, current_password: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={100}
              value={form.new_password}
              onChange={(e) =>
                setForm((f) => ({ ...f, new_password: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={100}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Password changed successfully! Redirecting...
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
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
