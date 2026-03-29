"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Settings, DollarSign, Clock, LayoutDashboard, Loader2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";

const profileSchema = z.object({
  stage_name: z.string().min(2, "Nombre artístico muy corto"),
  bio: z.string().min(10, "Breve descripción obligatoria"),
  price_usd: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  session_duration_min: z.coerce.number().min(1, "Mínimo 1 minuto").max(60, "Máximo 60 minutos"),
  category: z.string().min(2, "Categoría obligatoria"),
});

type FormData = z.infer<typeof profileSchema>;

export default function TalentProfileEdit() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      stage_name: user?.name || "",
      bio: "¡Hola! Soy creador de contenido y me encantaría charlar con vos un rato.",
      price_usd: 15,
      session_duration_min: 2,
      category: "Creator"
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    // Simula API call PUT /talents
    await new Promise((r) => setTimeout(r, 1000));
    alert("Perfil guardado con éxito. (MVP Mock)");
    setIsLoading(false);
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8 text-violet-400" /> Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-1">Configurá cómo te ven los fans y cuánto cobrás.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/talent/dashboard")} className="hidden sm:flex border-white/10 gap-2">
            <LayoutDashboard className="w-4 h-4" /> Volver al dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Card: Info Básica */}
          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <User className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-semibold">Información pública</h2>
            </div>
            
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Nombre Artístico</Label>
                  <Input className="input-dark h-11" placeholder="Ej. Valentina Cruz" {...register("stage_name")} />
                  {errors.stage_name && <p className="text-xs text-red-400">{errors.stage_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input className="input-dark h-11" placeholder="Ej. Actor, Músico, Creator..." {...register("category")} />
                  {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Biografía corta (se muestra en tu tarjeta)</Label>
                <textarea 
                  className="w-full h-24 rounded-xl input-dark p-3 text-sm resize-none focus:outline-none"
                  placeholder="Contale a tus fans qué pueden esperar de una sesión con vos..."
                  {...register("bio")}
                />
                {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
              </div>
            </div>
          </div>

          {/* Card: Pricing & config */}
          <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold">Servicio y Precios</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Duración de la sesión (minutos)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" min="1" max="60" className="input-dark pl-9 h-11 text-lg font-mono font-bold" {...register("session_duration_min")} />
                </div>
                {errors.session_duration_min && <p className="text-xs text-red-400">{errors.session_duration_min.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Precio por sesión (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                  <Input type="number" min="1" step="0.01" className="input-dark pl-9 h-11 text-lg font-mono font-bold text-green-400" {...register("price_usd")} />
                </div>
                {errors.price_usd && <p className="text-xs text-red-400">{errors.price_usd.message}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">Stripe retendrá un ~3% por procesamiento.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" className="hover:bg-white/5">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="btn-gradient min-w-[140px] text-white font-bold h-11 border-0 shadow-lg">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Guardar cambios"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
