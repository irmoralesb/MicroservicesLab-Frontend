import { useEffect, useState } from "react";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { useAuth } from "@/auth/context/AuthContext";
import type { RoleResponse, RoleUpdateRequest } from "@/shared/types";

interface EditRoleModalProps {
  open: boolean;
  role: RoleResponse | null;
  serviceName: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm = {
  name: "",
  description: "",
};

export function EditRoleModal({
  open,
  role,
  serviceName,
  onClose,
  onSuccess,
}: EditRoleModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name,
        description: role.description,
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role?.id) return;
    setError(null);
    setLoading(true);

    const payload: RoleUpdateRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      service_id: role.service_id ?? undefined,
    };

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.roles.update(role.id)),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.detail ?? "Failed to update role");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Edit role</h2>
            {serviceName && (
              <p className="text-xs text-slate-500">Service: {serviceName}</p>
            )}
          </div>
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
              Name
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              required
              maxLength={200}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            />
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
              disabled={loading}
              className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
