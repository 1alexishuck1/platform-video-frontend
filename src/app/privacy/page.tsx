"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, HelpCircle } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      id: "collection",
      title: "1. Recolección de Datos",
      icon: Database,
      content: "Recopilamos información básica para el funcionamiento del servicio: nombre, email, avatar y datos técnicos de conexión. No vendemos tus datos a terceros."
    },
    {
      id: "usage",
      title: "2. Uso de la Información",
      icon: ShieldCheck,
      content: "Tus datos se utilizan para gestionar tus reservas, procesar pagos (a través de proveedores seguros) y notificarte sobre tus sesiones en vivo."
    },
    {
      id: "security",
      title: "3. Seguridad",
      icon: Lock,
      content: "Implementamos medidas de seguridad de grado industrial para proteger tus datos. Sin embargo, ninguna transmisión por internet es 100% segura."
    },
    {
      id: "transparency",
      title: "4. Tus Derechos",
      icon: Eye,
      content: "Tenés derecho a acceder, rectificar o solicitar la eliminación de tus datos personales en cualquier momento desde la configuración de tu perfil."
    }
  ];

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {/* Header */}
      <div className="relative border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Política de Privacidad</h1>
          </div>
          <p className="text-white/40 max-w-2xl text-lg">
            Última actualización: 22 de abril, 2026. Tu privacidad es nuestra prioridad absoluta.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-12">
          {sections.map((section) => (
            <section key={section.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white/90">{section.title}</h2>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 leading-relaxed text-white/60 text-lg">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-white/30 text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>¿Preguntas sobre tus datos?</span>
          </div>
          <Link 
            href="mailto:privacidad@platfomlive.com" 
            className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-colors"
          >
            Contactar a privacidad
          </Link>
        </div>
      </div>

      <div className="py-12 bg-white/[0.01] border-t border-white/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          PlatfomLive &copy; 2026 • Privacidad Garantizada
        </p>
      </div>
    </main>
  );
}
