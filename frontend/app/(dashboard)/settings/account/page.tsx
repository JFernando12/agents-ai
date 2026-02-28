"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { accountsApi } from "@/lib/api/accounts";
import { can } from "@/lib/permissions";

export default function AccountSettingsPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => accountsApi.getMyAccount(),
    enabled: !!currentUser,
  });

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) setName(account.name);
  }, [account]);

  const mutation = useMutation({
    mutationFn: () => accountsApi.updateMyAccount({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => setError("Error al guardar los cambios."),
  });

  const canEdit = can(currentUser?.role, "manage_account");

  const inputClass =
    "w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5";

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Mi Cuenta</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Información general de la cuenta.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            {/* Editable name */}
            <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <label className={labelClass}>Nombre de la cuenta</label>
              {canEdit ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={mutation.isPending || name === account?.name}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
                  >
                    {mutation.isPending ? "Guardando..." : "Guardar"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-900 dark:text-white">{account?.name}</p>
              )}
              {saved && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">Cambios guardados correctamente.</p>
              )}
              {error && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
              )}
            </div>

            {/* Read-only fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] sm:border-r">
                <p className={labelClass}>Slug</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">{account?.slug ?? "—"}</p>
              </div>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                <p className={labelClass}>Email del dueño</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{account?.owner_email ?? "—"}</p>
              </div>
              <div className="px-5 py-4 sm:border-r border-gray-100 dark:border-white/[0.06]">
                <p className={labelClass}>Plan</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 capitalize">
                  {account?.plan ?? "free"}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className={labelClass}>Estado</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  account?.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400"
                }`}>
                  {account?.status === "active" ? "Activa" : (account?.status ?? "—")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
