// BookingStatusBadge — consistent status chip across all booking views

import { BookingStatus } from "@/types";

interface Props {
  status: BookingStatus;
  size?: "sm" | "md";
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function BookingStatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium status-${status} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
