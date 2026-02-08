import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
      const error_detail = Array.isArray(data.detail) ? data.detail.map((d: any) => d.msg).join(', ') : data.detail;
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

  const handleUnlock = async (userId: string) => {
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/services"
          className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow hover:border-slate-300"
        >
          <div className="text-base font-semibold text-slate-800">
            Service catalog
          </div>
          <div className="text-slate-500">
            Add, edit, and remove registered microservices.
          </div>
        </Link>
        <Link
          to="/admin/roles"
          className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow hover:border-slate-300"
        >
          <div className="text-base font-semibold text-slate-800">
            Role catalog
          </div>
          <div className="text-slate-500">
            Manage roles for each service.
          </div>
        </Link>
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
