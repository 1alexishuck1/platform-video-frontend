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
} from "@/components/ui/sheet";
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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-lg">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">PlatfomLive</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-violet-300",
                pathname === link.href
                  ? "text-violet-300"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
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

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="md:hidden hover:bg-white/10 p-2 rounded-md transition-colors">
              <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 glass border-l border-white/10">
            <div className="flex flex-col gap-6 mt-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground hover:text-violet-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated && user && (
                <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Mi Cuenta</p>
                  {user.role === "fan" ? (
                    <>
                      <Link href="/dashboard" className="text-base text-violet-300 font-medium px-1 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Mis reservas
                      </Link>
                      <Link href="/profile" className="text-base text-muted-foreground font-medium px-1 flex items-center gap-2">
                        <User className="w-4 h-4" /> Mi perfil
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/talent/dashboard" className="text-base text-violet-300 font-medium px-1 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/talent/agenda" className="text-base text-muted-foreground font-medium px-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Mi agenda
                      </Link>
                      <Link href="/talent/profile" className="text-base text-muted-foreground font-medium px-1 flex items-center gap-2">
                        <User className="w-4 h-4" /> Perfil público
                      </Link>
                    </>
                  )}
                </div>
              )}
              <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                {!isHydrated ? null : isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-400 text-sm font-medium"
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <>
                    <Link 
                      href="/login"
                      className={cn(buttonVariants({ variant: "outline" }), "w-full border-white/10")}
                    >
                      Iniciar sesión
                    </Link>
                    <Link 
                      href="/register"
                      className={cn(buttonVariants(), "w-full btn-gradient border-0")}
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
