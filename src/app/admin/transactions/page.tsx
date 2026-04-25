"use client";
// Admin: Historial de transacciones (Bookings)
// Muestra pagos, estados y detalles de la sesión con paginación.

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Calendar, DollarSign, Clock, 
  ExternalLink, ChevronLeft, ChevronRight, RefreshCw,
  User, CheckCircle2, XCircle, Timer, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Transaction {
  id: string;
  startsAt: string | null;
  durationSec: number;
  priceUsd: number;
  status: string;
  createdAt: string;
  fan: { name: string; email: string; avatarUrl: string | null };
  talent: { name: string; email: string; avatarUrl: string | null };
}

interface Pagination { total: number; page: number; limit: number; pages: number; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  COMPLETED: { label: "Completado", color: "text-green-400",  bg: "bg-green-400/5 border-green-400/20", icon: CheckCircle2 },
  PENDING:   { label: "Pendiente",  color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/20", icon: Timer },
  CANCELLED: { label: "Cancelado",  color: "text-red-400",    bg: "bg-red-400/5 border-red-400/20",     icon: XCircle },
  CONFIRMED: { label: "Confirmado", color: "text-blue-400",   bg: "bg-blue-400/5 border-blue-400/20",   icon: AlertCircle },
};

export default function AdminTransactionsPage() {
  const [view, setView] = useState<"BOOKINGS" | "CREDITS">("BOOKINGS");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    
    if (view === "BOOKINGS") {
      if (status !== "ALL") params.set("status", status);
    } else {
      if (status !== "ALL") params.set("type", status);
    }
    
    params.set("page", String(page));
    params.set("limit", "15");

    const endpoint = view === "BOOKINGS" ? "transactions" : "credit-transactions";

    try {
      const res = await fetch(`${API}/admin/${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination || null);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page, view]);

  useEffect(() => {
    const t = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(t);
  }, [fetchTransactions]);

  const handleTabChange = (v: "BOOKINGS" | "CREDITS") => {
    setView(v);
    setPage(1);
    setStatus("ALL");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Transacciones</h1>
          <p className="text-white/40 text-sm mt-1">
            {pagination ? `${pagination.total.toLocaleString()} registros encontrados` : "Cargando…"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
           <button 
             onClick={() => handleTabChange("BOOKINGS")}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "BOOKINGS" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}
           >
             Reservas
           </button>
           <button 
             onClick={() => handleTabChange("CREDITS")}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "CREDITS" ? "bg-violet-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
           >
             Tokens / Créditos
           </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={view === "BOOKINGS" ? "Buscar por usuario, email o ID…" : "Buscar por usuario o motivo…"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all font-medium"
          />
        </div>
        
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="ALL" className="bg-[#0a0a0c]">Todos los tipos</option>
          {view === "BOOKINGS" ? (
             Object.keys(STATUS_CONFIG).map(s => (
               <option key={s} value={s} className="bg-[#0a0a0c]">{STATUS_CONFIG[s].label}</option>
             ))
          ) : (
            <>
              <option value="DEPOSIT" className="bg-[#0a0a0c]">Carga (DEPOSIT)</option>
              <option value="PAYMENT" className="bg-[#0a0a0c]">Pago (PAYMENT)</option>
              <option value="EARNING" className="bg-[#0a0a0c]">Ingreso talento (EARNING)</option>
              <option value="WITHDRAWAL" className="bg-[#0a0a0c]">Retiro (WITHDRAWAL)</option>
            </>
          )}
        </select>
      </div>

      {/* Grid de Transacciones */}
      <div className="grid gap-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
          ))
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-white/20">
            {view === "BOOKINGS" ? <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /> : <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />}
            <p className="font-medium">No se encontraron registros.</p>
          </div>
        ) : (
          transactions.map((t) => (
            view === "BOOKINGS" 
              ? <TransactionRow key={t.id} transaction={t} />
              : <CreditTransactionRow key={t.id} transaction={t} />
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

function CreditTransactionRow({ transaction: t }: { transaction: any }) {
    const isPositive = t.amount > 0;
    const typeLabel: Record<string, string> = {
        DEPOSIT: "Recarga",
        WITHDRAWAL: "Retiro",
        PAYMENT: "Pago",
        EARNING: "Ganancia",
        REFUND: "Reembolso",
        SYSTEM_ADJ: "Ajuste"
    };

    return (
        <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {t?.user?.avatarUrl ? <img src={t.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white/20" />}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t?.user?.name || 'Usuario desconocido'}</p>
                    <p className="text-[10px] text-white/30 truncate">{t.reason || typeLabel[t.type]}</p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{t.amount} TKS
                </span>
                <p className="text-[10px] text-white/20">
                    {format(new Date(t.createdAt), "dd MMM, HH:mm", { locale: es })}
                </p>
            </div>
        </div>
    );
}

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  return (
    <div className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all hover:bg-white/[0.04]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado Izquierdo: Usuarios */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 w-40 shrink-0">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {t?.fan?.avatarUrl ? <img src={t.fan.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-white/30" />}
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Fan / Comprador</p>
                <p className="text-xs font-bold text-white truncate">{t?.fan?.name || 'Desconocido'}</p>
             </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          <div className="flex items-center gap-3 w-40 shrink-0">
             <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center overflow-hidden border border-violet-500/20">
                {t?.talent?.avatarUrl ? <img src={t.talent.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-violet-400" />}
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/40">Talento / Host</p>
                <p className="text-xs font-bold text-white truncate">{t?.talent?.name || 'Desconocido'}</p>
             </div>
          </div>
        </div>

        {/* Centro: Info Sesión */}
        <div className="flex-1 flex items-center justify-end md:justify-center gap-8">
           <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5">Monto</p>
              <div className="flex items-center justify-center gap-1">
                 <DollarSign className="w-3 h-3 text-green-400" />
                 <span className="text-sm font-black text-white">{(t.priceUsd || 0).toFixed(2)}</span>
              </div>
           </div>
           
           <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5">Duración</p>
              <div className="flex items-center justify-center gap-1">
                 <Clock className="w-3 h-3 text-white/30" />
                 <span className="text-sm font-bold text-white/70">{t.durationSec / 60}m</span>
              </div>
           </div>
        </div>

        {/* Lado Derecho: Estado y Fecha */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
           </div>
           <p className="text-[10px] text-white/25 font-medium">
              {format(new Date(t.createdAt), "dd MMM, HH:mm", { locale: es })}
           </p>
        </div>
      </div>
      
      {/* Footer del row: IDs */}
      <div className="mt-4 pt-3 border-t border-white/[0.02] flex items-center justify-between">
         <p className="text-[9px] font-mono text-white/10 uppercase tracking-widest">Transaction ID: {t.id}</p>
         <button className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 hover:text-white/40 transition-colors flex items-center gap-1">
            Ver detalle técnico <ExternalLink className="w-2.5 h-2.5" />
         </button>
      </div>
    </div>
  );
}
