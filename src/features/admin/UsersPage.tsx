import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/context/AuthContext";
import { CreateUserModal } from "@/features/admin/CreateUserModal";
import { EditUserModal } from "@/features/admin/EditUserModal";
import type { UserProfileResponse } from "@/shared/types";
import { identityUrl, fetchWithAuth } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export function UsersPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfileResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.all),
      { method: "GET" },
      token,
    );
    const data = await res.json();
    if (res.ok) {
      setUsers(data);
    } else {
      const error_detail = Array.isArray(data.detail)
        ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
        : data.detail;
      setError(error_detail ?? "Failed to load users");
      setUsers([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateSuccess = () => {
    loadUsers();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    loadUsers();
    setEditOpen(false);
    setEditUser(null);
  };

  const handleActivate = async (userId: string) => {
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.activate(userId)),
      { method: "PUT" },
      token,
    );
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to activate user");
    }
  };

  const handleDeactivate = async (userId: string) => {
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.deactivate(userId)),
      { method: "PUT" },
      token,
    );
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to deactivate user");
    }
  };

  const handleUnlock = async (_userId: string) => {
    const res = await fetchWithAuth(
      identityUrl(endpoints.auth.unlockAccount),
      { method: "POST" },
      token,
    );
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to unlock account");
    }
  };

  const handleEdit = (user: UserProfileResponse) => {
    setEditUser(user);
    setEditOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm(
      "Delete this user? This action cannot be undone.",
    );
    if (!confirmed) return;
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.delete(userId)),
      { method: "DELETE" },
      token,
    );
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to delete account");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            User management
          </h1>
          <p className="text-sm text-slate-500">
            Create and manage users. Assign sites and roles per user.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Create user
        </button>
      </div>

      {error && (
        <div
          className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No users found.
        </div>
      ) : (
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
                    {[user.first_name, user.middle_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">{user.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    {user.is_verified ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => user.id && navigate(`/admin/users/${user.id}/services`)}
                        disabled={!user.id}
                        className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        Services
                      </button>
                      {!user.is_active ? (
                        <button
                          type="button"
                          onClick={() => user.id && handleActivate(user.id)}
                          disabled={!user.id}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => user.id && handleDeactivate(user.id)}
                          disabled={!user.id}
                          className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => user.id && handleUnlock(user.id)}
                        disabled={!user.id}
                        className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        Unlock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => user.id && handleDelete(user.id)}
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
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditUserModal
        open={editOpen}
        user={editUser}
        onClose={() => {
          setEditOpen(false);
          setEditUser(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
