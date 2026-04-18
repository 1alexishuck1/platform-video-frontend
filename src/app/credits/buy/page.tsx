"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, Wallet, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 1 token = $1.000 ARS — efecto ancla: el usuario percibe un precio más accesible.
const PACKAGES = [
  { id: "starter", name: "Starter", price: 5000, credits: 5 },
  { id: "popular", name: "Popular", price: 10000, credits: 10, badge: "Más popular" },
  { id: "pro", name: "Pro", price: 20000, credits: 21, badge: "+1 token extra" },
  { id: "max", name: "Max", price: 50000, credits: 55, badge: "+5 tokens extra" },
];

export default function BuyCreditsPage() {
  const router = useRouter();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!selectedPkg) return;
    setLoading(true);
    try {
      const res = await apiFetch("/credits/checkout", {
        method: "POST",
        body: JSON.stringify({ packageId: selectedPkg }),
      });
      window.location.href = res.checkoutUrl;
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al procesar tu compra de créditos.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 max-w-3xl mx-auto flex flex-col relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-6 left-4 md:left-0 rounded-full hover:bg-white/10"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <header className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)] border border-violet-500/20">
          <Wallet className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-white">
          Comprar créditos
        </h1>
        <p className="text-muted-foreground text-[15px] md:text-base max-w-sm mx-auto">
          Recarga tu saldo para reservar sesiones con tus creadores favoritos.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PACKAGES.map((pkg, index) => {
          const isSelected = selectedPkg === pkg.id;
          return (
            <Card
              key={pkg.id}
              onClick={() => setSelectedPkg(pkg.id)}
              className={cn(
                "relative p-5 md:p-6 cursor-pointer transition-all duration-300 border-2 overflow-hidden group hover:-translate-y-1",
                isSelected
                  ? "border-violet-500 bg-violet-500/10 shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]"
                  : "border-white/5 bg-white/5 hover:border-white/20"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {pkg.badge && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold text-[10px] uppercase rounded-bl-xl text-white shadow-lg">
                  {pkg.badge}
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-white">{pkg.name}</h3>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "border-violet-500 bg-violet-500"
                      : "border-muted-foreground/30 bg-black/20 group-hover:border-muted-foreground/60"
                  )}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-end gap-2">
                  <span className="text-3xl md:text-4xl font-black text-white leading-none">
                    {pkg.credits}
                  </span>
                  <span className="text-lg font-bold text-violet-400 mb-0.5">tokens</span>
                </div>
                <span className="text-sm font-medium text-white/40">
                  1 token = $1.000 ARS
                </span>
              </div>

              <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Pago único</span>
                <span className="text-xl font-bold text-white">
                  ${pkg.price.toLocaleString("es-AR")} ARS
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="max-w-sm mx-auto w-full z-10 flex flex-col gap-3">
        <Button
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all border-0",
            selectedPkg 
              ? "btn-gradient text-white shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]" 
              : "bg-white/10 text-muted-foreground"
          )}
          disabled={!selectedPkg || loading}
          onClick={handleCheckout}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            <Wallet className="w-5 h-5 mr-2" />
          )}
          {loading ? "Procesando..." : "Continuar al pago"}
        </Button>

        <Button
          variant="ghost"
          className="w-full h-12 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5"
          onClick={() => router.back()}
          disabled={loading}
        >
          Volver atrás
        </Button>
      </div>
    </main>
  );
}
