import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/context/AuthContext";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { RoleResponse, ServiceResponse } from "@/shared/types";
import { CreateRoleModal } from "@/features/admin/CreateRoleModal";
import { EditRoleModal } from "@/features/admin/EditRoleModal";

export function RoleCatalogPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<ServiceResponse | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loadingService, setLoadingService] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadService = useCallback(async () => {
    if (!serviceId) return;
    setLoadingService(true);
    setError(null);
    const res = await fetchWithAuth(
      identityUrl(endpoints.services.selected(serviceId)),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setService(data);
    } else {
      setError(data?.detail ?? "Failed to load service");
    }
    setLoadingService(false);
  }, [serviceId, token]);

  const loadRoles = useCallback(async () => {
    if (!serviceId) return;
    setLoadingRoles(true);
    setError(null);
    const res = await fetchWithAuth(
      identityUrl(endpoints.roles.list(serviceId)),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    if (res.ok) {
      setRoles(Array.isArray(data) ? data : []);
    } else {
      setError(data.detail ?? "Failed to load roles");
      setRoles([]);
    }
    setLoadingRoles(false);
  }, [serviceId, token]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleCreateSuccess = () => {
    loadRoles();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    loadRoles();
    setEditOpen(false);
    setEditRole(null);
  };

  const handleEdit = (role: RoleResponse) => {
    setEditRole(role);
    setEditOpen(true);
  };

  const handleDelete = async (roleId: string) => {
    const confirmed = window.confirm(
      "Remove this role? This action cannot be undone.",
    );
    if (!confirmed) return;

    const res = await fetchWithAuth(
      identityUrl(endpoints.roles.delete(roleId)),
      { method: "DELETE" },
      token,
    );

    if (res.ok) {
      loadRoles();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to delete role");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/admin/sites")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sites
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {loadingService ? "Loading…" : `Roles — ${service?.name ?? "Unknown site"}`}
          </h1>
          <p className="text-sm text-slate-500">Manage roles for this site.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Add role
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

      {loadingRoles ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading roles…
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No roles found for this site.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Description</th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roles.map((role) => (
                <tr key={role.id ?? role.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{role.name}</td>
                  <td className="px-4 py-3 text-slate-700">{role.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/sites/${serviceId}/roles/${role.id}/permissions`,
                          )
                        }
                        disabled={!role.id}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Edit Permissions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(role)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => role.id && handleDelete(role.id)}
                        disabled={!role.id}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateRoleModal
        open={createOpen}
        serviceId={serviceId ?? null}
        serviceName={service?.name ?? null}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditRoleModal
        open={editOpen}
        role={editRole}
        serviceName={service?.name ?? null}
        onClose={() => {
          setEditOpen(false);
          setEditRole(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
