"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Printer, Clock, AlertTriangle, Check, X, ChefHat, Truck } from "lucide-react"
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
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [masterControlEnabled, setMasterControlEnabled] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastNotificationTime = useRef(0)
  const supabase = createClient()

  useEffect(() => {
    if (orders.length === 0) return

    const updateTimers = () => {
      const currentTime = Date.now()
      const newTimers: { [key: string]: number } = {}

      orders.forEach((order) => {
        if (order.status === "preparing" || order.status === "ready") {
          const created = new Date(order.created_at)
          const twentyMinutes = 20 * 60 * 1000
          const elapsed = currentTime - created.getTime()
          const remaining = twentyMinutes - elapsed
          newTimers[order.order_id] = remaining

          // Sound notification for overdue orders
          if (remaining <= 0 && soundEnabled && currentTime - lastNotificationTime.current > 30000) {
            playNotificationSound()
            lastNotificationTime.current = currentTime
          }
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
  }, [orders, soundEnabled])

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3")
    audio.play().catch(() => {
      // Fallback to system beep
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.2)
    })
  }

  const formatTimer = (milliseconds: number) => {
    const totalSeconds = Math.abs(Math.floor(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const sign = milliseconds < 0 ? "-" : ""
    return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTimerColor = (milliseconds: number) => {
    if (milliseconds < 0) return "text-red-400"
    if (milliseconds < 300000) return "text-yellow-400" // 5 minutes warning
    return "text-green-400"
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[v0] Updating order status: ${orderId} to ${newStatus}`)

      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("order_id", orderId)

      if (error) {
        console.error("[v0] Error updating order status:", error.message)
        throw error
      }

      // Clear timer for completed/cancelled orders
      if (newStatus === "completed" || newStatus === "cancelled") {
        setTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[orderId]
          return newTimers
        })
      }

      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus)
      }

      console.log(`[v0] Order status updated successfully: ${orderId} -> ${newStatus}`)
    } catch (error) {
      console.error("[v0] Failed to update order status:", error)
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

  const getMasterControlActions = (order: Order) => {
    if (!masterControlEnabled || userRole !== "admin") return null

    if (order.status === "cancelled") {
      return (
        <Button
          onClick={() => handleStatusUpdate(order.order_id, "completed")}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white ml-2"
        >
          <Check className="w-4 h-4 mr-1" />
          Mark Complete
        </Button>
      )
    }

    if (order.status === "completed") {
      return (
        <Button
          onClick={() => handleStatusUpdate(order.order_id, "cancelled")}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white ml-2"
        >
          <X className="w-4 h-4 mr-1" />
          Mark Cancelled
        </Button>
      )
    }

    return null
  }

  const getStatusActions = (order: Order) => {
    const normalActions = (() => {
      switch (order.status) {
        case "pending":
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusUpdate(order.order_id, "confirmed")}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm
              </Button>
              <Button onClick={() => handleStatusUpdate(order.order_id, "cancelled")} size="sm" variant="destructive">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )

        case "confirmed":
          return (
            <Button
              onClick={() => handleStatusUpdate(order.order_id, "preparing")}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ChefHat className="w-4 h-4 mr-1" />
              Start Preparing
            </Button>
          )

        case "preparing":
          return (
            <Button
              onClick={() => handleStatusUpdate(order.order_id, "ready")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Truck className="w-4 h-4 mr-1" />
              Mark Ready
            </Button>
          )

        case "ready":
          return (
            <Button
              onClick={() => handleStatusUpdate(order.order_id, "completed")}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Complete
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
    })()

    const masterActions = getMasterControlActions(order)

    return (
      <div className="flex flex-col gap-2">
        {normalActions}
        {masterActions}
      </div>
    )
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
          {userRole === "admin" && (
            <Button
              onClick={() => setMasterControlEnabled(!masterControlEnabled)}
              variant="outline"
              size="sm"
              className={
                masterControlEnabled
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                  : "bg-gray-500/10 border-gray-500/30"
              }
            >
              🔧 Master Control {masterControlEnabled ? "ON" : "OFF"}
            </Button>
          )}
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="sm"
            className={soundEnabled ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
          >
            {soundEnabled ? "🔊" : "🔇"} Sound
          </Button>
        </div>
      </div>

      {masterControlEnabled && userRole === "admin" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Master Control Active</span>
          </div>
          <p className="text-xs text-yellow-300 mt-1">
            You can now override order statuses. Cancelled orders can be marked as completed and vice versa.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.order_id}
            className="relative bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900/70 transition-colors"
          >
            {/* Timer in top-right corner */}
            {(order.status === "preparing" || order.status === "ready") && timers[order.order_id] !== undefined && (
              <div className={`absolute top-3 right-3 text-sm font-mono ${getTimerColor(timers[order.order_id])}`}>
                {timers[order.order_id] < 0 && <AlertTriangle className="inline w-4 h-4 mr-1" />}
                {formatTimer(timers[order.order_id])}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* Order ID */}
              <div className="md:col-span-1">
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
