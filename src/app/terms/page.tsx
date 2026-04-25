"use client";
// Página de Términos y Condiciones
// Diseño premium, minimalista y enfocado en la legibilidad.

import Link from "next/link";
import { ChevronLeft, ScrollText, ShieldCheck, Scale, FileWarning, HelpCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      id: "behavior",
      title: "1. Comportamiento y Convivencia",
      icon: ShieldCheck,
      content: "PlatfomLive es una comunidad basada en el respeto. Queda estrictamente prohibido cualquier tipo de acoso, lenguaje de odio, contenido pornográfico no solicitado o spam. El incumplimiento de estas normas resultará en la suspensión inmediata de la cuenta."
    },
    {
      id: "suspensions",
      title: "2. Suspensiones y Bloqueos",
      icon: Scale,
      content: "La administración se reserva el derecho de pausar, suspender temporalmente o bloquear de forma permanente cualquier cuenta que viole los términos de uso. Las sanciones pueden ser de 24 horas, 7 días, 30 días o permanentes, dependiendo de la gravedad de la falta."
    },
    {
      id: "appeals",
      title: "3. Sistema de Descargos",
      icon: FileWarning,
      content: "Todo usuario sancionado tiene derecho a presentar un único descargo por sanción a través de la plataforma. La decisión del equipo de administración tras revisar el descargo es final y vinculante."
    },
    {
      id: "payments",
      title: "4. Pagos y Créditos",
      icon: ScrollText,
      content: "Los créditos comprados no son reembolsables una vez utilizados. En caso de bloqueo permanente por violación de términos, el saldo restante en la cuenta puede ser confiscado si se determina que fue obtenido o utilizado para fines fraudulentos."
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
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-violet-400">
              <ScrollText className="w-6 h-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Términos y Condiciones</h1>
          </div>
          <p className="text-white/40 max-w-2xl text-lg">
            Última actualización: 22 de abril, 2026. Por favor, leé detenidamente nuestras reglas para garantizar una experiencia segura para todos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-12">
          {sections.map((section) => (
            <section key={section.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-5 h-5 text-violet-400" />
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
            <span>¿Tenés dudas sobre el reglamento?</span>
          </div>
          <Link 
            href="mailto:soporte@platfomlive.com" 
            className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-colors"
          >
            Contactar a soporte
          </Link>
        </div>
      </div>

      <div className="py-12 bg-white/[0.01] border-t border-white/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          PlatfomLive &copy; 2026 • Todos los derechos reservados
        </p>
      </div>
    </main>
  );
}
