import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/context/AuthContext";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  PermissionForRole,
  RoleResponse,
} from "@/shared/types";
import { CreatePermissionModal } from "@/features/admin/CreatePermissionModal";
import { EditPermissionModal } from "@/features/admin/EditPermissionModal";

export function RolePermissionsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { serviceId, roleId } = useParams<{ serviceId: string; roleId: string }>();

  const [role, setRole] = useState<RoleResponse | null>(null);
  const [permissions, setPermissions] = useState<PermissionForRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<PermissionForRole | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);

  const loadRole = useCallback(async () => {
    if (!roleId || !serviceId) return;
    
    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.roles.list(serviceId)),
        { method: "GET" },
        token,
      );
      const data = await res.json().catch(() => []);
      if (res.ok) {
        const roles = Array.isArray(data) ? data : [];
        const foundRole = roles.find((r) => r.id === roleId);
        setRole(foundRole ?? null);
      }
    } catch (err) {
      console.error("Failed to load role:", err);
    }
  }, [roleId, serviceId, token]);

  const loadPermissions = useCallback(async () => {
    if (!roleId || !serviceId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.permissions.forRole(roleId, serviceId)),
        { method: "GET" },
        token,
      );
      const data = await res.json().catch(() => []);
      if (res.ok) {
        setPermissions(Array.isArray(data) ? data : []);
      } else {
        setError(data.detail ?? "Failed to load permissions");
        setPermissions([]);
      }
    } catch (err) {
      setError("Failed to load permissions");
      setPermissions([]);
    }
    setLoading(false);
  }, [roleId, serviceId, token]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleToggleAssignment = async (
    permission: PermissionForRole,
    isAssigned: boolean,
  ) => {
    if (!roleId) return;

    const endpoint = isAssigned
      ? endpoints.permissions.assign(roleId, permission.id)
      : endpoints.permissions.unassign(roleId, permission.id);

    const method = isAssigned ? "POST" : "DELETE";

    const res = await fetchWithAuth(identityUrl(endpoint), { method }, token);

    if (res.ok) {
      loadPermissions();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? `Failed to ${isAssigned ? "assign" : "unassign"} permission`);
    }
  };

  const handleCreateSuccess = () => {
    loadPermissions();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    loadPermissions();
    setEditOpen(false);
    setEditPermission(null);
  };

  const handleEdit = (permission: PermissionForRole) => {
    setEditPermission(permission);
    setEditOpen(true);
  };

  const handleDelete = async (permissionId: string) => {
    const confirmed = window.confirm(
      "Delete this permission? This action cannot be undone. It will fail if the permission is still assigned to any role.",
    );
    if (!confirmed) return;

    const res = await fetchWithAuth(
      identityUrl(endpoints.permissions.delete(permissionId)),
      { method: "DELETE" },
      token,
    );

    if (res.ok) {
      loadPermissions();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(
        data.detail ?? "Failed to delete permission (may still be assigned to other roles)",
      );
    }
  };

  if (!roleId || !serviceId) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          Invalid role or service ID
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/admin/sites/${serviceId}/roles`)}
            className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Roles
          </button>
          <h1 className="text-2xl font-semibold text-slate-800">
            Manage Permissions: {role?.name ?? "Loading..."}
          </h1>
          <p className="text-sm text-slate-500">
            {role?.description ?? ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Create Permission
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
          Loading permissions...
        </div>
      ) : permissions.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No permissions found for this service.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Assigned</th>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Resource</th>
                <th className="px-4 py-3 font-medium text-slate-700">Action</th>
                <th className="px-4 py-3 font-medium text-slate-700">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={permission.is_assigned}
                      onChange={(e) =>
                        handleToggleAssignment(permission, e.target.checked)
                      }
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-900">{permission.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {permission.resource}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {permission.action}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {permission.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(permission)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(permission.id)}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
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

      {serviceId && (
        <CreatePermissionModal
          open={createOpen}
          serviceId={serviceId}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {editPermission && (
        <EditPermissionModal
          open={editOpen}
          permission={editPermission}
          onClose={() => {
            setEditOpen(false);
            setEditPermission(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
