"use client";

import { useState } from "react";
import { 
  Activity, RefreshCw, CheckCircle2, XCircle, Clock, 
  ShieldAlert, AlertCircle, ShieldBan, Zap, Server
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HealthResult {
  status: "OK" | "ERROR" | "PENDING";
  message: string;
}

interface HealthData {
  database: HealthResult;
  storage: HealthResult;
  sockets: HealthResult;
  stuckBookings: HealthResult;
  ghostLives: HealthResult;
  negativeBalances: HealthResult;
  email: HealthResult;
  payments: HealthResult;
  uploadsProtection: HealthResult;
  authFlow: HealthResult;
  transactionFlow: HealthResult;
  signaling: HealthResult;
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
        const data = await apiFetch("/admin/health-check");
        setHealth(data);
        toast.success("Diagnóstico completado con éxito");
    } catch (err: any) {
        toast.error("Error al ejecutar las pruebas de salud");
    } finally {
        setChecking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Salud del Sistema
          </h1>
          <p className="text-white/40 mt-1 text-sm uppercase tracking-widest font-bold">Diagnóstico Integral de Infraestructura y Datos</p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-violet-600/20 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Analizando..." : "Ejecutar Diagnóstico Completo"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Infraestructura */}
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" /> Infraestructura Vital
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HealthCard 
                    title="Base de Datos (Postgres)" 
                    status={health?.database.status} 
                    message={health?.database.message} 
                    icon={Activity} 
                />
                <HealthCard 
                    title="Almacenamiento (Volume)" 
                    status={health?.storage.status} 
                    message={health?.storage.message} 
                    icon={ShieldAlert} 
                />
                <HealthCard 
                    title="Servidor de Sockets" 
                    status={health?.sockets.status} 
                    message={health?.sockets.message} 
                    icon={Activity} 
                />
            </div>
        </section>

        {/* Integridad de Datos */}
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-blue-400" /> Integridad & Estados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HealthCard 
                    title="Llamadas en Curso" 
                    status={health?.stuckBookings.status} 
                    message={health?.stuckBookings.message} 
                    icon={Clock} 
                />
                <HealthCard 
                    title="Vivos Fantasma" 
                    status={health?.ghostLives.status} 
                    message={health?.ghostLives.message} 
                    icon={AlertCircle} 
                />
                <HealthCard 
                    title="Consistencia de Saldos" 
                    status={health?.negativeBalances.status} 
                    message={health?.negativeBalances.message} 
                    icon={ShieldBan} 
                />
            </div>
        </section>

        {/* Servicios Externos */}
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-400" /> Conectividad Externa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HealthCard 
                    title="Gateway de Email (Resend)" 
                    status={health?.email.status} 
                    message={health?.email.message} 
                    icon={Activity} 
                />
                <HealthCard 
                    title="Pasarela de Pagos" 
                    status={health?.payments.status} 
                    message={health?.payments.message} 
                    icon={Activity} 
                />
            </div>
        </section>

        {/* Seguridad */}
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-red-500" /> Seguridad & Privacidad
            </h2>
            <div className="grid grid-cols-1 gap-4">
                <HealthCard 
                    title="Protección de Documentos (DNI)" 
                    status={health?.uploadsProtection.status} 
                    message={health?.uploadsProtection.message} 
                />
            </div>
        </section>

        {/* Simulaciones de Usuario */}
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-violet-400" /> Simulaciones de Usuario (E2E Backend)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HealthCard 
                    title="Flujo Registro / Login" 
                    status={health?.authFlow.status} 
                    message={health?.authFlow.message} 
                />
                <HealthCard 
                    title="Flujo Créditos / Pagos" 
                    status={health?.transactionFlow.status} 
                    message={health?.transactionFlow.message} 
                />
                <HealthCard 
                    title="Señalización WebRTC" 
                    status={health?.signaling.status} 
                    message={health?.signaling.message} 
                />
            </div>
        </section>
      </div>

      {!health && !checking && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
              <Zap className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/40 font-bold tracking-tight">Listo para iniciar diagnóstico</p>
              <p className="text-white/20 text-xs">Las pruebas de sistema pueden demorar unos segundos.</p>
          </div>
      )}
    </div>
  );
}

function HealthCard({ title, status, message }: any) {
    const isOk = status === "OK";
    const isError = status === "ERROR";

    return (
        <div className={cn(
            "p-6 rounded-[2rem] border transition-all duration-500 bg-black/40",
            isOk ? "border-green-500/20 shadow-[0_0_40px_-15px_rgba(34,197,94,0.1)]" : 
            isError ? "border-red-500/20 shadow-[0_0_40px_-15px_rgba(239,68,68,0.1)]" : 
            "border-white/5"
        )}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isOk ? "bg-green-500/10 text-green-400" : 
                    isError ? "bg-red-500/10 text-red-400 animate-pulse" : 
                    "bg-white/5 text-white/20"
                )}>
                    {isOk ? <CheckCircle2 className="w-5 h-5" /> : 
                     isError ? <XCircle className="w-5 h-5" /> : 
                     <Clock className="w-5 h-5" />}
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-white/70">{title}</p>
            </div>
            <p className={cn(
                "text-sm leading-relaxed font-medium",
                isOk ? "text-green-400/60" : isError ? "text-red-400/90" : "text-white/20"
            )}>
                {message || "Prueba pendiente de ejecución"}
            </p>
        </div>
    );
}
