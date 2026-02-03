import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth/context/AuthContext";
import { UserList } from "@/features/admin/UserList";
import { CreateUserModal } from "@/features/admin/CreateUserModal";
import { EditUserModal } from "@/features/admin/EditUserModal";
import type { UserProfileResponse } from "@/shared/types";
import { identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { fetchWithAuth } from "@/api/client";

export function AdminPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfileResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.all),
      { method: "GET" },
      token,
    );
    const data = await res.json();
    if (res.ok) {
      setUsers(data);
    } else {
      setError(data.detail ?? "Failed to load users");
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
    // TODO (you implement): PUT /api/v1/profile/{userId}/activate with Bearer token. Then loadUsers().
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

  const handleUnlock = async (userId: string) => {
    // TODO (you implement): POST /api/v1/auth/unlock-account with body { user_id: userId }, Bearer token. Then loadUsers().
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

  const handleDelete = (userId: string) => {
    // TODO (you implement): When backend supports it, DELETE /api/v1/profile/{userId}. Then loadUsers().
    loadUsers();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          User management
        </h1>
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

      <UserList
        users={users}
        loading={loading}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onUnlock={handleUnlock}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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
