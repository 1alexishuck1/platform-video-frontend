"use client";
// Navbar — authenticated state-aware, shows different links per role
// Uses useAuthStore for session, collapses to sheet on mobile

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Video, Menu, LogOut, User, LayoutDashboard, Calendar } from "lucide-react";
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
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Talentos" },
  { href: "/about", label: "Acerca de" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isHydrated } = useHydratedAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors">
                    <Avatar className="w-8 h-8 border border-violet-500/30">
                      <AvatarFallback className="bg-violet-900/50 text-violet-300 text-xs font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
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
                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">Creador</p>
                  </div>
                  <DropdownMenuItem 
                    render={
                      <Link href="/talent/dashboard" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <LayoutDashboard className="w-4 h-4 text-pink-400" /> Modo Host
                      </Link>
                    }
                  />
                  <DropdownMenuItem 
                    render={
                      <Link href="/talent/profile" className="flex items-center gap-3 cursor-pointer w-full px-2 py-2 rounded-xl transition-colors hover:bg-white/5">
                        <User className="w-4 h-4 text-pink-500" /> Vista pública
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
          <SheetContent side="right" className="w-[85%] max-w-sm glass border-l border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden" showCloseButton={false}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-lg">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">Menu</span>
              </div>
              <SheetClose render={
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <XIcon className="w-5 h-5" />
                </Button>
              } />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              {/* Main Links */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-2">Navegación</p>
                <div className="grid gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium",
                        pathname === link.href 
                          ? "bg-violet-600/10 text-violet-300 border border-violet-500/20" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Account Section */}
              {isAuthenticated && user && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-2">Mi Cuenta</p>
                  <div className="grid gap-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                      <Calendar className="w-5 h-5 text-violet-400" /> Mis sesiones
                    </Link>
                    <Link href="/talent/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                      <LayoutDashboard className="w-5 h-5 text-pink-400" /> Modo Host
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                      <User className="w-5 h-5 text-blue-400" /> Mi perfil
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5">
                {!isHydrated ? null : isAuthenticated ? (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 h-12 rounded-xl transition-all"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Cerrar sesión
                  </Button>
                ) : (
                  <div className="space-y-3 px-2">
                    <Link 
                      href="/login"
                      className={cn(buttonVariants({ variant: "outline" }), "w-full border-white/10 h-12 rounded-xl bg-white/5")}
                    >
                      Iniciar sesión
                    </Link>
                    <Link 
                      href="/register"
                      className={cn(buttonVariants(), "w-full btn-gradient border-0 h-12 shadow-lg shadow-violet-500/20 rounded-xl")}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* User Info (Bottom Sticker) */}
            {isAuthenticated && user && (
              <div className="p-6 bg-white/5 border-t border-white/5 flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-violet-500/30">
                  <AvatarFallback className="bg-violet-900/50 text-violet-300">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Usuario verificado</p>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
