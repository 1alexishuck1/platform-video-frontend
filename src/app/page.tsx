// Home page — hero section + featured talents grid
// Uses mock data; connect to GET /talents when backend is ready

import Link from "next/link";
import { ArrowRight, Star, Zap, Shield } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { TalentCard } from "@/components/talents/TalentCard";
import { TalentProfile } from "@/types";

async function getTalents(): Promise<TalentProfile[]> {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/talents", { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.talents || [];
  } catch (err) {
    return [];
  }
}

const FEATURES = [
  {
    icon: Zap,
    title: "Conexión instantánea",
    desc: "Entra a la sala de videollamada con un click. Sin apps, sin descargas.",
  },
  {
    icon: Star,
    title: "Talentos verificados",
    desc: "Cada perfil es verificado manualmente. Solo lo mejor para vos.",
  },
  {
    icon: Shield,
    title: "Pago seguro",
    desc: "Tu dinero está protegido. Se libera solo cuando la sesión ocurre.",
  },
];

export default async function HomePage() {
  const allTalents = await getTalents();
  const featured = allTalents.slice(0, 3);

  return (
    <div className="min-h-screen animated-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm text-violet-300 font-medium whitespace-nowrap">Más de 500 sesiones completadas</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.15] mb-6 tracking-tight">
            Conocé a tus{" "}
            <span className="gradient-text">favoritos</span>
            <br />
            en persona.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Reservá una videollamada exclusiva de 2 minutos con actores, deportistas, cantantes y creadores.
            Un momento único, real y en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/talents" 
              className={cn(buttonVariants({ size: "lg" }), "btn-gradient text-white border-0 shadow-xl text-base px-10 h-14 gap-2 w-full sm:w-auto")}
            >
              Ver talentos <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/register?role=talent" 
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/10 glass text-muted-foreground hover:text-foreground h-14 text-base px-10 w-full sm:w-auto")}
            >
              Soy un talento
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-16 border-t border-border">
            {[
              { value: "500+", label: "Sesiones completadas" },
              { value: "120+", label: "Talentos activos" },
              { value: "4.9★", label: "Calificación" },
              { value: "2 min", label: "Por sesión" },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured talents */}
        <section className="py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Talentos destacados</h2>
            <p className="text-muted-foreground mt-2">Los más solicitados esta semana</p>
          </div>
          <Link 
            href="/talents"
            className={cn(buttonVariants({ variant: "ghost" }), "text-violet-400 hover:text-violet-300 gap-2")}
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué PlatfomLive?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-sm text-muted-foreground">
        <p>© 2025 PlatfomLive. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
