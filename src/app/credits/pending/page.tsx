import Link from "next/link";
import { Clock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-4 max-w-lg mx-auto text-center flex flex-col items-center">
      <div className="w-24 h-24 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-8 border-2 border-yellow-500/30 animate-in zoom-in duration-500">
        <Clock className="w-12 h-12" />
      </div>

      <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Pago pendiente</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Tu transacción está siendo procesada. Esto puede demorar hasta 24 horas dependiendo del medio de pago utilizado.
      </p>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl w-full mb-10 text-left">
        <p className="text-sm font-medium text-muted-foreground mb-3 text-center">¿Qué sigue?</p>
        <ul className="space-y-3 text-sm text-white/80">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
            Recibirás una notificación cuando el pago se confirme.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
            Los créditos se acreditarán automáticamente en tu cuenta.
          </li>
        </ul>
      </div>

      <Link href="/" className="w-full">
        <Button className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-0 text-white font-bold text-lg transition-colors">
          <Home className="w-5 h-5 mr-2" />
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
