"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { TalentCard } from "@/components/talents/TalentCard";
import { CATEGORIES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Zap, Video } from "lucide-react";
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
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16 px-5 sm:px-6 lg:px-8 max-w-[90rem] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl sm:text-3xl font-bold font-black gradient-text">Talentos en vivo</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">Encontrá a tus ídolos y hablá con ellos en persona. Además, ¡ahora vos también podés transmitir!</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/talent/dashboard" className={cn(buttonVariants({ variant: "outline" }), "glass border-pink-500/30 text-pink-400 gap-2 h-9 px-4 rounded-full hover:bg-pink-500/10 transition-all font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.1)] group")}>
                <Zap className="w-3 h-3 fill-pink-500 group-hover:animate-pulse" /> ¡Transmitir en vivo!
              </Link>
            </div>
          </div>

          <div className="relative w-full md:w-64 animate-in fade-in slide-in-from-right-4 duration-500">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 input-dark h-9 text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Categories (Mock filters) */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 animate-in fade-in duration-700">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeCategory === cat
                ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20"
                : "glass border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-8 mb-16 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="glass rounded-[1.5rem] h-[280px] flex flex-col p-3 border border-white/5">
                <div className="h-32 rounded-xl bg-white/5 mb-3" />
                <div className="h-5 w-3/4 rounded bg-white/10 mb-2" />
                <div className="h-3 w-1/2 rounded bg-white/5 mb-4" />
                <div className="mt-auto h-10 rounded-xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12 mt-8 mb-16">
            {/* Live Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter">En vivo ahora</h2>
                <div className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                  {liveNow.length} ACTIVOS
                </div>
              </div>

              {liveNow.length === 0 ? (
                <div className="glass rounded-[2rem] p-8 text-center border-dashed border-2 border-white/5 opacity-60">
                  <p className="text-sm text-muted-foreground font-medium">No hay talentos en vivo en este momento. ¡Volvé pronto!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {liveNow.map((talent) => (
                    <TalentCard key={talent.id} talent={talent} />
                  ))}
                </div>
              )}
            </section>

            {/* Offline Section */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-violet-600 rounded-full" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tighter opacity-60">Explorar offline</h2>
              </div>

              {offline.length === 0 ? (
                <div className="glass rounded-[2rem] p-8 text-center border-dashed border-2 border-white/5 opacity-50">
                  <p className="text-sm text-muted-foreground font-medium">No hay talentos offline en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 opacity-80">
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
