"use client";
// Admin: Lista de descargos enviados por usuarios suspendidos/bloqueados.
// El admin puede marcar cada descargo como revisado o resuelto.

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, ChevronLeft, ChevronRight, CheckCheck, Eye, ShieldAlert, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const STATUSES = ["ALL", "PENDING", "REVIEWED", "RESOLVED"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  REVIEWED: { label: "Revisado",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  RESOLVED: { label: "Resuelto",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
};

const USER_STATUS_CONFIG: Record<string, string> = {
  ACTIVE:  "text-green-400",
  PAUSED:  "text-yellow-400",
  BLOCKED: "text-red-400",
};

interface Appeal {
  id: string;
  message: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  adminNote?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; status: string };
}

interface Pagination { total: number; page: number; limit: number; pages: number; }

function ResolutionModal({
  appeal, onConfirm, onClose, loading
}: {
  appeal: Appeal;
  onConfirm: (note: string, action: string, days?: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState("ACTIVE"); // ACTIVE, PAUSED, BLOCKED, NO_CHANGE
  const [days, setDays] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-white">Responder descargo</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
           <p className="text-[10px] font-black uppercase text-white/30 mb-1">Mensaje del usuario</p>
           <p className="text-xs text-white/60 italic">"{appeal.message}"</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Respuesta al usuario</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explicá la resolución (será visible para el usuario)…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Acción sobre la cuenta</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="ACTIVE" className="bg-[#0a0a0c]">Reactivar cuenta (ACTIVE)</option>
            <option value="PAUSED" className="bg-[#0a0a0c]">Mantener suspendida / Cambiar a días (PAUSED)</option>
            <option value="BLOCKED" className="bg-[#0a0a0c]">Bloquear cuenta (BLOCKED)</option>
            <option value="NO_CHANGE" className="bg-[#0a0a0c]">Solamente enviar respuesta (Sin cambio de estado)</option>
          </select>
        </div>

        {action === "PAUSED" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Nuevos días de suspensión (opcional)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Vacío = Permanente"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(note, action, days)}
            disabled={loading || note.trim().length < 5}
            className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Resolver
          </button>
        </div>
      </div>
    </div>
  );
}

function AppealRow({ appeal, onStatusChange }: {
  appeal: Appeal;
  onStatusChange: (id: string, status: string, note?: string, newStatus?: string, days?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[appeal.status];
  const userColor = USER_STATUS_CONFIG[appeal.user.status] || "text-white/50";

  const handleStatusUpdate = async (status: string) => {
    setLoading(true);
    await onStatusChange(appeal.id, status);
    setLoading(false);
  };

  const handleResolve = async (note: string, action: string, days?: string) => {
    setLoading(true);
    await onStatusChange(appeal.id, "RESOLVED", note, action === "NO_CHANGE" ? undefined : action, days);
    setLoading(false);
    setShowResolve(false);
  };

  return (
    <>
      {showResolve && (
        <ResolutionModal
          appeal={appeal}
          onClose={() => setShowResolve(false)}
          onConfirm={handleResolve}
          loading={loading}
        />
      )}
      <div className={`border rounded-2xl overflow-hidden transition-all ${cfg.bg}`}>
        <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <MessageSquare className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">{appeal.user.name}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${userColor}`}>
                {appeal.user.status}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">{appeal.user.email}</p>
            <p className="text-sm text-white/70 mt-1.5 line-clamp-2">{appeal.message}</p>
            <p className="text-[10px] text-white/25 mt-1">
              {format(new Date(appeal.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {appeal.status === "PENDING" && (
              <button
                onClick={() => handleStatusUpdate("REVIEWED")}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                Dando lectura
              </button>
            )}
            {appeal.status !== "RESOLVED" && (
              <button
                onClick={() => setShowResolve(true)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Responder
              </button>
            )}
          </div>
        </div>

        {/* Mensaje completo expandido */}
        {expanded && (
          <div className="border-t border-white/10 p-4 space-y-5 bg-white/[0.01]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Mensaje completo del usuario</p>
              <p className="text-sm text-white/70 leading-relaxed font-medium bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner italic">
                "{appeal.message}"
              </p>
            </div>
            
            {appeal.adminNote && (
              <div className="bg-violet-600/5 rounded-2xl p-4 border border-violet-600/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2 flex items-center gap-1.5">
                   <MessageSquare className="w-3 h-3" /> Tu respuesta final enviada
                </p>
                <p className="text-sm text-white/80 font-medium">{appeal.adminNote}</p>
              </div>
            )}

            <div className="flex items-center justify-between items-end pt-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5">ID DE USUARIO</p>
                <p className="font-mono text-[10px] text-white/40">{appeal.user.id}</p>
              </div>
              
              {appeal.status !== "RESOLVED" && (
                <button
                  onClick={() => setShowResolve(true)}
                  disabled={loading}
                  className="px-6 h-10 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-600/10 transition-all active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  Emitir fallo / Resolver
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    params.set("page", String(page));

    try {
      const res = await fetch(`${API}/admin/appeals?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setAppeals(data.appeals || []);
      setPagination(data.pagination || null);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleStatusChange = async (id: string, newStatus: string, note?: string, userAction?: string, days?: string) => {
    const adminToken = localStorage.getItem("admin_token");
    await fetch(`${API}/admin/appeals/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ 
        status: newStatus, 
        adminNote: note,
        newStatus: userAction,
        days 
      }),
    });
    setAppeals(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as Appeal["status"], adminNote: note } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Descargos</h1>
          <p className="text-white/40 text-sm mt-1">
            {pagination ? `${pagination.total} descargos encontrados` : "Cargando…"}
          </p>
        </div>
        <button
          onClick={fetchAppeals}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              status === s
                ? "bg-white/15 text-white border border-white/20"
                : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            {s === "ALL" ? "Todos" : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
          ))
        ) : appeals.length === 0 ? (
          <div className="py-20 text-center text-white/20">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay descargos {status !== "ALL" ? `con estado "${STATUS_CONFIG[status]?.label}"` : ""}.</p>
          </div>
        ) : (
          appeals.map((a) => (
            <AppealRow key={a.id} appeal={a} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/30">Página {pagination.page} de {pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
