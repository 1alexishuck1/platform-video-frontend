"use client";
// Dashboard de administración: Métricas clave y resumen operativo
// Diseño premium con tarjetas interactivas y estados en tiempo real.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, ShieldAlert, MessageSquare, Activity, 
  ArrowUpRight, Users2, ShieldBan, AlertCircle,
  RefreshCw, ChevronRight, Zap
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Stats {
  users: { total: number; active: number; paused: number; blocked: number };
  appeals: { pending: number };
  system: { todayLogs: number; errorsLast24h: number };
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: loading, refetch, isRefetching } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch("/admin/stats"),
    staleTime: 1000 * 60 * 2,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Panel de Control</h1>
          <p className="text-white/40 mt-1 text-sm uppercase tracking-widest font-bold">Estado General de la Plataforma</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-30 border border-white/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Actualizando..." : "Actualizar datos"}
        </button>
      </div>

      {/* Grid Principal de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Usuarios Totales" 
          value={stats?.users.total ?? 0} 
          icon={Users} 
          color="blue"
          loading={loading}
          href="/admin/users"
        />
        <StatCard 
          title="Descargos Pendientes" 
          value={stats?.appeals.pending ?? 0} 
          icon={MessageSquare} 
          color="yellow"
          loading={loading}
          href="/admin/appeals"
          highlight={stats?.appeals.pending ? stats.appeals.pending > 0 : false}
        />
        <StatCard 
          title="Errores (24h)" 
          value={stats?.system.errorsLast24h ?? 0} 
          icon={AlertCircle} 
          color="red"
          loading={loading}
          href="/admin/logs"
          highlight={stats?.system.errorsLast24h ? stats.system.errorsLast24h > 0 : false}
        />
        <StatCard 
          title="Logs Hoy" 
          value={stats?.system.todayLogs ?? 0} 
          icon={Zap} 
          color="violet"
          loading={loading}
          href="/admin/logs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Distribución de Estados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MiniCard label="Activos" value={stats?.users.active ?? 0} color="text-green-400" bg="bg-green-400/5" />
                <MiniCard label="Pausados" value={stats?.users.paused ?? 0} color="text-yellow-400" bg="bg-yellow-400/5" />
                <MiniCard label="Bloqueados" value={stats?.users.blocked ?? 0} color="text-red-400" bg="bg-red-400/5" />
            </div>

            {/* Banner Informativo */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 rounded-[2rem] p-8">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter">Moderación Blindada</h3>
                    <p className="text-white/60 text-sm max-w-md leading-relaxed">
                        El sistema de descargos y sanciones está operativo. Recordá que cada sanción permite un descargo único del usuario para mantener el orden y la transparencia.
                    </p>
                    <Link href="/admin/appeals" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                        Revisar pendientes <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
                <Users2 className="absolute -right-4 -bottom-4 w-40 h-40 text-white/[0.03] group-hover:text-white/[0.05] transition-all duration-700 rotate-12" />
            </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Acciones Directas</h2>
            <div className="bg-white/[0.03] border border-white/8 rounded-[2rem] p-2 space-y-1">
                <QuickLink href="/admin/users" icon={Users} label="Gestionar Usuarios" />
                <QuickLink href="/admin/appeals" icon={MessageSquare} label="Resolver Descargos" />
                <QuickLink href="/admin/logs" icon={ShieldAlert} label="Auditoría de Logs" />
                <QuickLink href="/" icon={ArrowUpRight} label="Ir al Sitio Público" />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, loading, href, highlight }: any) {
  const colors: any = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };

  return (
    <Link href={href}>
        <div className={`group relative bg-white/[0.03] border border-white/8 rounded-3xl p-6 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden ${highlight ? 'ring-2 ring-red-500/30' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{title}</p>
            <div className="flex items-end justify-between">
                {loading ? (
                    <div className="h-9 w-16 bg-white/5 animate-pulse rounded-lg" />
                ) : (
                    <p className="text-3xl font-black text-white tracking-tighter">{value.toLocaleString()}</p>
                )}
                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all duration-700" />
        </div>
    </Link>
  );
}

function MiniCard({ label, value, color, bg }: any) {
    return (
        <div className={`p-4 rounded-3xl border border-white/5 ${bg}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function QuickLink({ href, icon: Icon, label }: any) {
    return (
        <Link href={href} className="flex items-center justify-between p-4 rounded-2xl bg-transparent hover:bg-white/5 group transition-all">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all group-hover:translate-x-1" />
        </Link>
    );
}
