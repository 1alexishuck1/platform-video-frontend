"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Settings, DollarSign, Clock, LayoutDashboard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, useHydratedAuth } from "@/store/auth";

const profileSchema = z.object({
  stageName: z.string().min(2, "Nombre artístico muy corto"),
  bio: z.string().min(10, "Breve descripción obligatoria"),
  priceUsd: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  sessionDurationMin: z.coerce.number().min(1, "Mínimo 1 minuto").max(60, "Máximo 60 minutos"),
  category: z.string().min(2, "Categoría obligatoria"),
});

type FormData = z.infer<typeof profileSchema>;

export default function TalentProfileEdit() {
  const router = useRouter();
  const { user, token, isAuthenticated, isHydrated } = useHydratedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      stageName: user?.name || "",
      bio: "¡Hola! Soy creador de contenido y me encantaría charlar con vos un rato.",
      priceUsd: 15,
      sessionDurationMin: 2,
      category: "Creator"
    }
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push("/login");
    
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            setValue("stageName", profile.stageName);
            setValue("bio", profile.bio || "");
            setValue("priceUsd", profile.priceUsd);
            setValue("sessionDurationMin", profile.sessionDurationMin);
            setValue("category", profile.category);
          }
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };

    if (token && !profileLoaded) fetchProfile();
  }, [isHydrated, isAuthenticated, token, router, setValue, profileLoaded]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/update`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Perfil guardado con éxito.");
        router.push("/talent/dashboard");
      }
    } catch (error) {
      toast.error("Error al guardar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8 text-violet-400" /> Mi perfil
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
                  <Label>Nombre artístico</Label>
                  <Input className="input-dark h-11" placeholder="Ej. Valentina Cruz" {...register("stageName")} />
                  {errors.stageName && <p className="text-xs text-red-400">{errors.stageName.message}</p>}
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
              <h2 className="text-xl font-semibold">Servicio y precios</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Duración de la sesión (minutos)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" min="1" max="60" className="input-dark pl-9 h-11 text-lg font-mono font-bold" {...register("sessionDurationMin")} />
                </div>
                {errors.sessionDurationMin && <p className="text-xs text-red-400">{errors.sessionDurationMin.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Precio por sesión (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                  <Input type="number" min="1" step="0.01" className="input-dark pl-9 h-11 text-lg font-mono font-bold text-green-400" {...register("priceUsd")} />
                </div>
                {errors.priceUsd && <p className="text-xs text-red-400">{errors.priceUsd.message}</p>}
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
