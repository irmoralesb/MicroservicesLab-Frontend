import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context/AuthContext";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { RoleResponse, ServiceResponse } from "@/shared/types";
import { CreateRoleModal } from "@/features/admin/CreateRoleModal";
import { EditRoleModal } from "@/features/admin/EditRoleModal";

export function RoleCatalogPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    setError(null);
    const res = await fetchWithAuth(
      identityUrl(endpoints.services.all),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    if (res.ok) {
      const nextServices = Array.isArray(data) ? data : [];
      setServices(nextServices);
      if (!selectedServiceId && nextServices.length > 0) {
        setSelectedServiceId(nextServices[0]?.id ?? null);
      }
    } else {
      setError(data.detail ?? "Failed to load services");
      setServices([]);
    }
    setLoadingServices(false);
  }, [selectedServiceId, token]);

  const loadRoles = useCallback(
    async (serviceId: string) => {
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
    },
    [token],
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (selectedServiceId) {
      loadRoles(selectedServiceId);
    } else {
      setRoles([]);
    }
  }, [selectedServiceId, loadRoles]);

  const handleCreateSuccess = () => {
    if (selectedServiceId) {
      loadRoles(selectedServiceId);
    }
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    if (selectedServiceId) {
      loadRoles(selectedServiceId);
    }
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
      if (selectedServiceId) {
        loadRoles(selectedServiceId);
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to delete role");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Role catalog</h1>
          <p className="text-sm text-slate-500">
            Assign roles per service to manage access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!selectedServiceId}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-slate-700">
          Service
        </label>
        <select
          value={selectedServiceId ?? ""}
          onChange={(e) => setSelectedServiceId(e.target.value || null)}
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-slate-900"
        >
          <option value="">Select a service</option>
          {services.map((service) => (
            <option key={service.id ?? service.name} value={service.id ?? ""}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      {loadingServices ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading services...
        </div>
      ) : !selectedServiceId ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Select a service to view its roles.
        </div>
      ) : loadingRoles ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading roles...
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No roles found for {selectedService?.name ?? "this service"}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roles.map((role) => (
                <tr key={role.id ?? role.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{role.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {role.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
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
        serviceId={selectedServiceId}
        serviceName={selectedService?.name ?? null}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditRoleModal
        open={editOpen}
        role={editRole}
        serviceName={selectedService?.name ?? null}
        onClose={() => {
          setEditOpen(false);
          setEditRole(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
