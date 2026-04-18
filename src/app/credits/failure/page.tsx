import Link from "next/link";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FailurePage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-4 max-w-lg mx-auto text-center flex flex-col items-center">
      <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-8 border-2 border-red-500/30 animate-in zoom-in duration-500">
        <AlertCircle className="w-12 h-12" />
      </div>

      <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Pago fallido</h1>
      <p className="text-lg text-muted-foreground mb-10">
        No pudimos procesar tu transacción. Por favor, verifica tu método de pago e intenta nuevamente.
      </p>

      <Link href="/credits/buy" className="w-full">
        <Button className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-0 text-white font-bold text-lg transition-colors">
          <RefreshCcw className="w-5 h-5 mr-2" />
          Reintentar compra
        </Button>
      </Link>
    </main>
  );
}
