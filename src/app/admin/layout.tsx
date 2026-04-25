"use client";
// Layout protegido para todas las rutas de /admin/*
// Verifica token de admin al montar. Redirige a /admin/login si no es válido.

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, Users, FileText, Activity, LogOut, Loader2, MessageSquare, ShieldCheck, Server } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { href: "/admin/users",        label: "Usuarios",          icon: Users },
  { href: "/admin/verifications",label: "Verificaciones",   icon: ShieldCheck },
  { href: "/admin/appeals",      label: "Descargos",         icon: MessageSquare },
  { href: "/admin/logs",         label: "Logs del sistema",  icon: FileText },
  { href: "/admin/transactions", label: "Transacciones",     icon: Activity },
  { href: "/admin/health",       label: "Salud del Sistema", icon: Server },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No verificar en la propia página de login
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      router.replace("/admin/login");
      return;
    }

    // Verificar que el token siga siendo válido
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/admin/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-black/40 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-black text-white text-sm">Admin Panel</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">PlatfomLive</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-red-600/15 text-red-400 border border-red-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión admin
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
