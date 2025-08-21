"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, Filter, Printer, Eye } from "lucide-react"
import { useNotificationSystem } from "@/hooks/use-notification-system"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"
import { formatBangladeshiTaka } from "@/lib/bangladesh-utils"

interface Order {
  id: string
  short_order_id?: string
  customer_name: string
  phone: string
  address: string
  total_price: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  created_at: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

export function EnhancedOrdersTable() {
  const { orders, loading } = useRealtimeOrders()
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const { notifySystem } = useNotificationSystem()

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev }
        orders.forEach((order) => {
          if (order.status === "confirmed" || order.status === "preparing") {
            const created = new Date(order.created_at)
            const now = new Date()
            const twentyMinutes = 20 * 60 * 1000
            const elapsed = now.getTime() - created.getTime()
            const remaining = twentyMinutes - elapsed
            newTimers[order.id] = remaining

            if (remaining <= 0 && prev[order.id] > 0) {
              notifySystem("Timer Alert", `Order ${order.short_order_id || order.id.slice(0, 8)} is overdue!`, "high")
            }
          } else {
            delete newTimers[order.id]
          }
        })
        return newTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [orders, notifySystem])

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.phone.includes(searchTerm) ||
          (order.short_order_id && order.short_order_id.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log("[v0] Updating order status:", { orderId, newStatus })

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()
      console.log("[v0] Status update response:", result)

      if (response.ok) {
        notifySystem("Success", `Order status updated to ${newStatus}`, "medium")
      } else {
        throw new Error(result.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("[v0] Error updating order status:", error)
      notifySystem("Error", "Failed to update order status", "high")
    }
  }

  const getTimeRemaining = (orderId: string) => {
    const remaining = timers[orderId] || 0

    if (remaining <= 0) {
      const overdue = Math.abs(remaining)
      const minutes = Math.floor(overdue / 60000)
      const seconds = Math.floor((overdue % 60000) / 1000)
      return `-${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePrint = (order: Order) => {
    const printContent = `
      SUSHI YAKI RESTAURANT
      =====================
      Order ID: ${order.short_order_id || order.id.slice(0, 8)}
      Date: ${new Date(order.created_at).toLocaleString()}
      
      Customer: ${order.customer_name}
      Phone: ${order.phone}
      Address: ${order.address}
      
      ITEMS:
      ${order.order_items
        .map(
          (item) =>
            `${item.quantity}x ${item.item_name} - ${formatBangladeshiTaka(item.price_at_purchase * item.quantity)}`,
        )
        .join("\n")}
      
      =====================
      TOTAL: ${formatBangladeshiTaka(order.total_price)}
      =====================
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order ${order.short_order_id || order.id.slice(0, 8)}</title>
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
    window.open(`/dashboard/orders/${order.id}`, "_blank")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "preparing":
        return "bg-orange-500"
      case "ready":
        return "bg-green-500"
      case "delivered":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading orders...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Orders Management</span>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                  <span className="font-mono text-sm">ID: {order.short_order_id || order.id.slice(0, 8)}</span>
                  {(order.status === "confirmed" || order.status === "preparing") && (
                    <div
                      className={`flex items-center gap-1 ${timers[order.id] <= 0 ? "text-red-600" : "text-orange-600"}`}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-mono">{getTimeRemaining(order.id)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">{order.phone}</p>
                  <p className="text-sm text-gray-500">{order.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <div className="space-y-1">
                    {order.order_items.map((item, index) => (
                      <p key={index} className="text-sm">
                        {item.quantity}x {item.item_name}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-bold text-lg text-green-600">{formatBangladeshiTaka(order.total_price)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {order.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "confirmed")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Confirm Order
                  </Button>
                )}
                {order.status === "confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark Ready
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Mark Delivered
                  </Button>
                )}
                {(order.status === "pending" || order.status === "confirmed") && (
                  <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
