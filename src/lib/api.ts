import { useAuthStore } from "@/store/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Priorizar token de admin si es una ruta de admin
  let token = useAuthStore.getState().token;
  
  if (endpoint.startsWith("/admin")) {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) token = adminToken;
  }
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Error de red u operación fallida");
  }

  return response.json();
}
