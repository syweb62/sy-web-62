"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateOrderTotals, validateOrderCalculation } from "@/lib/order-calculations"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

interface Order {
  id: string
  date: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  items: OrderItem[]
  subtotal: number
  tax: number
  delivery: number
  total: number
  deliveryType: "pickup" | "delivery"
}

interface OrderCardProps {
  order: Order
  onReorder?: (items: OrderItem[]) => void
}

const statusConfig = {
  pending: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
  confirmed: { color: "bg-blue-500", icon: CheckCircle, text: "Confirmed" },
  preparing: { color: "bg-orange-500", icon: Package, text: "Preparing" },
  ready: { color: "bg-green-500", icon: CheckCircle, text: "Ready" },
  delivered: { color: "bg-green-600", icon: Truck, text: "Delivered" },
  cancelled: { color: "bg-red-500", icon: XCircle, text: "Cancelled" },
}

// Helpers to prevent `.toFixed` on undefined/null
function safeNum(value: unknown): number {
  return typeof value === "number" && isFinite(value) ? value : 0
}
function money(value: unknown): string {
  return safeNum(value).toFixed(2)
}

export function OrderCard({ order, onReorder }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [calculationWarning, setCalculationWarning] = useState<string | null>(null)

  const statusInfo = (order?.status && (statusConfig as any)[order.status]) || statusConfig.confirmed
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-BD", {
        timeZone: "Asia/Dhaka",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date)
    } catch {
      return "Invalid Date"
    }
  }

  const items = Array.isArray(order?.items) ? order.items : []

  const recalculatedTotals = calculateOrderTotals({
    items: items.map((item) => ({
      price: safeNum(item?.price),
      quantity: typeof item?.quantity === "number" ? item.quantity : 1,
    })),
    discountRate: 0.15, // Assuming 15% discount was applied
    vatRate: 0.05,
    deliveryFee: 5,
    freeDeliveryThreshold: 875,
    paymentMethod: "delivery",
  })

  useEffect(() => {
    const validation = validateOrderCalculation(
      {
        subtotal: safeNum((order as any)?.subtotal),
        total: safeNum((order as any)?.total),
        discount: safeNum((order as any)?.discount),
      },
      recalculatedTotals,
    )

    if (!validation.isValid) {
      setCalculationWarning(`Calculation discrepancy detected: ${validation.errors.join(", ")}`)
      console.warn("[v0] Order calculation validation failed:", validation.errors)
    }
  }, [order, recalculatedTotals])

  const displaySubtotal = recalculatedTotals.subtotal
  const displayDiscount = recalculatedTotals.discountAmount
  const displayVat = recalculatedTotals.vatAmount
  const displayDelivery = recalculatedTotals.deliveryAmount
  const displayTotal = recalculatedTotals.finalTotal

  const canReorder = typeof onReorder === "function" && items.length > 0
  const handleReorder = () => {
    if (canReorder) {
      onReorder!(items)
    }
  }

  return (
    <div className="bg-black/30 rounded-lg border border-gray-800 p-6">
      {calculationWarning && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">⚠️ Calculation corrected: {calculationWarning}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-medium text-lg">Order {order?.id ?? "—"}</h3>
            <p className="text-gray-400 text-sm">{formatDate(order?.date as any)}</p>
          </div>
          <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
            <StatusIcon size={14} />
            {statusInfo.text}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-400">
              {"৳"}
              {money(displayTotal)}
            </p>
            <p className="text-gray-400 text-sm">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={handleReorder}
            size="sm"
            disabled={!canReorder}
            aria-disabled={!canReorder}
            title={canReorder ? "Reorder these items" : "Reorder unavailable"}
          >
            Reorder
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.slice(0, 2).map((item, idx) => {
          const qty = typeof item?.quantity === "number" ? item.quantity : 1
          const price = safeNum(item?.price)
          const lineTotal = price * qty
          return (
            <div key={item?.id ?? `item-${idx}`} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={
                    item?.image ||
                    "/placeholder.svg?height=48&width=48&query=sushi%20item%20thumbnail" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={item?.name || "Item"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item?.name || "Unknown Item"}</p>
                <p className="text-gray-400 text-sm">Qty: {qty}</p>
              </div>
              <p className="font-medium">
                {"৳"}
                {money(lineTotal)}
              </p>
            </div>
          )
        })}

        {items.length > 2 && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-center text-gray-400 hover:text-white"
          >
            {isExpanded ? (
              <>
                Hide Items <ChevronUp size={16} className="ml-1" />
              </>
            ) : (
              <>
                View All Items ({items.length - 2} more) <ChevronDown size={16} className="ml-1" />
              </>
            )}
          </Button>
        )}

        {isExpanded && items.length > 2 && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            {items.slice(2).map((item, idx) => {
              const qty = typeof item?.quantity === "number" ? item.quantity : 1
              const price = safeNum(item?.price)
              const lineTotal = price * qty
              return (
                <div key={item?.id ?? `expanded-${idx}`} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={
                        item?.image ||
                        "/placeholder.svg?height=48&width=48&query=sushi%20item%20thumbnail" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={item?.name || "Item"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item?.name || "Unknown Item"}</p>
                    <p className="text-gray-400 text-sm">Qty: {qty}</p>
                  </div>
                  <p className="font-medium">
                    {"৳"}
                    {money(lineTotal)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {isExpanded && (
          <div className="pt-4 border-t border-gray-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span>
                {"৳"}
                {money(displaySubtotal)}
              </span>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discount (15%)</span>
                <span className="text-green-400">
                  -{"৳"}
                  {money(displayDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">VAT (5%)</span>
              <span>
                {"৳"}
                {money(displayVat)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{order?.deliveryType === "delivery" ? "Delivery" : "Service Fee"}</span>
              <span>
                {"৳"}
                {money(displayDelivery)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className="text-yellow-400">
                {"৳"}
                {money(displayTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
