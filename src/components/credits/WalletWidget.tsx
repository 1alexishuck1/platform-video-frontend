"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { useCreditsStore } from "@/store/credits";
import { useHydratedAuth } from "@/store/auth";

export function WalletWidget() {
  const { isAuthenticated, isHydrated } = useHydratedAuth();
  const { balance, isLoading, fetchBalance } = useCreditsStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <Link
      href="/credits/buy"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <Wallet className="w-4 h-4 text-violet-400" />
      {isLoading || balance === null ? (
        <div className="w-8 h-4 bg-white/10 animate-pulse rounded" />
      ) : (
        <span className="text-sm font-bold text-white">{balance.toLocaleString("es-AR")}</span>
      )}
    </Link>
  );
}
