"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { TalentCard } from "@/components/talents/TalentCard";
import { CATEGORIES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Zap, Video, ArrowUpRight } from "lucide-react";
import { TalentProfile } from "@/types";
import { apiFetch } from "@/lib/api";
import { io } from "socket.io-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function IndexPage() {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const data = await apiFetch("/talents");
        setTalents(data.talents || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();

    // Sockets for real-time live status updates
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

    socket.on("connect", () => {
      console.log("Socket connected for explorer updates");
    });

    socket.on("talent-status-updated", ({ talentId, isLive }) => {
      setTalents((prev) =>
        prev.map(t => t.id === talentId ? { ...t, isLive } : t)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredTalents = talents.filter(t => {
    const matchesSearch = (t.stageName || t.stage_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const liveNow = filteredTalents.filter(t => t.isLive);
  const offline = filteredTalents.filter(t => !t.isLive);

  return (
    <div className="min-h-screen bg-[#030305] relative overflow-hidden">
      {/* Mesh Gradients de fondo para profundidad - WOW Factor */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none animate-bounce duration-[10000ms]" />
      
      <Navbar />

      <main className="pt-24 px-5 sm:px-6 lg:px-8 max-w-[90rem] mx-auto relative z-10">
        
        {/* HERO SECTION - REPLACES OLD TITLE */}
        <section className="mb-12 md:mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
            {/* Left: Main Message */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest mx-auto lg:mx-0">
                <Zap className="w-3 h-3 fill-violet-400" /> Nueva Experiencia Live
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] lg:leading-[0.9] tracking-tighter">
                Conectá con tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-red-400">mundo</span> en vivo.
              </h1>
              <p className="text-white/40 text-base sm:text-lg max-w-xl font-medium leading-relaxed mx-auto lg:mx-0">
                La plataforma líder para encuentros exclusivos. Mirá a tus creadores favoritos o convertite en uno hoy mismo.
              </p>
            </div>

            {/* Right: Primary CTAs */}
            <div className="w-full lg:w-[400px] flex flex-col gap-5">
              <Link href="/talent/dashboard" className="group relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 p-8 rounded-[3rem] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-2xl shadow-pink-500/20">
                {/* Background Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors" />
                
                <div className="relative z-10 flex flex-col items-start gap-1">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">¿Sos talento?</span>
                  <span className="text-4xl font-black text-white italic tracking-tighter">Empezar mi vivo</span>
                  <p className="mt-2 text-white/60 text-sm font-medium">Transmití ahora y conectá con tus fans.</p>
                  
                  <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/20 transition-all">
                    <span className="text-white font-bold text-sm">Ganar créditos</span>
                    <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <Video className="w-48 h-48 text-white rotate-12" />
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => {
                   const el = document.getElementById('live-section');
                   el?.scrollIntoView({ behavior: 'smooth' });
                 }} className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-start gap-2 transition-all hover:border-white/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">Descubrir</span>
                    <span className="text-lg font-black text-white italic">Mirar vivos</span>
                 </button>
                 
                 <Link href="/dashboard/verification" className="group relative bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 p-6 rounded-[2.5rem] flex flex-col items-start gap-2 transition-all hover:border-violet-500/40 overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-colors" />
                    <span className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.15em]">Afiliarse</span>
                    <span className="text-lg font-black text-violet-400 italic">Ser talento</span>
                 </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in duration-700 delay-200">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all border ${activeCategory === cat
                  ? "bg-white text-black border-white shadow-xl shadow-white/10"
                  : "bg-white/5 border-white/5 hover:border-white/20 text-white/40 hover:text-white"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
            <Input
              placeholder="¿A quién buscás?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/5 focus:border-violet-500/50 h-12 text-sm rounded-2xl transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8 mb-16 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-[2.5rem] h-[320px] border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-20 mb-32">
            {/* Live Section */}
            <section id="live-section" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
                  <div className="relative w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">En vivo ahora</h2>
                <div className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                  {liveNow.length} activos
                </div>
              </div>

              {liveNow.length === 0 ? (
                <div className="bg-white/[0.02] rounded-[3rem] p-16 text-center border-2 border-dashed border-white/5 flex flex-col items-center gap-6 group hover:border-violet-500/20 transition-all">
                  <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Video className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black text-white italic">Nadie transmitiendo</p>
                    <p className="text-white/30 text-sm max-w-sm mx-auto">
                      Parece que hoy el escenario está vacío. ¡Aprovechá y empezá tu vivo para ser el primero!
                    </p>
                  </div>
                  <Link href="/talent/dashboard" className="px-8 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                    Iniciar transmisión
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {liveNow.map((talent) => (
                    <TalentCard key={talent.id} talent={talent} />
                  ))}
                </div>
              )}
            </section>

            {/* Offline Section */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2.5 h-2.5 bg-white/10 rounded-full" />
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase opacity-30">Explorar offline</h2>
              </div>

              {offline.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <p className="font-black text-sm uppercase tracking-widest">No hay talentos registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-80 group">
                  {offline.map((talent) => (
                    <TalentCard key={talent.id} talent={talent} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

