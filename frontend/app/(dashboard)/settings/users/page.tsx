"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { accountsApi, AccountUser, CreateUserPayload } from "@/lib/api/accounts";
import { can, getRoleLabel } from "@/lib/permissions";
import { UserRole } from "@/lib/user";
import { Users, X, Loader2, KeyRound, UserX, UserCheck, Trash2 } from "lucide-react";

type AssignableRole = "admin" | "editor" | "viewer";

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors";
const selectClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5";

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  owner:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  admin:       "bg-blue-100   text-blue-700   dark:bg-blue-500/10   dark:text-blue-400",
  editor:      "bg-amber-100  text-amber-700  dark:bg-amber-500/10  dark:text-amber-400",
  viewer:      "bg-gray-100   text-gray-600   dark:bg-white/[0.06]  dark:text-gray-400",
};
const STATUS_BADGE: Record<string, string> = {
  active:   "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  inactive: "bg-gray-100  text-gray-600  dark:bg-white/[0.06] dark:text-gray-400",
};

// ─── Create user modal ────────────────────────────────────────────────────────
function CreateUserModal({
  accountId,
  currentRole,
  onClose,
}: {
  accountId: string;
  currentRole: UserRole;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserPayload>({
    name: "", email: "", password: "", role: "viewer",
  } as CreateUserPayload);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreateUserPayload) => accountsApi.createUser(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-users", accountId] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.status === 409 ? "Este correo ya está en uso." : "Error al crear el usuario.");
    },
  });

  const availableRoles: AssignableRole[] =
    currentRole === "super_admin" || currentRole === "owner"
      ? ["admin", "editor", "viewer"]
      : ["editor", "viewer"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nuevo usuario</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
          className="p-5 space-y-4"
        >
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass} placeholder="Ej. María García" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={inputClass} placeholder="correo@empresa.com" />
          </div>
          <div>
            <label className={labelClass}>Contraseña temporal</label>
            <input type="password" required minLength={8} value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={inputClass} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <select value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AssignableRole }))}
              className={selectClass}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{getRoleLabel(r as UserRole)}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1.5">
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mutation.isPending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reset password modal ─────────────────────────────────────────────────────
function ResetPasswordModal({
  accountId,
  user,
  onClose,
}: {
  accountId: string;
  user: AccountUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  const mutation = useMutation({
    mutationFn: (pwd: string) => accountsApi.resetUserPassword(accountId, user.id, pwd),
    onSuccess: () => setDone(true),
    onError: () => setError("Error al resetear la contraseña."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Resetear contraseña</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-2">
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">Contraseña actualizada correctamente.</p>
              <button onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {user.name} &middot; {user.email}
              </p>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(password); }}
                className="space-y-4">
                <div>
                  <label className={labelClass}>Nueva contraseña</label>
                  <input type="password" required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass} placeholder="Mínimo 8 caracteres" />
                </div>
                {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={mutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1.5">
                    {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate]   = useState(false);
  const [resetTarget, setResetTarget] = useState<AccountUser | null>(null);

  const accountId = currentUser?.account_id ?? "";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["account-users", accountId],
    queryFn: () => accountsApi.getUsers(accountId),
    enabled: !!accountId && can(currentUser?.role, "view_users"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: "active" | "inactive" }) =>
      accountsApi.updateUser(accountId, userId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account-users", accountId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => accountsApi.deleteUser(accountId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account-users", accountId] }),
  });

  if (!can(currentUser?.role, "view_users")) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500 dark:text-gray-400">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Usuarios</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gestiona los usuarios de tu cuenta.
            </p>
          </div>
          {can(currentUser?.role, "create_users") && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              + Nuevo usuario
            </button>
          )}
        </div>

        {/* Table column headers */}
        <div className="flex-shrink-0 grid grid-cols-[2fr_1fr_1fr_auto] px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Usuario</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Rol</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Estado</span>
          <span className="w-24" />
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
          {!isLoading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay usuarios todavía.</p>
            </div>
          )}
          {!isLoading && users.map((u) => {
            const isProtected = u.role === "owner" && currentUser?.role !== "super_admin";
            const isSelf      = u.id === currentUser?.id;
            const canAct      = !isSelf && !isProtected && can(currentUser?.role, "edit_users");

            return (
              <div key={u.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center px-5 py-3.5 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                {/* Name + email */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {u.name}{isSelf && <span className="ml-1.5 text-[10px] text-gray-400">(tú)</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>

                {/* Role badge */}
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.role] ?? ""}`}>
                    {getRoleLabel(u.role as UserRole)}
                  </span>
                </div>

                {/* Status badge */}
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[u.status] ?? ""}`}>
                    {u.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end w-24">
                  {canAct && can(currentUser?.role, "reset_user_password") && (
                    <button
                      onClick={() => setResetTarget(u)}
                      title="Resetear contraseña"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canAct && (
                    <button
                      onClick={() => toggleMutation.mutate({ userId: u.id, status: u.status === "active" ? "inactive" : "active" })}
                      title={u.status === "active" ? "Desactivar" : "Activar"}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors"
                    >
                      {u.status === "active"
                        ? <UserX className="w-3.5 h-3.5" />
                        : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {canAct && can(currentUser?.role, "delete_users") && (
                    <button
                      onClick={() => { if (confirm(`¿Eliminar a ${u.name}?`)) deleteMutation.mutate(u.id); }}
                      title="Eliminar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showCreate && currentUser && (
        <CreateUserModal
          accountId={accountId}
          currentRole={currentUser.role}
          onClose={() => setShowCreate(false)}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          accountId={accountId}
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}