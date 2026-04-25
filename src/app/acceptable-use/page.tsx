"use client";

import Link from "next/link";
import { ChevronLeft, FileWarning, Ban, MessageSquareOff, UserX, HelpCircle } from "lucide-react";

export default function AcceptableUsePage() {
  const sections = [
    {
      id: "nudity",
      title: "1. Contenido Sexual y Desnudez",
      icon: Ban,
      content: "PlatfomLive NO es una plataforma para contenido para adultos. Queda terminantemente prohibida la desnudez, actos sexuales o contenido erótico explícito durante las videollamadas."
    },
    {
      id: "harassment",
      title: "2. Acoso y Odio",
      icon: MessageSquareOff,
      content: "No toleramos el lenguaje de odio, el acoso a talentos o fans, ni el comportamiento abusivo. Respetar la integridad de los demás es fundamental para permanecer en la plataforma."
    },
    {
      id: "scams",
      title: "3. Fraude y Engaño",
      icon: UserX,
      content: "Queda prohibido intentar suplantar identidades, realizar estafas, o promover servicios externos ilegales a través de nuestro sistema de comunicación."
    },
    {
      id: "sanctions",
      title: "4. Sanciones Explicadas",
      icon: FileWarning,
      content: "Cualquier violación a estas políticas resultará en la terminación inmediata de la sesión actual sin derecho a reembolso y el bloqueo permanente de la cuenta."
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
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400">
              <FileWarning className="w-6 h-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Uso Aceptable</h1>
          </div>
          <p className="text-white/40 max-w-2xl text-lg">
            Reglas de oro para mantener PlatfomLive como un espacio seguro y profesional para todos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-12">
          {sections.map((section) => (
            <section key={section.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-5 h-5 text-red-400" />
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
            <span>¿Viste una conducta inapropiada?</span>
          </div>
          <Link 
            href="mailto:denuncias@platfomlive.com" 
            className="px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
          >
            Reportar infracción
          </Link>
        </div>
      </div>

      <div className="py-12 bg-white/[0.01] border-t border-white/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          PlatfomLive &copy; 2026 • Tolerancia Cero al Abuso
        </p>
      </div>
    </main>
  );
}
