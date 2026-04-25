"use client";
// Navbar — authenticated state-aware, shows different links per role
// Verifica estado de la cuenta en cada carga y muestra AccountStatusModal si corresponde.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Video, Menu, LogOut, User, LayoutDashboard, Calendar, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useHydratedAuth } from "@/store/auth";
import { UserAvatar } from "@/components/common/UserAvatar";
import { WalletWidget } from "@/components/credits/WalletWidget";
import { cn } from "@/lib/utils";
import { AccountStatusModal } from "@/components/modals/AccountStatusModal";

const NAV_LINKS = [
  { href: "/about", label: "Acerca de" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isAuthenticated, logout, isHydrated } = useHydratedAuth();
  const [accountStatus, setAccountStatus] = useState<{ status: "PAUSED" | "BLOCKED"; reason?: string } | null>(null);

  // Verificar estado de la cuenta en cada carga de la plataforma
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token) return;
    // Si el admin responde con Account_Blocked o Account_Paused en cualquier ruta protegida,
    // el backend lo devuelve. Lo detectamos proactivamente en /auth/me.
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
      if (data.error === "Account_Blocked") {
        setAccountStatus({ status: "BLOCKED", reason: data.reason });
      } else if (data.error === "Account_Paused") {
        setAccountStatus({ status: "PAUSED", reason: data.reason });
      }
    }).catch(() => {});
  }, [isHydrated, isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      {/* Modal de estado de cuenta — se muestra sobre toda la plataforma */}
      {accountStatus && (
        <AccountStatusModal
          status={accountStatus.status}
          reason={accountStatus.reason}
          onClose={accountStatus.status === "PAUSED" ? () => setAccountStatus(null) : undefined}
        />
      )}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center">
        {/* Left Section (1/3) */}
        <div className="flex-1 flex justify-start items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-lg">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:inline-block">PlatfomLive</span>
          </Link>
        </div>

        {/* Center Section (1/3) */}
        <div className="hidden md:flex flex-none items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-all hover:text-violet-300",
                pathname === link.href
                  ? "text-violet-300"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section (1/3) */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {!isHydrated ? (
              <div className="w-20 h-8 rounded-md bg-white/5 animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                <WalletWidget />
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors">
                    <UserAvatar 
                      src={user.avatarUrl}
                      name={user.name}
                      size="sm"
                    />
                    <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 p-2">
                  <div className="px-2 py-1.5 mb-1">
                    <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Mi Actividad</p>
                  </div>
                  <DropdownMenuItem
                    render={
                      <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <Calendar className="w-4 h-4 text-violet-400" /> Mis sesiones
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/profile" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <User className="w-4 h-4 text-violet-400" /> Mi perfil
                      </Link>
                    }
                  />

                  <DropdownMenuSeparator className="bg-white/5 my-2" />

                  <div className="px-2 py-1.5 mb-1">
                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="w-3 h-3" /> Panel de Control
                    </p>
                  </div>
                  <DropdownMenuItem
                    render={
                      <Link href="/talent/dashboard" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5 font-bold text-pink-400">
                        <LayoutDashboard className="w-4 h-4 text-pink-400" /> ¡Transmitir en vivo!
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/talent/edit" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <User className="w-4 h-4 text-pink-500" />Configurar Canal
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/dashboard/verification" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <ShieldCheck className="w-4 h-4 text-green-400" /> Solicitar Verificación
                      </Link>
                    }
                  />
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-400 cursor-pointer focus:text-red-400"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "sm" }), "btn-gradient text-white border-0 shadow-lg")}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu - Show only on small screens */}
        <Sheet>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/10 p-2 rounded-xl transition-colors">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          } />
          <SheetContent side="right" className="w-[85%] sm:w-[380px] bg-[#07070a]/90 backdrop-blur-2xl border-l border-white/10 p-0 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500" showCloseButton={false}>
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-black text-xl text-white tracking-tighter block leading-none">PLATFOMLIVE</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Navegación</span>
                </div>
              </div>
              <SheetClose render={
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40">
                  <XIcon className="w-5 h-5" />
                </Button>
              } />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scrollbar-hide">
              {/* Main Links */}
              <div className="grid gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-[1.5rem] transition-all font-bold text-base",
                      pathname === link.href
                        ? "bg-violet-600/20 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-600/10"
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", pathname === link.href ? "bg-violet-400" : "bg-transparent")} />
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Account Section */}
              {isAuthenticated && user && (
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-5 rounded-[2rem]">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Tu billetera</p>
                      <p className="text-lg font-black text-white">Saldo actual</p>
                    </div>
                    <WalletWidget />
                  </div>

                  <div className="grid gap-2">
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest px-4 mb-2">Panel de Control</p>
                    
                    <Link href="/dashboard" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-white/50 hover:bg-white/5 hover:text-white transition-all font-bold">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      Mis sesiones
                    </Link>

                    <Link href="/talent/dashboard" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] bg-gradient-to-r from-pink-600/10 to-red-600/10 border border-pink-500/10 text-pink-400 hover:scale-[1.02] transition-all font-black italic">
                      <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center text-pink-400 shadow-inner">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      ¡Transmitir en vivo!
                    </Link>

                    <Link href="/talent/edit" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-white/50 hover:bg-white/5 hover:text-white transition-all font-bold">
                      <div className="w-10 h-10 rounded-xl bg-pink-600/10 flex items-center justify-center text-pink-500">
                        <User className="w-5 h-5" />
                      </div>
                      Configurar Canal
                    </Link>

                    <Link href="/dashboard/verification" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-white/50 hover:bg-white/5 hover:text-white transition-all font-bold">
                      <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center text-green-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      Solicitar Verificación
                    </Link>

                    <Link href="/profile" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-white/50 hover:bg-white/5 hover:text-white transition-all font-bold">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                        <User className="w-5 h-5" />
                      </div>
                      Mi perfil
                    </Link>
                  </div>
                </div>
              )}

              {/* Login/Register for unauthenticated */}
              {!isAuthenticated && (
                <div className="grid gap-3 pt-4">
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "outline" }), "w-full border-white/10 h-14 rounded-2xl bg-white/5 font-black text-xs uppercase tracking-widest")}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants(), "w-full bg-gradient-to-r from-violet-600 to-pink-600 border-0 h-14 shadow-lg shadow-violet-500/20 rounded-2xl font-black text-xs uppercase tracking-widest")}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>

            {/* User Info & Logout (Bottom Section) */}
            {isAuthenticated && user && (
              <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      src={user.avatarUrl}
                      name={user.name}
                      size="md"
                    />
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-white truncate leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] font-bold text-green-400/70 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verificado
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </nav>
    </header>
    </>
  );
}
