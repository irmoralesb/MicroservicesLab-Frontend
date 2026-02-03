import type { UserProfileResponse } from '@/shared/types'

interface UserListProps {
  users: UserProfileResponse[]
  loading?: boolean
  onActivate: (userId: string) => void
  onDeactivate: (userId: string) => void
  onUnlock: (userId: string) => void
  onEdit: (user: UserProfileResponse) => void
  onDelete: (userId: string) => void
}

export function UserList({
  users,
  loading = false,
  onActivate,
  onDeactivate,
  onUnlock,
  onEdit,
  onDelete,
}: UserListProps) {
  if (loading) {
    return (
      <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading users…
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
        No users found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-700">Name</th>
            <th className="px-4 py-3 font-medium text-slate-700">Email</th>
            <th className="px-4 py-3 font-medium text-slate-700">Active</th>
            <th className="px-4 py-3 font-medium text-slate-700">Verified</th>
            <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((user) => (
            <tr key={user.id ?? user.email} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">
                {[user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')}
              </td>
              <td className="px-4 py-3 text-slate-700">{user.email}</td>
              <td className="px-4 py-3">{user.is_active ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">{user.is_verified ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {!user.is_active ? (
                    <button
                      type="button"
                      onClick={() => user.id && onActivate(user.id)}
                      disabled={!user.id}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => user.id && onDeactivate(user.id)}
                      disabled={!user.id}
                      className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => user.id && onUnlock(user.id)}
                    disabled={!user.id}
                    className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => user.id && onDelete(user.id)}
                    disabled={!user.id}
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
