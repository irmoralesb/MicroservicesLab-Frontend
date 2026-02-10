import { useEffect, useMemo, useState } from "react";
import type {
  RoleAssignRequest,
  RoleResponse,
  ServiceResponse,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/shared/types";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { useAuth } from "@/auth/context/AuthContext";

interface EditUserModalProps {
  open: boolean;
  user: UserProfileResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

type RoleOption = RoleResponse & { service_name?: string };

export function EditUserModal({
  open,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<UpdateProfileRequest>({
    first_name: "",
    middle_name: null,
    last_name: "",
    email: "",
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleUpdatingIds, setRoleUpdatingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const groupedRoles = useMemo(() => {
    const grouped: Record<string, RoleOption[]> = {};
    for (const role of roles) {
      const key = role.service_id ?? "unknown-service";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(role);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((left, right) => left.name.localeCompare(right.name));
    }
    return grouped;
  }, [roles]);

  const serviceNames = useMemo(() => {
    return roles.reduce((names, role) => {
      if (role.service_id && role.service_name) {
        names.set(role.service_id, role.service_name);
      }
      return names;
    }, new Map<string, string>());
  }, [roles]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        middle_name: user.middle_name ?? null,
        last_name: user.last_name,
        email: user.email,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!open) {
      setRoles([]);
      setSelectedRoleIds([]);
      setInitialRoleIds([]);
      setRolesLoading(false);
      setRoleUpdatingIds(new Set());
      setError(null);
      return;
    }

    if (!user?.id) return;

    const loadRoleData = async (userId: string) => {
      setRolesLoading(true);
      setError(null);

      try {
        const [servicesRes, userRolesRes] = await Promise.all([
          fetchWithAuth(
            identityUrl(endpoints.services.all),
            { method: "GET" },
            token,
          ),
          fetchWithAuth(
            identityUrl(endpoints.roles.userRoles(userId)),
            { method: "GET" },
            token,
          ),
        ]);

        const servicesData = await servicesRes.json().catch(() => []);
        const userRolesData = await userRolesRes.json().catch(() => []);

        if (!servicesRes.ok) {
          throw new Error(servicesData.detail ?? "Failed to load services");
        }
        if (!userRolesRes.ok) {
          throw new Error(userRolesData.detail ?? "Failed to load user roles");
        }

        const services = Array.isArray(servicesData)
          ? (servicesData as ServiceResponse[])
          : [];

        const rolesByService = await Promise.all(
          services
            .filter((service) => Boolean(service.id))
            .map(async (service) => {
              const serviceId = service.id as string;
              const res = await fetchWithAuth(
                identityUrl(endpoints.roles.list(serviceId)),
                { method: "GET" },
                token,
              );
              const data = await res.json().catch(() => []);
              if (!res.ok) {
                throw new Error(
                  data.detail ?? `Failed to load roles for ${service.name}`,
                );
              }
              const roleItems = Array.isArray(data)
                ? (data as RoleResponse[])
                : [];
              return roleItems.map((role) => ({
                ...role,
                service_name: service.name,
              }));
            }),
        );

        const flatRoles = rolesByService.flat();
        setRoles(flatRoles);

        const assignedIds = Array.isArray(userRolesData)
          ? userRolesData
              .map((role: RoleResponse) => role.id)
              .filter((roleId): roleId is string => Boolean(roleId))
          : [];
        setSelectedRoleIds(assignedIds);
        setInitialRoleIds(assignedIds);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load roles";
        setError(message);
        setRoles([]);
        setSelectedRoleIds([]);
        setInitialRoleIds([]);
      } finally {
        setRolesLoading(false);
      }
    };

    void loadRoleData(user.id);
  }, [open, token, user?.id]);

  const toggleRole = async (roleId: string, checked: boolean) => {
    if (!user?.id) return;

    setError(null);
    setRoleUpdatingIds((prev) => new Set([...prev, roleId]));
    setSelectedRoleIds((prev) =>
      checked ? [...new Set([...prev, roleId])] : prev.filter((id) => id !== roleId),
    );

    const payload: RoleAssignRequest = {
      user_id: user.id as string,
      role_id: roleId,
    };

    const endpoint = checked ? endpoints.roles.assign : endpoints.roles.unassign;

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoint),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail ?? "Failed to update roles");
      }
      setInitialRoleIds((prev) =>
        checked ? [...new Set([...prev, roleId])] : prev.filter((id) => id !== roleId),
      );
    } catch (err) {
      setSelectedRoleIds((prev) =>
        checked ? prev.filter((id) => id !== roleId) : [...new Set([...prev, roleId])],
      );
      const message = err instanceof Error ? err.message : "Failed to update roles";
      setError(message);
    } finally {
      setRoleUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(roleId);
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.profile.selected(user.id)),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        token,
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.detail ?? "Failed to update user");
      }
    } catch {
      setError("Network error.");
    }
    finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">Edit user</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Middle name
            </label>
            <input
              type="text"
              maxLength={50}
              value={form.middle_name ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, middle_name: e.target.value || null }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              maxLength={100}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Roles</label>
              {rolesLoading && (
                <span className="text-xs text-slate-500">Loading roles…</span>
              )}
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              {rolesLoading ? (
                <div className="text-sm text-slate-500">
                  Fetching role catalog…
                </div>
              ) : roles.length === 0 ? (
                <div className="text-sm text-slate-500">No roles found.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(groupedRoles)
                    .sort(([left], [right]) => {
                      const leftName = serviceNames.get(left) ?? "";
                      const rightName = serviceNames.get(right) ?? "";
                      return leftName.localeCompare(rightName);
                    })
                    .map(([serviceId, serviceRoles]) => (
                      <div key={serviceId} className="rounded bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {serviceNames.get(serviceId) ?? "Unknown service"}
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {serviceRoles.map((role) => (
                            <label
                              key={role.id ?? role.name}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                disabled={
                                  !role.id ||
                                  (role.id ? roleUpdatingIds.has(role.id) : false)
                                }
                                checked={
                                  role.id
                                    ? selectedRoleIds.includes(role.id)
                                    : false
                                }
                                onChange={(e) => {
                                  if (!role.id) return;
                                  void toggleRole(role.id, e.target.checked);
                                }}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-800 disabled:opacity-60"
                              />
                              <span>
                                <span className="font-medium text-slate-800">
                                  {role.name}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  {role.description}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          {error && (
            <div
              className="rounded bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rolesLoading}
              className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
