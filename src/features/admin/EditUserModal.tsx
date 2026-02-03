import { useState, useEffect } from "react";
import type { UserProfileResponse, UpdateProfileRequest } from "@/shared/types";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { useAuth } from "@/auth/context/AuthContext";

interface EditUserModalProps {
  open: boolean;
  user: UserProfileResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({
  open,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [form, setForm] = useState<UpdateProfileRequest>({
    first_name: "",
    middle_name: null,
    last_name: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetchWithAuth(
        identityUrl(endpoints.profile.update),
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
      }else{
        setError(data.detail ?? 'Failed to update user');
      }
    } catch{
      setError("Network Error.")
    }
    finally{
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
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
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
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
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
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
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
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
