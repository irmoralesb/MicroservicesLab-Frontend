import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/context/AuthContext";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { ServiceResponse } from "@/shared/types";
import { CreateServiceModal } from "@/features/admin/CreateServiceModal";
import { EditServiceModal } from "@/features/admin/EditServiceModal";

export function ServiceCatalogPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchWithAuth(
      identityUrl(endpoints.services.all),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    if (res.ok) {
      setServices(Array.isArray(data) ? data : []);
    } else {
      setError(data.detail ?? "Failed to load services");
      setServices([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleCreateSuccess = () => {
    loadServices();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    loadServices();
    setEditOpen(false);
    setEditService(null);
  };

  const handleEdit = (service: ServiceResponse) => {
    setEditService(service);
    setEditOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Remove this service? This action cannot be undone.",
    );
    if (!confirmed) return;

    const res = await fetchWithAuth(
      identityUrl(endpoints.services.delete(serviceId)),
      { method: "DELETE" },
      token,
    );

    if (res.ok) {
      loadServices();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to delete service");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Service catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage registered microservices for role assignments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Add service
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
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No services found.
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
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">URL</th>
                <th className="px-4 py-3 font-medium text-slate-700">Port</th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {services.map((service) => (
                <tr key={service.id ?? service.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{service.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {service.description ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {service.is_active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {service.url ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {service.port ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => service.id && handleDelete(service.id)}
                        disabled={!service.id}
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

      <CreateServiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditServiceModal
        open={editOpen}
        service={editService}
        onClose={() => {
          setEditOpen(false);
          setEditService(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
