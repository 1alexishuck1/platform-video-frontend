"use client";
// Admin: Lista de usuarios con búsqueda, filtro por rol y paginación.
// Acciones: Pausar, Bloquear, Reanudar — con motivo obligatorio y confirmación visual.

import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, Users,
  Star, ShieldAlert, Activity, Wallet, RefreshCw,
  Pause, ShieldBan, Play, Loader2, X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const ROLES = ["ALL", "USER", "ADMIN"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:  { label: "Activo",    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  PAUSED:  { label: "Pausado",   color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  BLOCKED: { label: "Bloqueado", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  statusReason?: string;
  statusUntil?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  balance?: { balance: number };
  talentProfile?: { stageName: string; isLive: boolean; category: string } | null;
  _count: { bookingsAsFan: number; bookingsAsTalent: number; platformWarnings: number };
}

interface Pagination {
  total: number; page: number; limit: number; pages: number;
}

// Modal de confirmación de acción
function ActionModal({
  action, userName, onConfirm, onClose, loading
}: {
  action: "PAUSED" | "BLOCKED" | "ACTIVE";
  userName: string;
  onConfirm: (reason: string, days?: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("");
  const needsReason = action !== "ACTIVE";
  const isPause = action === "PAUSED";

  const labels: Record<string, { title: string; color: string; btn: string }> = {
    PAUSED:  { title: "Pausar cuenta", color: "text-yellow-400", btn: "bg-yellow-500 hover:bg-yellow-400" },
    BLOCKED: { title: "Bloquear cuenta", color: "text-red-400", btn: "bg-red-600 hover:bg-red-500" },
    ACTIVE:  { title: "Reanudar cuenta", color: "text-green-400", btn: "bg-green-600 hover:bg-green-500" },
  };
  const cfg = labels[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className={`font-black text-lg ${cfg.color}`}>{cfg.title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-white/50">Acción sobre: <span className="text-white font-bold">{userName}</span></p>
        {needsReason && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Motivo (visible al usuario)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describí el motivo de la sanción…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
        )}
        {isPause && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Duración (opcional, en días)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Ej: 7 (vacío = permanente)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason, days)}
            disabled={loading || (needsReason && reason.trim().length < 3)}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${cfg.btn}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onStatusChange }: { user: AdminUser; onStatusChange: (id: string, status: string, reason: string, days?: string) => Promise<void> }) {
  const [pendingAction, setPendingAction] = useState<"PAUSED" | "BLOCKED" | "ACTIVE" | null>(null);
  const [loading, setLoading] = useState(false);
  const isTalent = !!user.talentProfile;
  const warnings = user._count.platformWarnings;
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.ACTIVE;


  const handleConfirm = async (reason: string, days?: string) => {
    if (!pendingAction) return;
    setLoading(true);
    await onStatusChange(user.id, pendingAction, reason, days);
    setLoading(false);
    setPendingAction(null);
  };

  return (
    <>
      {pendingAction && (
        <ActionModal
          action={pendingAction}
          userName={user.name}
          onConfirm={handleConfirm}
          onClose={() => setPendingAction(null)}
          loading={loading}
        />
      )}
      <div className="bg-white/2 border border-white/6 hover:border-white/12 rounded-2xl p-4 transition-all">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-xs font-black text-violet-400">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm">{user.name}</p>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              {isTalent && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full border text-yellow-400 bg-yellow-500/10 border-yellow-500/20 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" /> Talento
                </span>
              )}
              {user.talentProfile?.isLive && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full border text-green-400 bg-green-500/10 border-green-500/20 flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5" /> En vivo
                </span>
              )}
            </div>
            <p className="text-xs text-white/30 mt-0.5">{user.email}</p>
            <p className="text-[10px] text-white/20 mt-0.5 font-mono">{user.id.slice(0, 8)}… · {format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })}</p>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-5 shrink-0 text-center">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Balance</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Wallet className="w-3 h-3 text-green-400" />
                <span className="text-sm font-black text-green-400">{user.balance?.balance ?? 0}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Reservas</p>
              <p className="text-sm font-black text-white mt-0.5">{user._count.bookingsAsFan}</p>
            </div>
            {warnings > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Avisos</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3 text-orange-400" />
                  <span className="text-sm font-black text-orange-400">{warnings}</span>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 shrink-0">
            {user.status !== "PAUSED" && (
              <button
                onClick={() => setPendingAction("PAUSED")}
                title="Pausar cuenta"
                className="p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {user.status !== "BLOCKED" && (
              <button
                onClick={() => setPendingAction("BLOCKED")}
                title="Bloquear cuenta"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
              >
                <ShieldBan className="w-4 h-4" />
              </button>
            )}
            {user.status !== "ACTIVE" && (
              <button
                onClick={() => setPendingAction("ACTIVE")}
                title="Reanudar cuenta"
                className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminUsersPage() {

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role !== "ALL") params.set("role", role);
    params.set("page", String(page));
    params.set("limit", "50");

    try {
      const res = await fetch(`${API}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const [actionError, setActionError] = useState("");

  const handleStatusChange = async (id: string, status: string, reason: string, days?: string) => {
    const adminToken = localStorage.getItem("admin_token");
    setActionError("");
    try {
      const res = await fetch(`${API}/admin/users/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status, reason, days }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || `Error ${res.status}`);
        return;
      }

      // Actualizar el usuario localmente
      setUsers(prev => prev.map(u =>
        u.id === id ? {
          ...u,
          status: status as AdminUser["status"],
          statusReason: reason,
          statusUntil: data.user?.statusUntil
        } : u
      ));
    } catch (err: any) {
      setActionError("Error de red al cambiar el estado del usuario.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Usuarios</h1>
          <p className="text-white/40 text-sm mt-1">
            {pagination ? `${pagination.total.toLocaleString()} usuarios registrados` : "Cargando…"}
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchUsers(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="text-red-400/60 hover:text-red-400 ml-4">✕</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-[#0a0a0c]">{r === "ALL" ? "Todos los roles" : r}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
          ))
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-white/20">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No se encontraron usuarios.</p>
          </div>
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/30">
            Página {pagination.page} de {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

