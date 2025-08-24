"use client"

import { Badge } from "@/components/ui/badge"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "confirmed"

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500 text-black" },
  processing: { label: "Processing", className: "bg-blue-500 text-white" },
  completed: { label: "Completed", className: "bg-green-600 text-white" },
  cancelled: { label: "Cancelled", className: "bg-red-600 text-white" },
  confirmed: { label: "Confirmed", className: "bg-green-500 text-white" },
}

export function OrderStatusBadge({ status = "pending" as OrderStatus }) {
  const s = statusStyles[status] ?? statusStyles.pending
  return <Badge className={s.className}>{s.label}</Badge>
}
