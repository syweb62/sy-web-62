"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Printer, Eye } from "lucide-react"
import { useNotifications } from "@/context/notification-context"
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
  const { orders: realtimeOrders, loading: realtimeLoading } = useRealtimeOrders()
  const orders = propOrders || realtimeOrders
  const loading = propLoading !== undefined ? propLoading : realtimeLoading

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const { addNotification } = useNotifications()

  const notifySystem = (title: string, message: string, priority: "low" | "medium" | "high") => {
    addNotification({
      type: "info",
      title,
      message,
      priority,
    })
  }

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
  }, [orders])

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
      console.log("[v0] Enhanced table updating order status:", { orderId, newStatus })

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()
      console.log("[v0] Enhanced table status update response:", result)

      if (response.ok) {
        notifySystem("Success", `Order status updated to ${newStatus}`, "medium")
        if (onStatusUpdate) {
          onStatusUpdate(orderId, newStatus)
        }
      } else {
        throw new Error(result.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("[v0] Enhanced table error updating order status:", error)
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
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      case "delivered":
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "confirmed":
      case "preparing":
        return "Preparing"
      case "ready":
        return "Ready"
      case "delivered":
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
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
      </div>

      <div className="bg-white rounded-lg border">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm text-gray-600">
          <div className="col-span-1">Order ID</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Items</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {filteredOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
              {/* Order ID Column */}
              <div className="col-span-1">
                <div className="font-medium text-sm">{order.short_order_id || `ORD-${order.id.slice(0, 4)}`}</div>
              </div>

              {/* Customer Column */}
              <div className="col-span-3">
                <div className="space-y-1">
                  <div className="font-medium text-sm">{order.customer_name}</div>
                  <div className="text-xs text-gray-500">Payment: Cash</div>
                  <div className="text-xs text-gray-500">{order.phone}</div>
                  <div className="text-xs text-gray-500">{order.address}</div>
                </div>
              </div>

              {/* Items Column */}
              <div className="col-span-2">
                <div className="space-y-1">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-blue-600">{item.item_name}</span>
                      <span className="text-gray-500 ml-1">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Column */}
              <div className="col-span-1">
                <div className="font-medium text-sm">{formatBangladeshiTaka(order.total_price)}</div>
              </div>

              {/* Status Column */}
              <div className="col-span-1">
                <Badge className={`${getStatusColor(order.status)} border`}>{getStatusText(order.status)}</Badge>
              </div>

              {/* Date & Time Column */}
              <div className="col-span-2">
                <div className="space-y-1">
                  {/* Timer Display */}
                  {(order.status === "confirmed" || order.status === "preparing") && (
                    <div className={`text-xs font-mono ${timers[order.id] <= 0 ? "text-red-600" : "text-green-600"}`}>
                      {getTimeRemaining(order.id)}
                    </div>
                  )}
                  <div className="text-sm">{new Date(order.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Actions Column */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handlePrint(order)}>
                    <Printer className="h-4 w-4" />
                  </Button>

                  {/* Status Dropdown */}
                  <Select value={order.status} onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value="preparing">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Preparing
                        </span>
                      </SelectItem>
                      <SelectItem value="ready">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Ready
                        </span>
                      </SelectItem>
                      <SelectItem value="completed">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          Completed
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">No orders found matching your criteria.</div>
      )}
    </div>
  )
}
