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
  { href: "/", label: "Inicio" },
  { href: "/talents", label: "Talentos" },
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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Left: Logo */}
        <div className="flex justify-start">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-lg">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:inline-block">PlatfomLive</span>
          </Link>
        </div>

        {/* Center: Desktop nav */}
        <div className="hidden md:flex justify-center items-center gap-8">
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

        {/* Right: Auth area & Mobile trigger */}
        <div className="flex justify-end items-center gap-3">
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
                <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
                  {user && (user.role === "fan" || (user.role as string) === "FAN") && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Mis reservas
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <User className="w-4 h-4" /> Mi perfil
                      </DropdownMenuItem>
                    </>
                  )}
                  {user && (user.role === "talent" || (user.role as string) === "TALENT") && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => router.push("/talent/dashboard")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push("/talent/agenda")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <Calendar className="w-4 h-4" /> Mi agenda
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push("/talent/profile")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <User className="w-4 h-4" /> Perfil público
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push("/talent/edit")}
                        className="flex items-center gap-2 cursor-pointer w-full px-2 py-1.5 transition-colors"
                      >
                        <User className="w-4 h-4" /> Editar perfil
                      </DropdownMenuItem>
                    </>
                  )}
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

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/10 p-2 rounded-xl transition-colors">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] max-w-sm glass border-l border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden" showCloseButton={false}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-lg">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">Menu</span>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <XIcon className="w-5 h-5" />
                </Button>
              </SheetClose>
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
                    {(user.role === "fan" || (user.role as string) === "FAN") ? (
                      <>
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <LayoutDashboard className="w-5 h-5 text-violet-400" /> Mis reservas
                        </Link>
                        <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <User className="w-5 h-5 text-violet-400" /> Mi perfil
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/talent/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <LayoutDashboard className="w-5 h-5 text-violet-400" /> Dashboard
                        </Link>
                        <Link href="/talent/agenda" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <Calendar className="w-5 h-5 text-violet-400" /> Mi agenda
                        </Link>
                        <Link href="/talent/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <User className="w-5 h-5 text-violet-400" /> Perfil público
                        </Link>
                        <Link href="/talent/edit" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all font-medium">
                          <User className="w-5 h-5 text-violet-400" /> Editar perfil
                        </Link>
                      </>
                    )}
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
                  <p className="text-xs text-muted-foreground capitalize">{(user.role || "").toLowerCase()}</p>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
