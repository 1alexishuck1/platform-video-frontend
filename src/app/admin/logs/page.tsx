"use client";
// Admin: Vista de logs del sistema con filtros por nivel, búsqueda, rango de fechas y paginación.
// Cada log tiene botón de copia para obtener el detalle completo como JSON.

import { useState, useEffect, useCallback } from "react";
import {
  Search, Copy, Check, ChevronLeft, ChevronRight,
  AlertTriangle, Info, AlertCircle, Zap, RefreshCw, Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const LEVELS = ["ALL", "INFO", "WARN", "ERROR", "CRITICAL"] as const;

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  INFO:     { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   icon: Info },
  WARN:     { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  ERROR:    { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",     icon: AlertCircle },
  CRITICAL: { color: "text-pink-400",  bg: "bg-pink-500/10 border-pink-500/20",   icon: Zap },
};

interface SystemLog {
  id: string;
  level: string;
  message: string;
  stack?: string;
  route?: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function CopyButton({ log }: { log: SystemLog }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar log completo como JSON"
      className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function LogRow({ log }: { log: SystemLog }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${cfg.bg}`}>
      {/* Row principal */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
              {log.level}
            </span>
            {log.route && (
              <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                {log.route}
              </span>
            )}
            {log.userId && (
              <span className="text-[10px] text-white/30">
                uid: {log.userId.slice(0, 8)}…
              </span>
            )}
          </div>
          <p className="text-sm text-white/80 mt-0.5 line-clamp-2">{log.message}</p>
          <p className="text-[10px] text-white/25 mt-1">
            {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss", { locale: es })}
          </p>
        </div>

        <CopyButton log={log} />
      </div>

      {/* Detalle expandible */}
      {expanded && (
        <div className="border-t border-white/10 p-3 space-y-3">
          {log.stack && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Stack trace</p>
              <pre className="text-[11px] font-mono text-red-300/70 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {log.stack}
              </pre>
            </div>
          )}
          {log.metadata && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Metadata</p>
              <pre className="text-[11px] font-mono text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    const params = new URLSearchParams();
    if (level !== "ALL") params.set("level", level);
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`${API}/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [level, search, from, to, page, limit]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Logs del sistema</h1>
          <p className="text-white/40 text-sm mt-1">
            {pagination ? `${pagination.total.toLocaleString()} registros encontrados` : "Cargando…"}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-3 h-3" /> Filtros
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-white/20 whitespace-nowrap">Mostrar</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value={20} className="bg-[#0a0a0c]">20</option>
                <option value={50} className="bg-[#0a0a0c]">50</option>
                <option value={100} className="bg-[#0a0a0c]">100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar en mensaje, ruta o userId…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Nivel */}
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); handleFilterChange(); }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l} className="bg-[#0a0a0c]">{l}</option>
            ))}
          </select>

          {/* Desde */}
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); handleFilterChange(); }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Lista de logs */}
      <div className="space-y-2">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-white/3 border border-white/5 rounded-xl animate-pulse" />
          ))
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-white/20">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No se encontraron logs con los filtros actuales.</p>
          </div>
        ) : (
          logs.map((log) => <LogRow key={log.id} log={log} />)
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
