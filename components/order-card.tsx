"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  onReorder: (items: OrderItem[]) => void
}

const statusConfig = {
  pending: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
  confirmed: { color: "bg-blue-500", icon: CheckCircle, text: "Confirmed" },
  preparing: { color: "bg-orange-500", icon: Package, text: "Preparing" },
  ready: { color: "bg-green-500", icon: CheckCircle, text: "Ready" },
  delivered: { color: "bg-green-600", icon: Truck, text: "Delivered" },
  cancelled: { color: "bg-red-500", icon: XCircle, text: "Cancelled" },
}

export function OrderCard({ order, onReorder }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const statusInfo = statusConfig[order.status]
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Safe number formatting with fallbacks
  const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
    const num = typeof value === 'number' && !isNaN(value) ? value : 0
    return num.toFixed(decimals)
  }

  const safeItems = Array.isArray(order.items) ? order.items : []
  const safeSubtotal = typeof order.subtotal === 'number' ? order.subtotal : 0
  const safeTax = typeof order.tax === 'number' ? order.tax : 0
  const safeDelivery = typeof order.delivery === 'number' ? order.delivery : 0
  const safeTotal = typeof order.total === 'number' ? order.total : 0

  return (
    <div className="bg-black/30 rounded-lg border border-gray-800 p-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-medium text-lg">Order {order.id}</h3>
            <p className="text-gray-400 text-sm">{formatDate(order.date)}</p>
          </div>
          <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
            <StatusIcon size={14} />
            {statusInfo.text}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-400">৳{safeToFixed(safeTotal)}</p>
            <p className="text-gray-400 text-sm">
              {safeItems.length} item{safeItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => onReorder(safeItems)} size="sm">
            Reorder
          </Button>
        </div>
      </div>

      {/* Items Preview */}
      <div className="space-y-3">
        {safeItems.slice(0, 2).map((item, index) => (
          <div key={item.id || index} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg?height=48&width=48"}
                alt={item.name || "Item"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name || "Unknown Item"}</p>
              <p className="text-gray-400 text-sm">Qty: {item.quantity || 1}</p>
            </div>
            <p className="font-medium">৳{safeToFixed((item.price || 0) * (item.quantity || 1))}</p>
          </div>
        ))}

        {safeItems.length > 2 && (
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
                View All Items ({safeItems.length - 2} more) <ChevronDown size={16} className="ml-1" />
              </>
            )}
          </Button>
        )}

        {/* Expanded Items */}
        {isExpanded && safeItems.length > 2 && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            {safeItems.slice(2).map((item, index) => (
              <div key={item.id || `expanded-${index}`} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg?height=48&width=48"}
                    alt={item.name || "Item"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name || "Unknown Item"}</p>
                  <p className="text-gray-400 text-sm">Qty: {item.quantity || 1}</p>
                </div>
                <p className="font-medium">৳{safeToFixed((item.price || 0) * (item.quantity || 1))}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order Summary */}
        {isExpanded && (
          <div className="pt-4 border-t border-gray-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span>৳{safeToFixed(safeSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">VAT</span>
              <span>৳{safeToFixed(safeTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{order.deliveryType === "delivery" ? "Delivery" : "Service Fee"}</span>
              <span>৳{safeToFixed(safeDelivery)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className="text-yellow-400">৳{safeToFixed(safeTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
