"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Printer, Clock, Check, X, ChefHat, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Order {
  order_id: string
  short_order_id: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  total_price: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  created_at: string
  special_instructions?: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

interface EnhancedOrdersTableProps {
  orders?: Order[]
  onStatusUpdate?: (orderId: string, newStatus: string) => void
  onRefresh?: () => void
  userRole?: "admin" | "manager"
}

const EnhancedOrdersTable = ({
  orders = [],
  onStatusUpdate,
  onRefresh,
  userRole = "manager",
}: EnhancedOrdersTableProps) => {
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  useEffect(() => {
    if (orders.length === 0) return

    const updateTimers = () => {
      const currentTime = Date.now()
      const newTimers: { [key: string]: number } = {}

      orders.forEach((order) => {
        if (order.status !== "ready" && order.status !== "completed" && order.status !== "cancelled") {
          const created = new Date(order.created_at)
          const twentyMinutes = 20 * 60 * 1000
          const elapsed = currentTime - created.getTime()
          const remaining = twentyMinutes - elapsed
          newTimers[order.order_id] = remaining
        }
      })

      setTimers(newTimers)
    }

    updateTimers()
    timerIntervalRef.current = setInterval(updateTimers, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [orders])

  useEffect(() => {
    const subscription = supabase
      .channel("enhanced-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("[v0] Real-time order update received:", payload)

          // Trigger refresh to get updated data
          if (onRefresh) {
            onRefresh()
          }

          // Handle timer updates for status changes
          if (payload.eventType === "UPDATE" && payload.new) {
            const newStatus = payload.new.status
            const orderId = payload.new.order_id

            if (newStatus === "ready" || newStatus === "completed" || newStatus === "cancelled") {
              setTimers((prev) => {
                const newTimers = { ...prev }
                delete newTimers[orderId]
                return newTimers
              })
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Real-time subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
      subscription.unsubscribe()
    }
  }, [onRefresh])

  const formatTimer = (milliseconds: number) => {
    const totalSeconds = Math.abs(Math.floor(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const sign = milliseconds < 0 ? "-" : ""
    return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTimerColor = (milliseconds: number) => {
    if (milliseconds < 0) return "text-red-400 bg-red-900/30 border-red-500/50"
    if (milliseconds < 300000) return "text-yellow-400 bg-yellow-900/30 border-yellow-500/50" // 5 minutes warning
    return "text-green-400 bg-green-900/30 border-green-500/50"
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Prevent multiple simultaneous updates
    if (updatingOrders.has(orderId)) {
      console.log("[v0] Update already in progress for order:", orderId)
      return
    }

    try {
      setUpdatingOrders((prev) => new Set(prev).add(orderId))
      console.log(`[v0] Updating order status: ${orderId} to ${newStatus}`)

      // Optimistic update - update UI immediately
      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus)
      }

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (error) {
        console.error("[v0] Error updating order status:", error.message)
        // Revert optimistic update on error
        if (onRefresh) {
          onRefresh()
        }
        throw error
      }

      if (newStatus === "ready" || newStatus === "completed" || newStatus === "cancelled") {
        setTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[orderId]
          return newTimers
        })
      }

      console.log(`[v0] Order status updated successfully: ${orderId} -> ${newStatus}`)

      // Refresh data to ensure consistency
      if (onRefresh) {
        setTimeout(onRefresh, 500) // Small delay to ensure database is updated
      }
    } catch (error) {
      console.error("[v0] Failed to update order status:", error)
      // Show user-friendly error message
      alert(`Failed to update order status. Please try again.`)
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-blue-500 text-white",
      confirmed: "bg-cyan-500 text-white",
      preparing: "bg-orange-500 text-white",
      ready: "bg-green-500 text-white",
      completed: "bg-purple-500 text-white",
      cancelled: "bg-red-500 text-white",
    }

    return (
      <Badge className={`${colors[status as keyof typeof colors] || "bg-gray-500 text-white"} px-3 py-1`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handlePrint = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <html>
        <head>
          <title>Order ${order.short_order_id}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .order-info { margin: 20px 0; }
            .items { margin: 20px 0; }
            .total { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SUSHI YAKI RESTAURANT</h2>
            <p>Order #${order.short_order_id}</p>
          </div>
          <div class="order-info">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Payment:</strong> ${order.payment_method}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          <div class="items">
            <h3>Items:</h3>
            ${order.order_items
              .map((item) => `<p>${item.item_name} x${item.quantity} - ৳${item.price_at_purchase}</p>`)
              .join("")}
          </div>
          <div class="total">
            <p>Total: ৳${order.total_price}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const getStatusActions = (order: Order) => {
    const isUpdating = updatingOrders.has(order.order_id)

    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate(order.order_id, "confirmed")}
              size="sm"
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1" />
              {isUpdating ? "..." : "Confirm"}
            </Button>
            <Button
              onClick={() => handleStatusUpdate(order.order_id, "cancelled")}
              size="sm"
              variant="destructive"
              disabled={isUpdating}
            >
              <X className="w-4 h-4 mr-1" />
              {isUpdating ? "..." : "Cancel"}
            </Button>
          </div>
        )

      case "confirmed":
        return (
          <Button
            onClick={() => handleStatusUpdate(order.order_id, "preparing")}
            size="sm"
            disabled={isUpdating}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
          >
            <ChefHat className="w-4 h-4 mr-1" />
            {isUpdating ? "..." : "Start Preparing"}
          </Button>
        )

      case "preparing":
        return (
          <Button
            onClick={() => handleStatusUpdate(order.order_id, "ready")}
            size="sm"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Truck className="w-4 h-4 mr-1" />
            {isUpdating ? "..." : "Mark Ready"}
          </Button>
        )

      case "ready":
        return (
          <Button
            onClick={() => handleStatusUpdate(order.order_id, "completed")}
            size="sm"
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-1" />
            {isUpdating ? "..." : "Complete"}
          </Button>
        )

      case "completed":
      case "cancelled":
        return (
          <Badge className="bg-gray-600 text-white px-3 py-1">
            {order.status === "completed" ? "Order Completed" : "Order Cancelled"}
          </Badge>
        )

      default:
        return null
    }
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Orders Found</h3>
        <p className="text-gray-500 mb-4">Orders will appear here when customers place them.</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh Orders
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Orders ({orders.length})</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time Connected
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.order_id}
            className="relative bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900/70 transition-colors"
          >
            {timers[order.order_id] !== undefined && (
              <div
                className={`absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${getTimerColor(timers[order.order_id])}`}
              >
                {formatTimer(timers[order.order_id])}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              {/* Order ID */}
              <div className="md:col-span-1 relative">
                <div className="text-sm text-gray-400">Order ID</div>
                <div className="font-mono text-white">{order.short_order_id}</div>
              </div>

              {/* Customer Info */}
              <div className="md:col-span-2">
                <div className="text-sm text-gray-400">Customer</div>
                <div className="text-white font-medium">{order.customer_name}</div>
                <div className="text-sm text-gray-400">Payment: {order.payment_method}</div>
                <div className="text-sm text-gray-400">{order.phone}</div>
                <div className="text-sm text-gray-400">{order.address}</div>
              </div>

              {/* Items */}
              <div className="md:col-span-1">
                <div className="text-sm text-gray-400">Items</div>
                <div className="space-y-1">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="text-sm text-white">
                      {item.item_name} x{item.quantity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="md:col-span-1">
                <div className="text-sm text-gray-400">Date & Time</div>
                <div className="text-sm text-white">
                  <div className="font-medium">Placed:</div>
                  <div className="text-xs text-gray-300">{formatDateTime(order.created_at)}</div>
                  <div className="text-xs text-gray-400">{getRelativeTime(order.created_at)}</div>
                  {(order.status === "ready" || order.status === "completed") && (
                    <div className="mt-2">
                      <div className="font-medium text-green-400">Ready:</div>
                      <div className="text-xs text-green-300">{order.status === "ready" ? "Now" : "Completed"}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Status */}
              <div className="md:col-span-1">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-lg font-semibold text-white">৳{order.total_price}</div>
                <div className="mt-2">{getStatusBadge(order.status)}</div>
              </div>

              {/* Actions */}
              <div className="md:col-span-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`/dashboard/orders/${order.order_id}`, "_blank")}
                    size="sm"
                    variant="outline"
                    className="p-2"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handlePrint(order)} size="sm" variant="outline" className="p-2">
                    <Printer className="w-4 h-4" />
                  </Button>
                  {userRole === "admin" && (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                      disabled={updatingOrders.has(order.order_id)}
                      className="px-2 py-1 text-xs bg-gradient-to-r from-amber-600 to-yellow-600 border border-amber-500 rounded text-white font-medium hover:from-amber-500 hover:to-yellow-500 transition-all duration-200 cursor-pointer min-w-[90px] max-w-[100px] disabled:opacity-50"
                    >
                      <option value="pending" className="bg-gray-800 text-blue-300">
                        📋 Pending
                      </option>
                      <option value="confirmed" className="bg-gray-800 text-cyan-300">
                        ✅ Confirmed
                      </option>
                      <option value="preparing" className="bg-gray-800 text-orange-300">
                        👨‍🍳 Preparing
                      </option>
                      <option value="ready" className="bg-gray-800 text-green-300">
                        🚚 Ready
                      </option>
                      <option value="completed" className="bg-gray-800 text-purple-300">
                        ✨ Completed
                      </option>
                      <option value="cancelled" className="bg-gray-800 text-red-300">
                        ❌ Cancelled
                      </option>
                    </select>
                  )}
                </div>

                {getStatusActions(order)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { EnhancedOrdersTable }
