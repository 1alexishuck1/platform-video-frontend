"use client";
// Panel de administración — login con doble factor: clave secreta + contraseña
// El admin token se guarda separado del token de usuario.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, Lock, Key } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminKey.trim() || !password.trim()) {
      setError("Se requieren ambos campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Acceso denegado.");
        return;
      }

      // Guardar token de admin por separado del token de usuario
      localStorage.setItem("admin_token", data.adminToken);
      router.push("/admin/dashboard");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] flex items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo admin */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Panel de Administración</h1>
          <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Acceso restringido</p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Factor 1: Clave secreta */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Clave de acceso
              </label>
              <input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="••••••••••••••••••••"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
              />
            </div>

            {/* Factor 2: Contraseña */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Contraseña del panel
              </label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !adminKey || !password}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Ingresar al panel
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest">
          Todos los accesos son registrados y auditados
        </p>
      </div>
    </div>
  );
}
