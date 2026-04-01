"use client";

import { useState, useEffect } from "react";
import { useHydratedAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import {
  Star, Info, DollarSign, Clock, Save, Loader2,
  ChevronRight, CheckCircle2, LayoutDashboard, Calendar, User, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

export default function TalentEditPage() {
  const { user, token, isAuthenticated, isHydrated } = useHydratedAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    stageName: "",
    bio: "",
    category: "",
    priceUsd: 0,
    sessionDurationMin: 2
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            stageName: data.profile.stageName || "",
            bio: data.profile.bio || "",
            category: data.profile.category || "",
            priceUsd: data.profile.priceUsd || 0,
            sessionDurationMin: data.profile.sessionDurationMin || 2
          });
        }
      } catch (err) {
        console.error("Error fetching talent profile", err);
      } finally {
        setFetching(false);
      }
    };

    if (token) fetchProfile();
  }, [isHydrated, isAuthenticated, user, token, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/talents/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error updating talent profile", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/talent/dashboard" },
    { id: "edit", label: "Configurar Canal", icon: Star, href: "/talent/edit", active: true },
    { id: "settings", label: "Cuenta", icon: User, href: "/profile" },
  ];

  if (!isHydrated || fetching) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 space-y-4">
              <div className="p-4 rounded-3xl glass-card border border-white/10">
                <div className="h-3 w-20 bg-white/5 animate-pulse rounded-full mb-6" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-2xl mb-2" />
                ))}
              </div>
            </aside>
            <main className="flex-1">
              <div className="p-8 md:p-10 rounded-[2.5rem] glass-card border border-white/10 min-h-[500px]">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-4 w-1/2">
                    <div className="h-8 w-full bg-white/5 animate-pulse rounded-full" />
                    <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded-full" />
                  </div>
                  <div className="w-12 h-12 bg-white/5 animate-pulse rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 bg-white/5 animate-pulse rounded" />
                      <div className="h-12 w-full bg-white/5 animate-pulse rounded-2xl" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-8">
                  <div className="h-3 w-20 bg-white/5 animate-pulse rounded" />
                  <div className="h-32 w-full bg-white/5 animate-pulse rounded-2xl" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Talent Sidebar */}
          <aside className="w-full md:w-64 space-y-4">
            <div className="p-4 rounded-3xl glass-card border border-white/10 mb-6">
              <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest px-2 mb-4">Talent Center</h2>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => router.push(link.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group",
                      link.active
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    <link.icon className={cn("w-4 h-4", link.active ? "text-white" : "text-violet-500")} />
                    <span className="text-sm font-medium">{link.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="p-8 md:p-10 rounded-[2.5rem] glass-card border border-white/10 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px]" />

              <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">Configurar Canal</h1>
                    <p className="text-muted-foreground mt-1">Configurá cómo te ven tus fans durante tus vivos.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                    <Star className="w-6 h-6 text-violet-400" />
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stage Name */}
                    <div className="space-y-2">
                      <Label className="text-gray-400 ml-1">Nombre Artístico</Label>
                      <Input
                        value={formData.stageName}
                        onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500"
                        placeholder="Ej: Messi, Bizarrap..."
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-gray-400 ml-1">Categoría</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500"
                        placeholder="Ej: Deportes, Música, Cine..."
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label className="text-gray-400 ml-1">Biografía</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500 py-4"
                      placeholder="Contale a tus fans quién sos y qué pueden esperar de tu sesión..."
                    />
                  </div>

                  <Separator className="bg-white/5" />

                  {/* Pricing & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-400 ml-1 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Precio por Sesión (USD)
                      </Label>
                      <Input
                        type="number"
                        value={formData.priceUsd}
                        onChange={(e) => setFormData({ ...formData, priceUsd: parseFloat(e.target.value) })}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-400 ml-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Duración (Minutos)
                      </Label>
                      <Input
                        type="number"
                        value={formData.sessionDurationMin}
                        onChange={(e) => setFormData({ ...formData, sessionDurationMin: parseInt(e.target.value) })}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 flex items-center gap-6">
                    <Button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        "h-14 px-10 rounded-2xl font-bold transition-all gap-2 shadow-2xl",
                        success ? "bg-green-600 hover:bg-green-600 text-white" : "btn-gradient text-white border-0 hover:scale-[1.02]"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Perfil Actualizado
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Guardar Cambios
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-2 text-muted-foreground p-3 rounded-2xl bg-white/5 border border-white/5">
                      <Info className="w-4 h-4 text-violet-400" />
                      <span className="text-xs">Los cambios impactan de inmediato en tu perfil público.</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
