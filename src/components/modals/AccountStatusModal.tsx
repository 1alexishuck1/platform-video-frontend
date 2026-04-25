"use client";
// Modal que se muestra cuando el usuario tiene cuenta PAUSED o BLOCKED.
// Incluye formulario de descargo que se envía al admin.

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldBan, Send, Loader2, CheckCircle, MessageSquare, Clock, ExternalLink, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AccountStatusModalProps {
  status: "PAUSED" | "BLOCKED";
  reason?: string;
  onClose?: () => void;
}

export function AccountStatusModal({ status, reason, onClose }: AccountStatusModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingAppeal, setExistingAppeal] = useState<any>(null);
  const [statusUntil, setStatusUntil] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isPaused = status === "PAUSED";

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Obtenemos los detalles frescos del estado del usuario
        const data = await apiFetch("/auth/appeal");
        
        if (data.statusUntil) setStatusUntil(data.statusUntil);
        
        if (data.appeal) {
          setExistingAppeal(data.appeal);
          // Si el descargo existe (esté pendiente o resuelto), marcamos como enviado
          setSent(true);
        }
      } catch (err: any) {
        if (err.statusUntil) setStatusUntil(err.statusUntil);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, []);

  const handleSubmitAppeal = async () => {
    if (message.trim().length < 10) {
      setError("El descargo debe tener al menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/appeal", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSent(true);
      if (data.appeal) setExistingAppeal(data.appeal);
    } catch (err: any) {
      setError(err.message || "Error al enviar el descargo.");
    } finally {
      setLoading(false);
    }
  };

  const timeLeft = statusUntil ? formatDistanceToNow(new Date(statusUntil), { locale: es, addSuffix: true }) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-6 border-b border-white/8 flex items-center gap-4 ${isPaused ? "bg-yellow-500/5" : "bg-red-500/5"}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPaused ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
            {isPaused
              ? <ShieldAlert className="w-6 h-6 text-yellow-400" />
              : <ShieldBan className="w-6 h-6 text-red-400" />
            }
          </div>
          <div>
            <h2 className="font-black text-white text-lg">
              {isPaused ? "Cuenta suspendida temporalmente" : "Cuenta bloqueada"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isPaused ? "text-yellow-500/70" : "text-red-500/70"}`}>
                {isPaused ? "Restricción temporal" : "Bloqueo permanente"}
              </p>
              {timeLeft && isPaused && (
                <span className="flex items-center gap-1 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                   Expira {timeLeft}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Motivo de la suspensión */}
          {reason && (
            <div className={`bg-white/3 border rounded-xl p-4 ${isPaused ? "border-yellow-500/10" : "border-red-500/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Motivo de sanción</p>
                {timeLeft && isPaused && (
                  <div className="flex items-center gap-1.5 text-yellow-400/60 font-black text-[9px] uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Tiempo restante: {timeLeft}
                  </div>
                )}
              </div>
              <p className="text-sm text-white/70 font-medium leading-relaxed">{reason}</p>
            </div>
          )}

          {checking ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center animate-pulse">
              <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
              <div className="h-4 w-32 bg-white/5 rounded" />
            </div>
          ) : sent || existingAppeal ? (
            <div className="flex flex-col gap-5 py-2">
              {existingAppeal?.status === 'RESOLVED' ? (
                <div className="text-center space-y-2 pb-2">
                   <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mx-auto text-violet-400 mb-3 rotate-3 shadow-lg shadow-violet-600/20">
                      <Zap className="w-7 h-7" />
                   </div>
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Fallo de administración</h3>
                   <p className="text-sm text-white/40 px-4 leading-tight">
                     Se ha emitido una resolución final sobre tu descargo. Por favor, revisá los motivos y el tiempo restante.
                   </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-400 mb-2">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <p className="font-black text-white text-lg uppercase tracking-tighter italic">Descargo enviado</p>
                  <p className="text-xs text-white/40">Tu descargo está siendo revisado por el equipo de administración.</p>
                </div>
              )}

              {existingAppeal && (
                <div className={`w-full border rounded-3xl p-5 space-y-4 shadow-2xl ${
                  existingAppeal.status === 'RESOLVED' ? 'bg-violet-600/5 border-violet-600/20' : 'bg-white/3 border-white/8'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        existingAppeal.status === 'RESOLVED' ? 'text-violet-400' : 'text-white/30'
                      }`}>
                        {existingAppeal.status === 'RESOLVED' ? 'Resolución Final' : 'Tu mensaje enviado'}
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                        existingAppeal.status === 'PENDING' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                        existingAppeal.status === 'REVIEWED' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                        'text-green-400 bg-green-400/10 border-green-400/20 shadow-green-500/5'
                      }`}>
                        {existingAppeal.status === 'PENDING' ? 'Pendiente' :
                         existingAppeal.status === 'REVIEWED' ? 'En revisión' : 'Resuelto'}
                      </span>
                    </div>

                    {existingAppeal.adminNote ? (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Nota del administrador</p>
                            <p className="text-sm text-white leading-relaxed font-medium">"{existingAppeal.adminNote}"</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <p className="text-sm text-white/40 leading-relaxed italic">"{existingAppeal.message}"</p>
                      </div>
                    )}
                  </div>

                  {/* Contador destacado si está resuelto y hay tiempo */}
                  {statusUntil && isPaused && existingAppeal.status === 'RESOLVED' && (
                    <div className="bg-white text-black rounded-2xl p-4 flex flex-col items-center shadow-xl">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5">Tiempo restante para liberación</p>
                       <p className="text-3xl font-black tabular-nums tracking-tighter">
                         {timeLeft}
                       </p>
                    </div>
                  )}

                  <p className="text-[9px] text-white/20 mt-2 text-center uppercase tracking-[0.2em] font-black italic">
                    Referencia: {existingAppeal.id.slice(0, 8)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white/50">
                Podés enviar un descargo explicando tu situación. El equipo de administración lo revisará y tomará una decisión.
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tu descargo</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explicá brevemente por qué considerás que esta medida es incorrecta…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none transition-colors"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
              <button
                onClick={handleSubmitAppeal}
                disabled={loading || message.trim().length < 10}
                className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar descargo
              </button>
            </div>
          )}

          {/* Si está pausado, puede cerrar el modal */}
          <div className="flex flex-col gap-2 pt-2">
            {isPaused && onClose && (
              <button
                onClick={onClose}
                className="w-full text-center text-xs text-white/25 hover:text-white/40 transition-colors py-1"
              >
                Cerrar por ahora (acceso muy limitado mientras esté suspendido)
              </button>
            )}
            <div className="pt-2 border-t border-white/5 flex justify-center">
              <Link 
                href="/terms" 
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-white/3 text-[11px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-all group"
              >
                <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" /> 
                Ver términos y condiciones de uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
