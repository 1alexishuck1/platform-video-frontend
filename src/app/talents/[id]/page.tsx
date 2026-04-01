"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Clock, Star, Zap, Video, ShieldCheck, 
  ChevronLeft, Loader2, Users, ArrowUpRight 
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore, useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { TalentProfile } from "@/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();
  
  // This profile page allows fans to join the virtual queue or book future slots. (Live Profile Feature)
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTalent = async () => {
      try {
        const data = await apiFetch(`/talents/${id}`);
        setTalent(data.talent);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTalent();
  }, [id]);



  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen pb-20">
        <Navbar />
        <div className="h-48 md:h-64 bg-violet-950/20 w-full" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <div className="glass rounded-3xl p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-5 md:gap-6">
                <Skeleton className="w-28 h-28 md:w-40 md:h-40 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-48 rounded-xl" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-40 rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
            <div className="w-full md:w-96 shrink-0 md:-mt-32">
              <Skeleton className="h-96 w-full rounded-3xl shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Talento no encontrado
      </div>
    );
  }

  // Derived fields to support both real API (camelCase) and mock (snake_case)
  const stageName = talent.stageName || talent.stage_name;
  const avatarUrl = talent.avatarUrl || talent.avatar_url;
  const priceUsd = talent.priceUsd || talent.price_usd;
  const durationMin = talent.sessionDurationMin || Math.floor((talent.session_duration_sec || 0) / 60);



  const handleJoinQueue = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsBooking(true);
    try {
      const data = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          talentId: talent!.id,
          durationMin: durationMin,
          priceUsd: priceUsd,
          startsAt: null // No startsAt means join queue
        }),
      });
      toast.success("¡Ya estás en la cola virtual!");
      router.push(`/bookings/${data.booking.id}/call`);
    } catch (err: any) {
      toast.error(err.message || "Error al unirse a la cola");
    } finally {
      setIsBooking(false);
    }
  };



  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-violet-900/40 via-card to-pink-900/20 w-full relative">
        <button 
          onClick={() => router.back()} 
          className="absolute top-20 md:top-24 left-4 sm:left-8 glass rounded-full p-2 hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 md:-mt-32">
          
          {/* Main info */}
          <div className="flex-1">
            <div className="glass rounded-3xl p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-5 md:gap-6 shadow-2xl">
              <img
                src={avatarUrl}
                alt={stageName}
                className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-card bg-card shadow-lg object-cover"
              />
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{stageName}</h1>
                  <span className="glass px-3 py-1 rounded-full text-xs text-violet-300 font-medium tracking-wide">
                    {talent.category}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <span className="font-semibold">{talent.rating || 4.9}</span>
                    <span className="opacity-70">({talent.total_sessions || 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span>{durationMin} min / sesión</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Acerca de {stageName}</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {talent.bio}
              </p>
            </div>
            
            {/* Features trust indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
              {[
                { icon: ShieldCheck, text: "Identidad verificada" },
                { icon: Video, text: "Llamada 1 a 1 HD" },
                { icon: Zap, text: "Reserva instantánea" },
                { icon: Clock, text: "Temporizador exacto" },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 glass rounded-xl text-center gap-2">
                  <f.icon className="w-6 h-6 text-violet-400" />
                  <span className="text-xs font-medium text-muted-foreground">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Widget */}
          <div className="w-full md:w-96 shrink-0">
            <div className="glass rounded-3xl p-6 sticky top-24 shadow-2xl border-white/10">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/5">
                <div>
                  <div className="text-3xl font-bold gradient-text">${priceUsd}</div>
                  <div className="text-sm text-muted-foreground mt-1">Por {durationMin} minutos</div>
                </div>
                {talent.isLive ? (
                  <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full" /> En vivo
                  </div>
                ) : (
                  <div className="bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold">
                    <Zap className="w-3 h-3" /> Disponible
                  </div>
                )}
              </div>

              {talent.isLive ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <p className="text-sm font-medium text-center">
                      {stageName} está en vivo ahora mismo. Entrá a la sala de espera para hablar en unos minutos.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {talent.queueCount || 0} en espera</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{(talent.queueCount || 0) * durationMin} min</span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger 
                      render={
                        <Button 
                          className="w-full btn-gradient text-white border-0 py-6 text-xl font-black rounded-[1.5rem] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                          Entrar a la sala de espera <ArrowUpRight className="w-6 h-6" />
                        </Button>
                      }
                    />
                    <DialogContent className="glass border-white/10 sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Unirse a la sala de espera</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center p-6 rounded-2xl bg-black/40 border border-white/5">
                          <div className="flex items-center gap-4">
                            <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/20" />
                            <div>
                              <p className="font-bold text-lg">{stageName}</p>
                              <p className="text-xs text-muted-foreground">Videollamada en vivo ({durationMin} min)</p>
                            </div>
                          </div>
                          <div className="font-black text-2xl text-violet-300">${priceUsd}</div>
                        </div>

                        <div className="bg-violet-500/10 text-violet-300 p-4 rounded-2xl text-sm flex gap-3 items-start mt-4">
                          <ShieldCheck className="w-6 h-6 shrink-0 text-violet-400" />
                          <p>
                            Al unirte, entrarás en una sala de espera virtual. Cuando sea tu turno, recibirás una notificación y la videollamada comenzará automáticamente.
                          </p>
                        </div>

                        <Button 
                          onClick={handleJoinQueue} 
                          disabled={isBooking}
                          className="w-full btn-gradient mt-6 text-white h-14 rounded-xl font-bold text-lg"
                        >
                          {isBooking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                          {isBooking ? "Procesando..." : "Entrar a la sala de espera"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Actualmente offline</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stageName} no está recibiendo llamadas en este momento. Volvé cuando esté en vivo.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-white/10 text-muted-foreground hover:text-white"
                    onClick={() => toast.info("Te avisaremos la próxima vez que esté en vivo (simulado)")}
                  >
                    Notificarme cuando esté en vivo
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
