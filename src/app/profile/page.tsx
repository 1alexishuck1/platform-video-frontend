"use client";

import { useState, useEffect, useRef } from "react";
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
import { UserAvatar } from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useCreditsStore } from "@/store/credits";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated, isHydrated, logout, updateUser } = useHydratedAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatarUrl: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { balance, fetchBalance } = useCreditsStore();
  useEffect(() => {
    if (isAuthenticated) fetchBalance();
  }, [isAuthenticated, fetchBalance]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    setPasswordLoading(true);
    try {
      await apiFetch("/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      toast.success("Contraseña actualizada con éxito");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar la contraseña");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      const response = await apiFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          avatarUrl: formData.avatarUrl,
        }),
      });
      
      // Update global store so UI reacts instantly
      updateUser({
        name: response.user.name,
        avatarUrl: response.user.avatarUrl,
      });

      setSuccess(true);
      toast.success("Perfil actualizado");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile", error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es demasiado pesada (máx 2MB)");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, avatarUrl: base64String }));
        toast.info("Imagen seleccionada. No olvides guardar los cambios.");
      };
      reader.readAsDataURL(file);
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
                <UserAvatar 
                  src={formData.avatarUrl}
                  name={formData.name}
                  size="xl"
                  className="shadow-2xl transition-transform group-hover:scale-105 duration-300"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10"
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
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
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
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

                {activeTab === "security" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Seguridad</h3>
                        <p className="text-muted-foreground">Actualizá tu contraseña para mantener tu cuenta segura.</p>
                      </div>
                      <Shield className="w-8 h-8 text-white/5 items-start" />
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400 ml-1">Contraseña Actual</Label>
                          <Input 
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500/50 focus:border-violet-500 px-4 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400 ml-1">Nueva Contraseña</Label>
                          <Input 
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500/50 focus:border-violet-500 px-4 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400 ml-1">Confirmar Nueva Contraseña</Label>
                          <Input 
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500/50 focus:border-violet-500 px-4 text-white"
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          disabled={passwordLoading}
                          className="h-12 px-8 rounded-2xl font-bold bg-violet-600 hover:bg-violet-500 text-white min-w-[180px]"
                        >
                          {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Actualizar Contraseña"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "billing" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Pagos y Tokens</h3>
                        <p className="text-muted-foreground">Tu historial financiero dentro de la plataforma.</p>
                      </div>
                      <CreditCard className="w-8 h-8 text-white/5 items-start" />
                    </div>
                    
                    <div className="p-6 rounded-3xl glass-card border border-violet-500/30 bg-violet-600/10 flex flex-col md:flex-row items-center justify-between max-w-xl gap-6">
                      <div className="text-center md:text-left">
                        <p className="text-sm text-violet-300 font-bold uppercase tracking-widest mb-1">Balance Actual</p>
                        <div className="text-5xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                          {balance !== null ? balance : <Loader2 className="w-10 h-10 animate-spin" />} 
                          <span className="text-xl text-white/50 font-medium">tokens</span>
                        </div>
                      </div>
                      <Link href="/credits/buy">
                        <Button className="btn-gradient px-8 py-6 rounded-2xl text-lg font-black shadow-xl shrink-0 w-full md:w-auto hover:scale-105 transition-transform">
                          Cargar más
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-8 max-w-xl">
                      <h4 className="text-lg font-bold mb-4 text-white/80">Historial de Transacciones</h4>
                      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/5 opacity-60">
                         <CreditCard className="w-8 h-8 text-white/20 mb-2" />
                         <p className="text-sm font-medium text-white/40">No hay transacciones recientes</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Notificaciones</h3>
                        <p className="text-muted-foreground">Elegí qué alertas querés recibir en tu email.</p>
                      </div>
                      <Bell className="w-8 h-8 text-white/5 items-start" />
                    </div>

                    <div className="space-y-4 max-w-xl">
                      {[
                        { title: "Recordatorios de videollamadas", desc: "Avisos 15 minutos antes y en el momento que te toque tu turno." },
                        { title: "Cancelaciones", desc: "Te avisamos si un talento cancela la sesión y se te devuelven los tokens." },
                        { title: "Nuevos talentos", desc: "Enterate antes que nadie cuando un nuevo famos@ se une y empieza a transmitir." },
                        { title: "Ofertas y promos", desc: "Recibí emails cuando hagamos descuentos en la compra de tokens." }
                      ].map((n, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="pr-4">
                            <p className="font-bold text-white mb-1">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.desc}</p>
                          </div>
                          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-violet-600">
                            <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                          </div>
                        </div>
                      ))}
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
