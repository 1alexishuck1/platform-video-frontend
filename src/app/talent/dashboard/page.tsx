"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users, Zap, Calendar, ArrowUpRight,
  Video, DollarSign, Star, Loader2, Activity, VideoOff, Clock, Play
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { useHydratedAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export default function TalentDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, isHydrated } = useHydratedAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [togglingLive, setTogglingLive] = useState(false);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
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
          setIsLive(json.isLive);
        }
      } catch (err) {
        console.error("Error fetching talent dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboard();
  }, [isHydrated, isAuthenticated, user, token, router]);

  const handleToggleLive = async () => {
    setTogglingLive(true);
    const nextStatus = !isLive;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/toggle-live`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isLive: nextStatus })
      });
      if (res.ok) {
        const json = await res.json();
        const updatedStatus = json.profile.isLive;
        setIsLive(updatedStatus);

        if (updatedStatus) {
          toast.success("¡Ahora estás en vivo! Entrando al estudio...");
          router.push("/talent/live");
        } else {
          toast.success("Sesión en vivo finalizada");
        }
      }
    } catch (err) {
      toast.error("Error al cambiar estado");
    } finally {
      setTogglingLive(false);
    }
  };

  const allBookings = data?.bookings || [];
  const history = allBookings.filter((b: any) => {
    const status = (b.status || "").toUpperCase();
    return status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";
  });

  const stats = data?.stats || { totalRevenue: 0, totalSessions: 0 };
  const queue = data?.queue || [];
  const waitingInQueue = queue.filter((b: any) => b.status === "WAITING_IN_QUEUE");

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
            <div className="space-y-4 w-1/2">
              <div className="h-10 w-full bg-white/5 animate-pulse rounded-full" />
              <div className="h-5 w-3/4 bg-white/5 animate-pulse rounded-full" />
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-white/5 animate-pulse rounded-2xl" />
              <div className="h-12 w-40 bg-white/5 animate-pulse rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 w-full bg-white/5 animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="h-40 w-full bg-white/5 animate-pulse rounded-[2rem]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <main className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">¡Hola, {user?.name}!</h1>
            <p className="text-muted-foreground mt-2">Acá tenés un resumen real de tu actividad y ganancias.</p>
          </div>
          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
            {isLive && (
              <Link href="/talent/live">
                <Button
                  className="h-12 px-8 rounded-2xl font-black bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] gap-2"
                >
                  <Activity className="w-4 h-4" /> Ir al estudio
                </Button>
              </Link>
            )}
            <Button
              onClick={handleToggleLive}
              disabled={togglingLive}
              className={cn(
                "h-12 px-8 rounded-2xl font-bold transition-all shadow-xl gap-2",
                isLive
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30"
                  : "bg-green-500 hover:bg-green-600 text-white border-0"
              )}
            >
              {togglingLive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLive ? (
                <div className="flex items-center gap-2"><VideoOff className="w-4 h-4" /> Finalizar en vivo</div>
              ) : (
                <div className="flex items-center gap-2 font-black"><Zap className="w-4 h-4 fill-white" /> ¡Transmitir en vivo!</div>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Ganancias totales", value: `$${stats.totalRevenue}`, icon: DollarSign, color: "text-green-400" },
            { label: "Sesiones completadas", value: stats.totalSessions, icon: Users, color: "text-violet-400" },
            { label: "Estado actual", value: isLive ? "EN VIVO" : "OFFLINE", icon: Video, color: isLive ? "text-red-400" : "text-muted-foreground" },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-between transition-all hover:border-white/10 group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <div className={cn("p-2 rounded-xl bg-white/5", stat.color)}>
                  <stat.icon className="w-5 h-5 opacity-90" />
                </div>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white relative z-10">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Live Session Summaries */}
        {data?.liveSessions?.length > 0 && (
          <section className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 mb-20">
            <div className="flex items-center justify-between mb-8 px-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Resumen de vivos finalizados
              </h2>
              <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40">
                Últimos {data.liveSessions.length}
              </span>
            </div>

            <div className="grid gap-6">
              {data.liveSessions.map((session: any) => {
                const durationMs = session.endsAt ? new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime() : 0;
                const durationMin = Math.floor(durationMs / 60000);
                const durationSec = Math.floor((durationMs % 60000) / 1000);

                return (
                  <div key={session.id} className="glass rounded-[2rem] p-6 pr-10 border border-white/5 hover:border-white/10 transition-all group flex items-center gap-8 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-violet-600 opacity-20 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -right-20 -top-20 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl group-hover:bg-violet-600/10 transition-all" />

                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 relative z-10">
                      {/* Date & Time */}
                      <div className="flex items-center gap-4 min-w-[240px]">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-violet-400 border border-white/10 group-hover:bg-violet-500/10 group-hover:scale-105 transition-all">
                          <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-base font-black text-white uppercase tracking-tighter">
                            {format(new Date(session.startsAt), "eeee d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {format(new Date(session.startsAt), "HH:mm")} - {session.endsAt ? format(new Date(session.endsAt), "HH:mm") : "Sin finalizar"}
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="flex flex-wrap items-center gap-8 sm:gap-16">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Participantes</span>
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-2xl font-black text-white tabular-nums">{session.totalParticipants}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Duración total</span>
                          <div className="flex items-center gap-2.5">
                            <Activity className="w-4 h-4 text-orange-400" />
                            <span className="text-2xl font-black text-white tabular-nums">{durationMin}m {durationSec}s</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Ganancia sesión</span>
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <span className="text-2xl font-black text-green-400 tabular-nums">${session.totalRevenue}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden xl:flex flex-col items-end opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
