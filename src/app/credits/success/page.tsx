"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreditsStore } from "@/store/credits";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const credits = searchParams?.get("credits") || "0";
  const { fetchBalance } = useCreditsStore();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    fetchBalance();
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchBalance, router]);

  return (
    <main className="min-h-screen pt-32 pb-12 px-4 max-w-lg mx-auto text-center flex flex-col items-center">
      <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-8 border-2 border-green-500/30 shadow-[0_0_40px_-5px_rgba(34,197,94,0.3)] animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">¡Pago exitoso!</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Tu transacción se completó correctamente. Se han acreditado{" "}
        <span className="font-bold text-violet-400">{Number(credits).toLocaleString("es-AR")}</span>{" "}
        créditos a tu cuenta.
      </p>

      <p className="text-sm text-muted-foreground mb-4 font-medium animate-pulse">
        Serás redirigido al inicio en <span className="font-bold text-white">{countdown}</span> segundos...
      </p>

      <Link href="/" className="w-full">
        <Button className="w-full h-14 rounded-2xl btn-gradient border-0 text-white font-bold text-lg">
          <Home className="w-5 h-5 mr-2" />
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
