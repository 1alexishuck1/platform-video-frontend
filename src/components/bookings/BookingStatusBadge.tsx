// BookingStatusBadge — consistent status chip across all booking views

import { BookingStatus } from "@/types";

interface Props {
  status: BookingStatus;
  size?: "sm" | "md";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function BookingStatusBadge({ status, size = "md" }: Props) {
  const s = (status || "pending").toLowerCase();
  const label = STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium status-${s} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {label}
    </span>
  );
}
