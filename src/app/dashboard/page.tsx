"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Video, CheckCircle2, Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Clear success param from URL to avoid re-showing on refresh
    if (success) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isAuthenticated, isHydrated, router, success]);

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
    }
  }, [isAuthenticated]);

  if (!isHydrated || !isAuthenticated || !user) return null;

  // Split bookings by status for the UI
  // Handle both snake_case (mock) and camelCase (real)
  const upcoming = bookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    const startsAt = new Date(b.starts_at);
    const duration = b.duration_sec || 0;
    const endsAt = new Date(startsAt.getTime() + duration * 1000);
    
    // Only show as upcoming if it hasn't finished yet and isn't cancelled
    return endsAt > new Date() && status !== "CANCELLED";
  });
  const past = bookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    const startsAt = new Date(b.starts_at);
    const duration = b.duration_sec || 0;
    const endsAt = new Date(startsAt.getTime() + duration * 1000);

    return endsAt <= new Date() || status === "CANCELLED" || status === "COMPLETED";
  });

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {success && (
          <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">¡Reserva confirmada con éxito! Te enviaremos un recordatorio antes de la sesión.</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Mis Reservas</h1>
            <p className="text-muted-foreground mt-2">Gestioná tus videollamadas programadas.</p>
          </div>
          <Link 
            href="/talents"
            className={cn(buttonVariants(), "btn-gradient text-white border-0 gap-2")}
          >
            <Video className="w-4 h-4" /> Buscar talentos
          </Link>
        </div>

        <div className="space-y-12">
          {/* Próximas */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" /> 
              Próximas videollamadas ({upcoming.length})
            </h2>
            
            <div className="grid gap-4">
              {isLoading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : upcoming.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center text-muted-foreground border-dashed border-2 text-sm">
                  No tenés reservas próximas. ¡Empezá explorando talentos!
                </div>
              ) : (
                upcoming.map((booking) => (
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
                            {format(new Date(booking.starts_at), "dd 'de' MMM, HH:mm", { locale: es })} hs
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-violet-400" />
                            {Math.floor((booking.duration_sec || 0) / 60)} min
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
                ))
              )}
            </div>
          </section>

          {/* Historial */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" /> 
              Historial ({past.length})
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {past.map((booking: any) => (
                <div key={booking.id} className="glass rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                  <img src={booking.talent?.avatarUrl || booking.talent?.avatar_url} className="w-10 h-10 rounded-full grayscale object-cover" />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-medium">{booking.talent?.stageName || booking.talent?.stage_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(booking.starts_at), "dd MMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} size="sm" />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default function FanDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
      <FanDashboardContent />
    </Suspense>
  );
}
