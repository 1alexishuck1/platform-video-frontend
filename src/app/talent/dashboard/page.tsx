"use client";
import { io } from "socket.io-client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  TrendingUp, Users, Clock, Zap, Calendar, ArrowUpRight, 
  Video, DollarSign, Star, Loader2 
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { useHydratedAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, isHydrated } = useHydratedAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isTalent = user?.role?.toLowerCase() === "talent";
    if (isHydrated && (!isAuthenticated || !isTalent)) {
      router.push("/");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/dashboard`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching talent dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboard();

    // Real-time updates
    if (token && user?.id) {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
      socket.emit("join-talent-updates", user.id);
      
      socket.on("new-booking", () => {
        fetchDashboard(); // Re-fetch all data when a new booking happens
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isHydrated, isAuthenticated, user, token, router]);

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen pb-20">
        <Navbar />
        <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
          {/* List Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-64 rounded-full" />
            {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // Filter bookings based on current time
  const allBookings = data?.bookings || [];
  const upcoming = allBookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    const startsAt = new Date(b.startsAt);
    const endsAt = new Date(startsAt.getTime() + b.durationSec * 1000);
    return endsAt > new Date() && status !== "CANCELLED";
  });
  const past = allBookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    const startsAt = new Date(b.startsAt);
    const endsAt = new Date(startsAt.getTime() + b.durationSec * 1000);
    return endsAt <= new Date() || status === "CANCELLED" || status === "COMPLETED";
  });
  
  const stats = data?.stats || { totalRevenue: 0, totalSessions: 0, rating: 5.0 };

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-3xl sm:text-4xl font-bold">¡Hola, {user?.name}!</h1>
            <p className="text-muted-foreground mt-2">Acá tenés un resumen real de tu actividad y ganancias.</p>
          </div>
          <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <Link href="/talent/agenda">
              <Button variant="outline" className="border-white/10 glass gap-2 text-muted-foreground hover:text-foreground h-12 px-6 rounded-2xl">
                <Calendar className="w-4 h-4 text-violet-400" /> Mi Agenda
              </Button>
            </Link>
            <Link href="/talent/edit">
              <Button className="btn-gradient text-white border-0 gap-2 h-12 px-6 rounded-2xl shadow-xl">
                <Star className="w-4 h-4" /> Editar Perfil
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Ganancias totales", value: `$${stats.totalRevenue}`, icon: DollarSign, color: "text-green-400" },
            { label: "Sessions reservadas", value: stats.totalSessions, icon: Users, color: "text-violet-400" },
            { label: "Rating", value: stats.rating, icon: Star, color: "text-yellow-400" },
            { label: "Próximas videocalls", value: upcoming.length, icon: Video, color: "text-pink-400" },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-[2rem] p-8 border border-white/5 flex flex-col justify-between transition-all hover:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <div className={cn("p-2 rounded-xl bg-white/5", stat.color)}>
                  <stat.icon className="w-5 h-5 opacity-90" />
                </div>
              </div>
              <h2 className="text-4xl font-black font-mono tracking-tight text-white">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Up Next List */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-1.5 h-8 bg-violet-600 rounded-full" />
              Próximas videollamadas
            </h2>
          </div>
          
          <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            {upcoming.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-white/5">
                   <Calendar className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  No tenés reservas próximas. Asegurate de que tu agenda tenga slots públicos.
                </p>
                <Link href="/talent/agenda">
                   <Button variant="link" className="text-violet-400">Configurar mi agenda ahora</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {upcoming.map((booking: any) => (
                  <div key={booking.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-5 flex-1 w-full">
                      {booking.fan?.avatarUrl ? (
                        <img src={booking.fan.avatarUrl} className="w-14 h-14 rounded-full border-2 border-violet-500/20 object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-violet-600/10 text-violet-400 flex items-center justify-center font-bold border border-violet-500/20 text-lg">
                          {booking.fan?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-lg group-hover:text-violet-300 transition-colors">
                          {booking.fan?.name || "Fan Anónimo"}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full text-white font-medium border border-white/5">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            {format(new Date(booking.startsAt), "dd 'de' MMM, HH:mm", { locale: es })} hs
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {Math.floor(booking.durationSec / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <BookingStatusBadge status={booking.status.toLowerCase()} />
                      <div className="font-mono text-xl font-black text-white px-4 border-l border-white/10 tracking-tight">
                        ${booking.priceUsd}
                      </div>
                      <Link href={`/bookings/${booking.id}/call`} className="shrink-0">
                        <Button className="btn-gradient border-0 gap-2 h-12 px-6 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                          Ir a la sala <ArrowUpRight className="w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Past Sessions List */}
        {past.length > 0 && (
          <section className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-6 text-muted-foreground">
              Historial de videollamadas
            </h2>
            <div className="glass rounded-[2rem] overflow-hidden border border-white/5 opacity-80">
              <div className="divide-y divide-white/5">
                {past.map((booking: any) => (
                  <div key={booking.id} className="p-4 px-6 flex items-center gap-6 hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center font-bold text-xs uppercase">
                        {booking.fan?.name?.slice(0, 2) || "FA"}
                      </div>
                      <div>
                        <p className="font-medium text-white/80">{booking.fan?.name || "Fan Anónimo"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.startsAt), "dd MMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <BookingStatusBadge status={booking.status.toLowerCase()} size="sm" />
                    <div className="text-sm font-bold text-white/60">${booking.priceUsd}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
