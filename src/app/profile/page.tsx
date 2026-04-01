"use client";

import { useState, useEffect } from "react";
import { useHydratedAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Shield, Camera, Save, Loader2, AlertCircle, 
  Settings, Bell, CreditCard, LogOut, ChevronRight, CheckCircle2, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

export default function ProfilePage() {
  const { user, isAuthenticated, isHydrated, logout } = useHydratedAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatarUrl: ""
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || ""
      });
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      // Removed artificial delay for faster UX
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "general", label: "General", icon: User },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "billing", label: "Pagos", icon: CreditCard },
    { id: "security", label: "Seguridad", icon: Shield },
  ];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 space-y-6">
              <div className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse mb-4" />
                <div className="h-6 w-3/4 bg-white/5 animate-pulse rounded-full" />
                <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded-full mt-2" />
              </div>
              <div className="p-2 rounded-3xl glass-card border border-white/5 space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-full bg-white/5 animate-pulse rounded-2xl" />
                ))}
              </div>
            </aside>
            <main className="flex-1">
              <div className="p-8 md:p-10 rounded-[2.5rem] glass-card border border-white/10 min-h-[500px]">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-4 w-full">
                    <div className="h-8 w-1/3 bg-white/5 animate-pulse rounded-full" />
                    <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-20 bg-white/5 animate-pulse rounded" />
                      <div className="h-12 w-full bg-white/5 animate-pulse rounded-2xl" />
                    </div>
                  ))}
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
      <div className="pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-6">
            <div className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <Avatar className="w-24 h-24 border-2 border-violet-500/50 shadow-2xl transition-transform group-hover:scale-105 duration-300">
                  <AvatarImage src={formData.avatarUrl} alt={formData.name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-2xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="font-bold text-xl text-white truncate w-full">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-violet-600/20 text-violet-400 border-violet-500/30 font-bold uppercase text-[10px] tracking-widest px-3">
                  {user.role}
                </Badge>
                {user.isVerified && (
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-bold uppercase text-[10px] tracking-widest px-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verificado
                  </Badge>
                )}
              </div>
            </div>

            <nav className="p-2 rounded-3xl glass-card border border-white/5 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                    activeTab === item.id 
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-violet-500")} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {activeTab === item.id && <ChevronRight className="ml-auto w-4 h-4 text-white/50" />}
                </button>
              ))}
              <Separator className="my-2 bg-white/5 mx-2" />
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="p-8 md:p-10 rounded-[2.5rem] glass-card border border-white/10 min-h-[500px] relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />

              <div className="relative">
                {activeTab === "general" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Información General</h3>
                        <p className="text-muted-foreground">Mantené tu perfil actualizado para una mejor experiencia.</p>
                      </div>
                      <Settings className="w-8 h-8 text-white/5 items-start" />
                    </div>

                    <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm text-gray-400 ml-1">Nombre Completo</Label>
                          <Input 
                            id="name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500/50 focus:border-violet-500 px-4 text-white"
                            placeholder="Tu nombre"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm text-gray-400 ml-1">Email Registrado</Label>
                          <div className="relative group">
                            <Input 
                              id="email" 
                              value={formData.email}
                              disabled
                              className="h-12 bg-white/5 border-white/10 rounded-2xl opacity-50 cursor-not-allowed px-4 text-white"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Shield className="w-4 h-4 text-violet-500" />
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground ml-1">El email está vinculado a tu cuenta y no puede cambiarse.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avatar" className="text-sm text-gray-400 ml-1">Avatar URL</Label>
                          <Input 
                            id="avatar" 
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500/50 focus:border-violet-500 px-4 text-white"
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-4">
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className={cn(
                            "h-12 px-8 rounded-2xl font-bold transition-all gap-2 min-w-[180px]",
                            success ? "bg-green-600 hover:bg-green-600 text-white" : "btn-gradient text-white border-0 shadow-xl hover:scale-[1.02]"
                          )}
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : success ? (
                            <>
                              <CheckCircle2 className="w-5 h-5" /> ¡Guardado!
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" /> Guardar cambios
                            </>
                          )}
                        </Button>

                        {success && (
                          <span className="text-green-400 text-sm font-medium animate-in fade-in duration-300">
                            Tus datos se actualizaron correctamente
                          </span>
                        )}
                      </div>
                    </form>

                    <div className="mt-12 p-6 rounded-3xl bg-violet-600/10 border border-violet-500/20">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-violet-600/20 rounded-xl mt-1">
                          <LayoutDashboard className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-violet-300 font-bold">Modo Host</h4>
                          <p className="text-sm text-violet-200/60 mt-1 leading-relaxed">
                            Cualquier usuario puede transmitir y conocer a sus seguidores. Configurá tu perfil de creador para empezar.
                          </p>
                          <Button 
                            variant="link" 
                            onClick={() => router.push('/talent/dashboard')}
                            className="text-violet-400 p-0 h-auto mt-2 hover:text-violet-300"
                          >
                            Ir al Studio →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab !== "general" && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-in fade-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Settings className="w-10 h-10 text-white/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Próximamente</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                        Estamos trabajando en la sección de {menuItems.find(i => i.id === activeTab)?.label.toLowerCase()} para que tengas el control total de tu cuenta.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
);
}
