"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// Configuración global de React Query (Caché del lado del cliente)
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que la data se considera "fresca" (evita re-fetch innecesario)
            staleTime: 1000 * 60 * 5, // 5 minutos
            // Tiempo que la data permanece en caché antes de ser eliminada
            gcTime: 1000 * 60 * 60 * 24, // 24 horas
            // Re-intentos automáticos en caso de error
            retry: 1,
            // Re-fetch al enfocar la ventana (desactivado por rendimiento, activar si es crítico)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo visibles en desarrollo */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
