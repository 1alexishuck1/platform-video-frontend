"use client";

import { useState, useEffect } from "react";
import { useHydratedAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, Plus, Trash2, Save, Loader2, 
  LayoutDashboard, Star, User, Info, CheckCircle2, Copy, Check, MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const DAYS = [
  { id: 1, name: "Lun", fullName: "Lunes" },
  { id: 2, name: "Mar", fullName: "Martes" },
  { id: 3, name: "Mié", fullName: "Miércoles" },
  { id: 4, name: "Jue", fullName: "Jueves" },
  { id: 5, name: "Vie", fullName: "Viernes" },
  { id: 6, name: "Sáb", fullName: "Sábado" },
  { id: 0, name: "Dom", fullName: "Domingo" },
];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function TalentAgendaPage() {
  const { user, token, isAuthenticated, isHydrated } = useHydratedAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([]);

  // Batch states
  const [selectedBatchDays, setSelectedBatchDays] = useState<number[]>([]);
  const [batchStart, setBatchStart] = useState("09:00");
  const [batchEnd, setBatchEnd] = useState("12:00");

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== "TALENT" && user?.role !== "talent")) {
      router.push("/");
      return;
    }

    const fetchAvailability = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/availability`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailabilities(data.availabilities || []);
        }
      } catch (err) {
        console.error("Error fetching availability", err);
      } finally {
        setFetching(false);
      }
    };

    if (token) fetchAvailability();
  }, [isHydrated, isAuthenticated, user, token, router]);

  const addSlot = (dayOfWeek: number, start = "09:00", end = "12:00") => {
    setAvailabilities([...availabilities, { dayOfWeek, startTime: start, endTime: end }]);
  };

  const removeSlot = (index: number) => {
    setAvailabilities(availabilities.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newAvailabilities = [...availabilities];
    newAvailabilities[index] = { ...newAvailabilities[index], [field]: value };
    setAvailabilities(newAvailabilities);
  };

  const applyBatch = () => {
    if (selectedBatchDays.length === 0) return;
    
    // Clean days and add new batch
    const filtered = availabilities.filter(a => !selectedBatchDays.includes(a.dayOfWeek));
    const newSlots = selectedBatchDays.map(day => ({
      dayOfWeek: day,
      startTime: batchStart,
      endTime: batchEnd
    }));
    
    setAvailabilities([...filtered, ...newSlots]);
    setSelectedBatchDays([]);
  };

  const copyToAll = (fromDay: number) => {
    const sourceSlots = availabilities.filter(a => a.dayOfWeek === fromDay);
    if (sourceSlots.length === 0) return;

    let newAvailabilities = [...availabilities];
    DAYS.forEach(day => {
      if (day.id === fromDay) return;
      // Remove old
      newAvailabilities = newAvailabilities.filter(a => a.dayOfWeek !== day.id);
      // Add source copies
      sourceSlots.forEach(s => {
        newAvailabilities.push({ ...s, dayOfWeek: day.id });
      });
    });
    setAvailabilities(newAvailabilities);
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ availabilities })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error updating availability", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatchDay = (id: number) => {
    setSelectedBatchDays(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  if (!isHydrated || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-4">
            <div className="p-4 rounded-3xl glass-card border border-white/10 flex flex-col items-start gap-4 h-fit">
              <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest px-2">Talent Center</h2>
              <nav className="w-full space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl text-muted-foreground hover:bg-white/5" onClick={() => router.push('/talent/dashboard')}><LayoutDashboard className="w-4 h-4 text-violet-500" /> Dashboard</Button>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><Calendar className="w-4 h-4" /> Mi Agenda</Button>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl text-muted-foreground hover:bg-white/5" onClick={() => router.push('/talent/edit')}><Star className="w-4 h-4 text-violet-500" /> Perfil Público</Button>
		<Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl text-muted-foreground hover:bg-white/5" onClick={() => router.push('/profile')}><User className="w-4 h-4 text-violet-500" /> Cuenta</Button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            
            {/* Batch Header / Tools */}
            <div className="p-8 rounded-[2.5rem] glass-card border border-white/10 relative overflow-hidden bg-gradient-to-br from-violet-600/5 to-transparent">
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white">Configuración de Agenda</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Cargá tus horarios de forma masiva para ahorrar tiempo.</p>
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className={cn(
                      "h-12 px-10 rounded-2xl font-bold transition-all gap-2 shadow-2xl min-w-[200px]",
                      success ? "bg-green-600 hover:bg-green-600 text-white animate-pulse" : "btn-gradient text-white border-0"
                    )}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {loading ? "Guardando..." : success ? "¡Agenda Guardada!" : "Guardar Cambios"}
                  </Button>
                </div>

                <div className="p-6 rounded-[2rem] bg-black/40 border border-white/10 space-y-6">
                  <div className="flex items-center gap-2 text-violet-300 font-semibold mb-2">
                    <MousePointer2 className="w-4 h-4" />
                    <span>Carga Masiva (Selector Múltiple)</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {DAYS.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleBatchDay(day.id)}
                        className={cn(
                          "px-5 py-3 rounded-2xl text-sm font-bold transition-all border",
                          selectedBatchDays.includes(day.id) 
                            ? "bg-violet-600 border-violet-400 text-white shadow-lg scale-105" 
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {day.name}
                      </button>
                    ))}
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedBatchDays(DAYS.map(d => d.id))}
                      className="text-white/40 hover:text-white px-2"
                    >
                      Todos
                    </Button>
                  </div>

                  <div className="flex flex-col md:flex-row items-end gap-6 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Horario Inicio</Label>
                      <Input 
                        type="time" 
                        value={batchStart} 
                        onChange={(e) => setBatchStart(e.target.value)}
                        className="h-12 w-40 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500 text-white px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Horario Fin</Label>
                      <Input 
                        type="time" 
                        value={batchEnd} 
                        onChange={(e) => setBatchEnd(e.target.value)}
                        className="h-12 w-40 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500 text-white px-4"
                      />
                    </div>
                    <Button 
                      onClick={applyBatch}
                      disabled={selectedBatchDays.length === 0}
                      className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-gray-200 transition-all font-bold group"
                    >
                      <Plus className="w-5 h-5 mr-1 group-hover:rotate-90 transition-transform" />
                      Aplicar a {selectedBatchDays.length} días
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Days Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {DAYS.map((day) => {
                const daySlots = availabilities.filter(a => a.dayOfWeek === day.id);
                return (
                  <div key={day.id} className="p-8 rounded-[2rem] glass-card border border-white/5 flex flex-col transition-all hover:border-white/15 h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-white">{day.fullName}</h3>
                        <Badge variant="outline" className="mt-1 bg-violet-600/10 text-violet-400 border-0 w-fit">
                          {daySlots.length} bloques
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {daySlots.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToAll(day.id)}
                            title="Copiar horario a todos los días"
                            className="h-10 px-3 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl gap-2 text-xs"
                          >
                            <Copy className="w-4 h-4" /> Copiar a todos
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => addSlot(day.id)}
                          className="h-10 w-10 text-white bg-white/5 hover:bg-violet-600 rounded-xl transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      {daySlots.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center space-y-2 border-2 border-dashed border-white/5 rounded-3xl">
                           <Clock className="w-8 h-8" />
                           <span className="text-sm font-medium">Sin horarios</span>
                        </div>
                      ) : (
                        daySlots.map((slot, idx) => {
                          const globalIdx = availabilities.indexOf(slot);
                          return (
                            <div key={`${day.id}-${idx}`} className="group flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 animate-in slide-in-from-right-2 duration-200">
                              <div className="flex-1 flex items-center gap-3">
                                <Input 
                                  type="time" 
                                  value={slot.startTime} 
                                  onChange={(e) => updateSlot(globalIdx, "startTime", e.target.value)}
                                  className="h-10 bg-transparent border-0 focus:ring-0 text-white font-bold text-base p-0 w-20"
                                />
                                <span className="text-xs text-white/20 uppercase font-black">al</span>
                                <Input 
                                  type="time" 
                                  value={slot.endTime} 
                                  onChange={(e) => updateSlot(globalIdx, "endTime", e.target.value)}
                                  className="h-10 bg-transparent border-0 focus:ring-0 text-white font-bold text-base p-0 w-20"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeSlot(globalIdx)}
                                className="text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 rounded-[2rem] bg-violet-600/10 border border-violet-500/20 flex items-start gap-4">
              <Info className="w-5 h-5 text-violet-400 mt-0.5" />
              <div className="text-sm">
                <h4 className="text-violet-300 font-bold">Resumen de Agendamiento</h4>
                <p className="text-violet-200/60 mt-1 leading-relaxed">
                  Tus fans podrán reservar sesiones de 2 minutos dentro de cada bloque. Por ejemplo, un bloque de 09:00 a 10:00 permite generar 30 sesiones si el intervalo es total. El sistema gestionará los slots automáticamentes.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
