"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, isFuture, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Video, Calendar, Clock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push("/login");

    const loadBooking = async () => {
      try {
        const data = await apiFetch(`/bookings/${id}`);
        setBooking(data.booking);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) loadBooking();
  }, [id, isAuthenticated, isHydrated, router]);

  if (loading || !isHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
        <p className="text-lg font-medium">Reserva no encontrada</p>
        <Link href="/dashboard">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(booking.startsAt);
  const durationSec = booking.durationSec || 0;
  const endDate = new Date(startDate.getTime() + durationSec * 1000);
  const now = new Date();
  
  const status = (booking.status || "").toUpperCase();
  const isCancelled = status === "CANCELLED";
  
  // Can join if: Not cancelled AND (It's about to start <5min OR It's currently happening)
  const isBefore = now < startDate;
  const isDuring = now >= startDate && now <= endDate;
  const isAfter = now > endDate;

  const minsToStart = differenceInMinutes(startDate, now);
  const canJoin = !isCancelled && ((isBefore && minsToStart <= 5) || isDuring);
  const hasEnded = isAfter || status === "COMPLETED";

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Volver a mis reservas
        </button>

        <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-900/30 to-pink-900/10 p-8 border-b border-white/5 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <img 
                src={booking.talent?.avatarUrl || booking.talent?.avatar_url} 
                className="w-24 h-24 rounded-full border-4 border-card shadow-lg object-cover"
              />
              <div>
                <p className="text-violet-300 text-sm font-semibold mb-1 uppercase tracking-wider">
                  Videollamada • {Math.floor(booking.durationSec / 60)} min
                </p>
                <h1 className="text-3xl font-bold">{booking.talent?.stageName || booking.talent?.stage_name}</h1>
                <p className="text-muted-foreground mt-2 max-w-md text-sm line-clamp-3">
                  {booking.talent?.bio || "Experiencia exclusiva 1 a 1."}
                </p>
              </div>
            </div>
            
            <div className="shrink-0">
              <BookingStatusBadge status={booking.status} size="md" />
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-8">
            {/* Info */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b border-white/5 pb-2">Detalles de la sesión</h3>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Fecha programada</p>
                  <p className="font-semibold text-lg text-white">{format(startDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                  <p className="text-sm text-foreground/80 mt-1 capitalize">{format(startDate, "yyyy")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Horario local</p>
                  <p className="font-semibold text-lg text-white">
                    {format(startDate, "HH:mm")} hs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-2xl text-muted-foreground">
                  <span className="font-bold text-xl leading-none">$$</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Monto de la reserva</p>
                  <p className="font-semibold text-lg text-white">${booking.priceUsd} USD</p>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col justify-center text-center">
              {!hasEnded ? (
                <>
                  <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Video className="w-8 h-8 text-violet-400 relative z-10" />
                    {canJoin && <div className="absolute inset-0 bg-violet-500/30 rounded-full animate-ping" />}
                  </div>
                  
                  <h3 className="font-bold text-xl mb-2">Sala Privada</h3>
                  
                  {canJoin ? (
                    <div className="space-y-4">
                      <p className="text-sm text-violet-200">
                        {isDuring ? "¡La sesión está en curso! Entrá ahora para aprovechar el tiempo restante." : "¡La sala está abierta! Ya podés ingresar."}
                      </p>
                      <Link href={`/bookings/${booking.id}/call`}>
                        <Button size="lg" className="w-full btn-gradient py-6 text-lg font-bold shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-pulse hover:animate-none">
                          Entrar a la videollamada
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        El botón se habilitará 5 minutos antes del inicio programado.
                      </p>
                      <div className="bg-white/5 py-4 rounded-xl text-center">
                        <span className="text-2xl font-mono font-medium tracking-widest text-violet-300">
                          {minsToStart > 60 
                            ? `> ${Math.floor(minsToStart / 60)} hs` 
                            : `${minsToStart} min`}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Para habilitar</p>
                      </div>
                      <Button size="lg" disabled className="w-full py-6 text-lg border-white/10 bg-white/5 text-muted-foreground">
                        Sala cerrada
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Sesión finalizada</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta videollamada de {booking.durationSec / 60} min ya ocurrió y no puede volver a abrirse.
                  </p>
                  <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5 w-full">
                    Solicitar soporte
                  </Button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
