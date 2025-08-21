"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Order {
  order_id: string
  short_order_id: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  total_price: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  created_at: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

interface EnhancedOrdersTableProps {
  orders?: Order[]
  loading?: boolean
  onRefresh?: () => void
  onStatusUpdate?: (orderId: string, status: string) => void
}

export function EnhancedOrdersTable({
  orders: propOrders,
  loading: propLoading,
  onRefresh,
  onStatusUpdate,
}: EnhancedOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [timers, setTimers] = useState<{ [key: string]: number }>({})

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("orders")
        .select(`
          order_id,
          short_order_id,
          customer_name,
          phone,
          address,
          payment_method,
          total_price,
          status,
          created_at,
          order_items (
            item_name,
            quantity,
            price_at_purchase
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!propOrders) {
      fetchOrders()
    } else {
      setOrders(propOrders)
      setLoading(propLoading || false)
    }
  }, [propOrders, propLoading])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev }
        orders.forEach((order) => {
          if (order.status === "preparing" || order.status === "ready") {
            const created = new Date(order.created_at)
            const now = new Date()
            const twentyMinutes = 20 * 60 * 1000
            const elapsed = now.getTime() - created.getTime()
            const remaining = twentyMinutes - elapsed
            newTimers[order.order_id] = remaining
          } else {
            delete newTimers[order.order_id]
          }
        })
        return newTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [orders])

  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel("enhanced-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time order change detected:", payload)
        if (!propOrders) {
          fetchOrders()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [propOrders])

  const formatTimer = (orderId: string) => {
    const remaining = timers[orderId] || 0

    if (remaining <= 0) {
      const overdue = Math.abs(remaining)
      const minutes = Math.floor(overdue / 60000)
      const seconds = Math.floor((overdue % 60000) / 1000)
      return {
        display: `-${minutes}:${seconds.toString().padStart(2, "0")}`,
        color: "text-red-400",
      }
    }

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return {
      display: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      color: remaining < 300000 ? "text-yellow-400" : "text-green-400", // 5 minutes warning
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log("[v0] Updating order status:", orderId, "to", newStatus)
      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("order_id", orderId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((order) => (order.order_id === orderId ? { ...order, status: newStatus as any } : order)),
      )

      // Clear timer if order is completed
      if (newStatus === "completed") {
        setTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[orderId]
          return newTimers
        })
      }

      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus)
      }

      console.log("[v0] Order status updated successfully")
    } catch (error) {
      console.error("[v0] Error updating order status:", error)
      alert("Failed to update order status. Please try again.")
    }
  }

  const handlePrint = (order: Order) => {
    const printContent = `
SUSHI YAKI RESTAURANT
=====================
Order ID: ${order.short_order_id}
Date: ${new Date(order.created_at).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}

Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}
Payment: ${order.payment_method}

ITEMS:
${order.order_items
  .map((item) => `${item.item_name} x${item.quantity} - BDT ${(item.price_at_purchase * item.quantity).toFixed(0)}`)
  .join("\n")}

=====================
TOTAL: BDT ${order.total_price.toFixed(0)}
=====================
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order ${order.short_order_id}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleViewOrder = (order: Order) => {
    window.open(`/dashboard/orders/${order.order_id}`, "_blank")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Preparing</Badge>
      case "ready":
        return <Badge className="bg-pink-500 text-white hover:bg-pink-600">Ready</Badge>
      case "completed":
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Completed</Badge>
      case "pending":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Pending</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{status}</Badge>
    }
  }

  const getStatusDropdown = (order: Order) => {
    const statusColor =
      {
        preparing: "bg-orange-500 text-white",
        ready: "bg-pink-500 text-white",
        completed: "bg-gray-500 text-white",
        pending: "bg-blue-500 text-white",
      }[order.status] || "bg-gray-500 text-white"

    return (
      <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.order_id, value)}>
        <SelectTrigger className={`w-32 ${statusColor} border-none`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          <SelectItem value="pending" className="text-white hover:bg-blue-500">
            🔵 Pending
          </SelectItem>
          <SelectItem value="preparing" className="text-white hover:bg-orange-500">
            🟠 Preparing
          </SelectItem>
          <SelectItem value="ready" className="text-white hover:bg-pink-500">
            🟣 Ready
          </SelectItem>
          <SelectItem value="completed" className="text-white hover:bg-gray-500">
            ✅ Completed
          </SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="text-white">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-4 p-4 bg-gray-800 text-gray-300 text-sm font-medium">
        <div>Order ID</div>
        <div>Customer</div>
        <div>Items</div>
        <div>Total</div>
        <div>Status</div>
        <div>Date & Time</div>
        <div>Actions</div>
      </div>

      <div className="divide-y divide-gray-700">
        {orders.map((order) => {
          const timer = formatTimer(order.order_id)
          return (
            <div
              key={order.order_id}
              className="grid grid-cols-7 gap-4 p-4 text-white hover:bg-gray-800/50 transition-colors relative"
            >
              {/* Timer in top right corner */}
              {(order.status === "preparing" || order.status === "ready") && (
                <div className={`absolute top-2 right-2 text-sm font-mono ${timer.color} z-10`}>{timer.display}</div>
              )}

              {/* Order ID */}
              <div className="font-mono text-sm">{order.short_order_id}</div>

              {/* Customer */}
              <div className="space-y-1">
                <div className="font-medium">{order.customer_name}</div>
                <div className="text-sm text-gray-400">Payment: {order.payment_method}</div>
                <div className="text-sm text-gray-400">{order.phone}</div>
                <div className="text-sm text-gray-400">{order.address}</div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {order.order_items.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    {item.item_name} x{item.quantity}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="font-medium">
                BDT {order.total_price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </div>

              {/* Status */}
              <div>{getStatusBadge(order.status)}</div>

              {/* Date & Time */}
              <div className="space-y-1">
                <div className="text-sm">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(order.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                  className="text-gray-400 hover:text-white"
                  title="View Order Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrint(order)}
                  className="text-gray-400 hover:text-white"
                  title="Print Order"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                {getStatusDropdown(order)}
              </div>
            </div>
          )
        })}
      </div>

      {orders.length === 0 && <div className="p-8 text-center text-gray-400">No orders found</div>}
    </div>
  )
}
