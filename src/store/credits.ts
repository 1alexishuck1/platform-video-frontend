import { create } from "zustand";
import { apiFetch } from "@/lib/api";

interface CreditsStore {
  balance: number | null;
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  balance: null,
  isLoading: true,
  fetchBalance: async () => {
    try {
      set({ isLoading: true });
      const res = await apiFetch("/credits/balance");
      set({ balance: res.balance, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch balance", error);
      set({ isLoading: false, balance: 0 }); // Fallback on error
    }
  },
}));
