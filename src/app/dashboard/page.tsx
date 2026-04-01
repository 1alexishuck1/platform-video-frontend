"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Video, CheckCircle2, Loader2, Zap, Users } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { useAuthStore, useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { Booking } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function FanDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const success = searchParams.get("success");
  const queued = searchParams.get("queued");

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Clear params from URL to avoid re-showing on refresh
    if (success || queued) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("queued");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isAuthenticated, isHydrated, router, success, queued]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadBookings = async () => {
        try {
          const data = await apiFetch("/bookings/me");
          setBookings(data.bookings);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      loadBookings();
      
      const poll = setInterval(loadBookings, 10000);
      return () => clearInterval(poll);
    }
  }, [isAuthenticated]);

  const skeleton = (
    <div className="space-y-12">
      <div className="space-y-4">
          <div className="h-10 w-64 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-5 w-80 rounded-sm bg-white/5 animate-pulse" />
      </div>
      <div className="grid gap-6">
          <div className="h-40 w-full rounded-3xl bg-white/5 animate-pulse" />
          <div className="h-40 w-full rounded-3xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );

  if (!isHydrated || isLoading) return skeleton;
  if (isHydrated && !isAuthenticated) return null;

  // Split bookings by status for the UI
  const inQueue = bookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    const isTalentLive = b.talent?.isLive || false;
    return (status === "WAITING_IN_QUEUE" || status === "IN_PROGRESS") && isTalentLive;
  });

  const upcoming = bookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    if (status === "WAITING_IN_QUEUE" || status === "IN_PROGRESS") return false;
    
    const startsAtStr = b.startsAt || b.starts_at;
    if (!startsAtStr) return false;

    const startsAt = new Date(startsAtStr);
    const duration = b.durationSec || b.duration_sec || 0;
    const endsAt = new Date(startsAt.getTime() + duration * 1000);
    
    // Only show as upcoming if it hasn't finished yet and isn't cancelled
    return endsAt > new Date() && status !== "CANCELLED";
  });

  const past = bookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    if (status === "WAITING_IN_QUEUE" || status === "IN_PROGRESS") return false;

    const startsAtStr = b.startsAt || b.starts_at;
    if (!startsAtStr) return true; // Legacy case or error

    const startsAt = new Date(startsAtStr);
    const duration = b.durationSec || b.duration_sec || 0;
    const endsAt = new Date(startsAt.getTime() + duration * 1000);

    return endsAt <= new Date() || status === "CANCELLED" || status === "COMPLETED";
  });

  return (
    <>
      {success && (
        <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">¡Reserva confirmada con éxito! Te enviaremos un recordatorio antes de la sesión.</p>
        </div>
      )}

      {queued && (
        <div className="mb-8 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Zap className="w-5 h-5 shrink-0 animate-pulse text-violet-400" />
          <p className="font-medium text-sm">¡Te uniste a la cola virtual! Podrás ver tu posición abajo. Quedate cerca para no perder tu turno.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-black">Mis sesiones</h1>
          <p className="text-muted-foreground mt-2 font-medium">Gestioná tus encuentros en vivo y tu historial.</p>
        </div>
        <Link 
          href="/"
          className={cn(buttonVariants(), "btn-gradient text-white border-0 gap-2")}
        >
          <Video className="w-4 h-4" /> Buscar talentos
        </Link>
      </div>

      <div className="space-y-12">
        {/* Cola Virtual */}
        {inQueue.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-red-500 rounded-full animate-pulse" />
              En cola ahora ({inQueue.length})
            </h2>
            <div className="grid gap-4">
              {inQueue.map((booking) => (
                <div key={booking.id} className="p-1 rounded-3xl bg-gradient-to-r from-violet-600/20 to-pink-600/20">
                  <div className="glass rounded-[1.4rem] p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                      <img 
                        src={booking.talent?.avatarUrl || booking.talent?.avatar_url} 
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white/5"
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl uppercase">LIVE</div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black mb-1">{booking.talent?.stageName || booking.talent?.stage_name}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                         <span className="text-violet-300 font-bold flex items-center gap-1.5">
                            <Users className="w-4 h-4" /> Posición: {booking.status === "in_progress" ? "¡Tu turno!" : "En espera..."}
                         </span>
                         <span className="text-muted-foreground text-sm flex items-center gap-1.5 border-l border-white/10 pl-4">
                            <Clock className="w-4 h-4" /> {Math.floor((booking.durationSec || booking.duration_sec || 0) / 60)} min contratados
                         </span>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      <Link href={`/bookings/${booking.id}/call`}>
                        <Button 
                          className={cn(
                            "w-full h-14 px-8 rounded-2xl font-black text-lg transition-all",
                            booking.status === "in_progress" 
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce" 
                              : "btn-gradient text-white border-0 opacity-80"
                          )}
                        >
                          {booking.status === "in_progress" ? "¡Ingresar ya!" : "Ver mi lugar"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Only show if there are future-dated legacy bookings (before pivot) */}
        {upcoming.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" /> 
              Videollamadas agendadas ({upcoming.length})
            </h2>
            <div className="grid gap-4">
              {upcoming.map((booking) => (
                <Link href={`/bookings/${booking.id}`} key={booking.id} className="block group">
                  <div className="glass card-hover rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center gap-4 md:gap-5 border border-white/5">
                    <img 
                      src={booking.talent?.avatarUrl || booking.talent?.avatar_url} 
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-card shadow-sm object-cover"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-violet-300 transition-colors">
                        {booking.talent?.stageName || booking.talent?.stage_name}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-violet-400" />
                          {format(new Date(booking.startsAt || booking.starts_at), "dd 'de' MMM, HH:mm", { locale: es })} hs
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          {Math.floor((booking.durationSec || booking.duration_sec || 0) / 60)} min
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center sm:items-end gap-3 mt-4 sm:mt-0 shrink-0">
                      <BookingStatusBadge status={booking.status} />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 w-full sm:w-auto"
                      >
                        Ver detalle →
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for new users */}
        {inQueue.length === 0 && upcoming.length === 0 && !isLoading && (
          <div className="glass rounded-[2.5rem] p-16 text-center border-dashed border-2 border-white/5 animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
               <Video className="w-10 h-10 text-muted-foreground/30" />
             </div>
             <h3 className="text-2xl font-bold mb-2">No tenés sesiones activas</h3>
             <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium leading-relaxed">
               Unite a la cola de tu talento favorito cuando esté en vivo para empezar a hablar.
             </p>
             <Link 
               href="/"
               className={cn(buttonVariants({ size: "lg" }), "btn-gradient text-white border-0 px-10 h-14 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all")}
             >
               Explorar talentos en vivo
             </Link>
          </div>
        )}

        {/* Historial */}
        <section className="pt-8 border-t border-white/5">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-muted-foreground/60">
            <Clock className="w-5 h-5" /> 
            Historial de sesiones ({past.length})
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {past.map((booking: any) => (
              <div key={booking.id} className="glass rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                <img src={booking.talent?.avatarUrl || booking.talent?.avatar_url} className="w-10 h-10 rounded-full grayscale object-cover" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-medium">{booking.talent?.stageName || booking.talent?.stage_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(booking.startsAt || booking.starts_at), "dd MMM, yyyy", { locale: es })}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} size="sm" />
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}

export default function FanDashboard() {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <main className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="space-y-12">
            <div className="space-y-4">
               <Skeleton className="h-10 w-64 rounded-xl" />
               <Skeleton className="h-5 w-80 rounded-xl" />
            </div>
            <div className="grid gap-6">
               <Skeleton className="h-32 w-full rounded-3xl" />
               <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          </div>
        }>
          <FanDashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
