import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/context/AuthContext";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  RoleResponse,
  ServiceResponse,
  UserProfileResponse,
} from "@/shared/types";

interface ServiceWithRoles {
  service: ServiceResponse;
  assignedRoleIds: Set<string>;
  allRoles: RoleResponse[];
}

export function UserServicesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [allServices, setAllServices] = useState<ServiceResponse[]>([]);
  const [assignedServices, setAssignedServices] = useState<ServiceResponse[]>([]);
  const [serviceRolesMap, setServiceRolesMap] = useState<
    Map<string, ServiceWithRoles>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedNewServiceId, setSelectedNewServiceId] = useState<string>("");
  const [savingRoles, setSavingRoles] = useState(false);
  const [pendingRoleIds, setPendingRoleIds] = useState<Set<string>>(new Set());

  const loadUser = useCallback(async () => {
    if (!userId) return;
    const res = await fetchWithAuth(
      identityUrl(endpoints.profile.selected(userId)),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => null);
    if (res.ok) setUser(data);
  }, [userId, token]);

  const loadAssignedServices = useCallback(async (): Promise<ServiceResponse[]> => {
    if (!userId) return [];
    const res = await fetchWithAuth(
      identityUrl(endpoints.userServices.getForUser(userId)),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    if (res.ok) {
      return Array.isArray(data) ? (data as ServiceResponse[]) : [];
    }
    return [];
  }, [userId, token]);

  const loadAllServices = useCallback(async (): Promise<ServiceResponse[]> => {
    const res = await fetchWithAuth(
      identityUrl(endpoints.services.all),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    if (res.ok) {
      return Array.isArray(data) ? (data as ServiceResponse[]) : [];
    }
    return [];
  }, [token]);

  const loadRolesForService = useCallback(
    async (serviceId: string): Promise<RoleResponse[]> => {
      const res = await fetchWithAuth(
        identityUrl(endpoints.roles.list(serviceId)),
        { method: "GET" },
        token,
      );
      const data = await res.json().catch(() => []);
      return res.ok && Array.isArray(data) ? data : [];
    },
    [token],
  );

  const loadUserRoles = useCallback(async (): Promise<RoleResponse[]> => {
    if (!userId) return [];
    const res = await fetchWithAuth(
      identityUrl(endpoints.roles.userRoles(userId)),
      { method: "GET" },
      token,
    );
    const data = await res.json().catch(() => []);
    return res.ok && Array.isArray(data) ? data : [];
  }, [userId, token]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assigned, all, userRoles] = await Promise.all([
        loadAssignedServices(),
        loadAllServices(),
        loadUserRoles(),
      ]);

      setAllServices(all);
      setAssignedServices(assigned);

      // Build service→roles map
      const newMap = new Map<string, ServiceWithRoles>();
      await Promise.all(
        assigned.map(async (svc) => {
          if (!svc.id) return;
          const allRoles = await loadRolesForService(svc.id);
          const assignedRoleIds = new Set(
            userRoles
              .filter((r) => r.service_id === svc.id)
              .map((r) => r.id)
              .filter((id): id is string => !!id),
          );
          newMap.set(svc.id, { service: svc, assignedRoleIds, allRoles });
        }),
      );
      setServiceRolesMap(newMap);
    } catch {
      setError("Failed to load data");
    }
    setLoading(false);
  }, [loadAssignedServices, loadAllServices, loadRolesForService, loadUserRoles]);

  useEffect(() => {
    loadUser();
    refreshData();
  }, [loadUser, refreshData]);

  const unassignedServices = allServices.filter(
    (s) => s.id && !assignedServices.some((a) => a.id === s.id),
  );

  const handleUnassignService = async (serviceId: string) => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Remove this service and all its assigned roles from the user?",
    );
    if (!confirmed) return;

    const res = await fetchWithAuth(
      identityUrl(endpoints.userServices.unassign(userId, serviceId)),
      { method: "DELETE" },
      token,
    );
    if (res.ok) {
      await refreshData();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to unassign service");
    }
  };

  const handleAssignService = async () => {
    if (!userId || !selectedNewServiceId) return;
    const res = await fetchWithAuth(
      identityUrl(endpoints.userServices.assign),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, service_id: selectedNewServiceId }),
      },
      token,
    );
    if (res.ok) {
      setAssignModalOpen(false);
      setSelectedNewServiceId("");
      await refreshData();
      // auto-open the role editor for the newly assigned service
      setEditingServiceId(selectedNewServiceId);
      const entry = serviceRolesMap.get(selectedNewServiceId);
      setPendingRoleIds(new Set(entry?.assignedRoleIds ?? []));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to assign service");
    }
  };

  const openEditRoles = (serviceId: string) => {
    const entry = serviceRolesMap.get(serviceId);
    setPendingRoleIds(new Set(entry?.assignedRoleIds ?? []));
    setEditingServiceId(serviceId);
  };

  const togglePendingRole = (roleId: string) => {
    setPendingRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (!userId || !editingServiceId) return;
    const entry = serviceRolesMap.get(editingServiceId);
    if (!entry) return;

    setSavingRoles(true);
    setError(null);

    const currentIds = entry.assignedRoleIds;
    const toAssign = [...pendingRoleIds].filter((id) => !currentIds.has(id));
    const toUnassign = [...currentIds].filter((id) => !pendingRoleIds.has(id));

    try {
      await Promise.all([
        ...toAssign.map((roleId) =>
          fetchWithAuth(
            identityUrl(endpoints.roles.assign),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, role_id: roleId }),
            },
            token,
          ),
        ),
        ...toUnassign.map((roleId) =>
          fetchWithAuth(
            identityUrl(endpoints.roles.unassign),
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, role_id: roleId }),
            },
            token,
          ),
        ),
      ]);
      setEditingServiceId(null);
      await refreshData();
    } catch {
      setError("Failed to update role assignments");
    }
    setSavingRoles(false);
  };



  const userName = user
    ? [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ")
    : "Loading…";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Sites for {userName}
          </h1>
          <p className="text-sm text-slate-500">
            Assign sites and configure roles for this user.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAssignModalOpen(true)}
          disabled={unassignedServices.length === 0}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Assign site
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading…
        </div>
      ) : assignedServices.length === 0 ? (
        <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500">
          No sites assigned to this user yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignedServices.map((svc) => {
            const entry = svc.id ? serviceRolesMap.get(svc.id) : null;
            const isEditing = editingServiceId === svc.id;

            return (
              <div
                key={svc.id ?? svc.name}
                className="rounded border border-slate-200 bg-white shadow"
              >
                {/* Site header row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-medium text-slate-800">{svc.name}</span>
                    {svc.description && (
                      <span className="ml-2 text-sm text-slate-500">
                        {svc.description}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => svc.id && openEditRoles(svc.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit Roles
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => svc.id && handleUnassignService(svc.id)}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Unassign
                    </button>
                  </div>
                </div>

                {/* Roles section */}
                {isEditing && entry && (
                  <div className="border-t border-slate-200 px-4 py-3">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Assign roles for {svc.name}:
                    </p>
                    {entry.allRoles.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No roles defined for this site.
                      </p>
                    ) : (
                      <div className="mb-3 space-y-1">
                        {entry.allRoles.map((role) => (
                          <label
                            key={role.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={pendingRoleIds.has(role.id ?? "")}
                              onChange={() => role.id && togglePendingRole(role.id)}
                            />
                            <span className="font-medium">{role.name}</span>
                            {role.description && (
                              <span className="text-slate-400">
                                — {role.description}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveRoles}
                        disabled={savingRoles}
                        className="rounded bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {savingRoles ? "Saving…" : "Save roles"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingServiceId(null)}
                        className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary of assigned roles when not editing */}
                {!isEditing && entry && entry.assignedRoleIds.size > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2">
                    <span className="text-xs text-slate-500">Roles: </span>
                    {entry.allRoles
                      .filter((r) => r.id && entry.assignedRoleIds.has(r.id))
                      .map((r) => (
                        <span
                          key={r.id}
                          className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700"
                        >
                          {r.name}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign new site modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Assign a site
            </h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Site
              </label>
              <select
                value={selectedNewServiceId}
                onChange={(e) => setSelectedNewServiceId(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
              >
                <option value="">Select a site…</option>
                {unassignedServices.map((s) => (
                  <option key={s.id ?? s.name} value={s.id ?? ""}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedNewServiceId("");
                }}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignService}
                disabled={!selectedNewServiceId}
                className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
