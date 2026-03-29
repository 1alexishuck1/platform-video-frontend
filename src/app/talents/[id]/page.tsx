"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Star, Zap, Video, ShieldCheck, ChevronLeft, Loader2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthStore, useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { TalentProfile } from "@/types";
import { cn } from "@/lib/utils";

export default function TalentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();
  
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

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

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !id) return;
      setIsLoadingSlots(true);
      setSelectedTime(null);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const data = await apiFetch(`/bookings/available-slots?talentId=${id}&date=${dateStr}`);
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error("Error fetching slots", err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, id]);

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
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

  // Generate next 7 days for the picker
  const upcomingDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsBooking(true);
    try {
      // Create real booking in DB
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          startsAt: selectedTime, // selectedTime is now the full ISO string
          talentId: talent!.id,
          durationMin: durationMin,
          priceUsd: priceUsd
        }),
      });
      router.push("/dashboard?success=true");
    } catch (err: any) {
      alert(err.message || "Error al realizar la reserva");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      {/* Cover */}
      <div className="h-56 md:h-80 bg-gradient-to-br from-violet-900/40 via-card to-pink-900/20 w-full relative">
        <button 
          onClick={() => router.back()} 
          className="absolute top-20 md:top-24 left-4 sm:left-8 glass rounded-full p-2 hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
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
          <div className="w-full md:w-96 shrink-0 md:-mt-32">
            <div className="glass rounded-3xl p-6 sticky top-24 shadow-2xl border-white/10">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/5">
                <div>
                  <div className="text-3xl font-bold gradient-text">${priceUsd}</div>
                  <div className="text-sm text-muted-foreground mt-1">Por {durationMin} minutos</div>
                </div>
                <div className="bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold">
                  <Zap className="w-3 h-3" /> Disponible
                </div>
              </div>

              {/* Fake calendar picker */}
              <div className="space-y-4 mb-6">
                <label className="text-sm font-semibold">1. Elige una fecha</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                  {upcomingDays.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-2xl border transition-all ${
                        selectedDate === date
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                          : "border-white/10 hover:border-white/20 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs font-medium uppercase">{format(date, "EEE", { locale: es })}</span>
                      <span className="text-xl font-bold mt-1 text-foreground">{format(date, "d")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4">
                  <label className="text-sm font-semibold">2. Elige un horario</label>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center p-8">
                       <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-white/5 p-4 rounded-xl border border-white/5 italic">
                      No hay horarios disponibles para este día.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className={cn(
                        "grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300",
                        showAllSlots ? "max-h-[500px]" : "max-h-[100px]"
                      )}>
                        {availableSlots.map((slot) => {
                          const timeLabel = format(new Date(slot), "HH:mm");
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                                selectedTime === slot
                                  ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                                  : "border-white/10 hover:border-white/20 text-muted-foreground"
                              }`}
                            >
                              {timeLabel}
                            </button>
                          );
                        })}
                      </div>
                      
                      {availableSlots.length > 4 && (
                        <button 
                          onClick={() => setShowAllSlots(!showAllSlots)}
                          className="w-full py-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors border border-dashed border-violet-500/30 rounded-xl"
                        >
                          {showAllSlots ? "Ver menos" : `Ver ${availableSlots.length - 4} horarios más`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Dialog>
                <DialogTrigger 
                  disabled={!selectedDate || !selectedTime}
                  className="w-full btn-gradient text-white border-0 py-6 text-lg font-bold disabled:opacity-50 inline-flex items-center justify-center rounded-lg hover:brightness-110 mb-2 transition-all"
                >
                  Reservar ahora
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold text-sm">{stageName}</p>
                          <p className="text-xs text-muted-foreground">Videollamada ({durationMin} min)</p>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-violet-300">${priceUsd}</div>
                    </div>

                    {selectedDate && selectedTime && (
                      <div className="p-4 rounded-xl border border-white/5 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span className="font-medium">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hora:</span>
                          <span className="font-medium">{format(new Date(selectedTime), "HH:mm")} hs</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl text-xs flex gap-2 items-start mt-4">
                      <ShieldCheck className="w-8 h-8 shrink-0" />
                      <p>Para el MVP, se simulará el pago. Al aceptar, la reserva se confirmará automáticamente.</p>
                    </div>

                    <Button 
                      onClick={handleBook} 
                      disabled={isBooking}
                      className="w-full btn-gradient mt-4 text-white"
                    >
                      {isBooking ? "Procesando pago..." : "Confirmar y pagar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
