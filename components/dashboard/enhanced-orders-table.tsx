"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Printer, Check, X, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Order {
  order_id: string
  short_order_id: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  total_price: number
  status: "confirmed" | "cancelled" | "pending" | "completed"
  created_at: string
  updated_at?: string
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
  loading?: boolean
}

const EnhancedOrdersTable = ({
  orders = [],
  onStatusUpdate,
  onRefresh,
  userRole = "manager",
  loading = false,
}: EnhancedOrdersTableProps) => {
  const [displayOrders, setDisplayOrders] = useState<Order[]>(orders)
  const supabase = createClient()

  const getOrderId = (order: Order): string => {
    return order.short_order_id || order.order_id || ""
  }

  useEffect(() => {
    setDisplayOrders(orders)
  }, [orders])

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        timeZone: "Asia/Dhaka",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }, [])

  const getRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log("[v0] Button clicked - Order ID:", orderId, "New Status:", newStatus)

    if (!orderId) {
      console.log("[v0] Error: No order ID provided")
      return
    }

    try {
      console.log("[v0] Making API call to update order status...")

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      console.log("[v0] API response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("[v0] API response data:", responseData)

        // Update local state immediately
        setDisplayOrders((prev) =>
          prev.map((order) =>
            getOrderId(order) === orderId
              ? { ...order, status: newStatus as Order["status"], updated_at: new Date().toISOString() }
              : order,
          ),
        )

        console.log("[v0] Local state updated successfully")

        // Dispatch events for cross-window communication
        const eventData = { orderId, newStatus, timestamp: new Date().toISOString() }
        window.dispatchEvent(new CustomEvent("orderStatusChanged", { detail: eventData }))

        try {
          localStorage.setItem("orderStatusUpdate", JSON.stringify(eventData))
          setTimeout(() => localStorage.removeItem("orderStatusUpdate"), 500)
        } catch (e) {
          console.log("[v0] localStorage error (ignored):", e)
        }

        if (onStatusUpdate) {
          onStatusUpdate(orderId, newStatus)
        }

        console.log("[v0] Order status update completed successfully")
      } else {
        const errorData = await response.text()
        console.log("[v0] API error response:", errorData)
      }
    } catch (error) {
      console.error("[v0] Failed to update order status:", error)
    }
  }

  useEffect(() => {
    const subscription = supabase
      .channel("orders-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if (payload.new) {
          const orderId = payload.new.short_order_id || payload.new.order_id
          if (orderId) {
            setDisplayOrders((prev) =>
              prev.map((order) =>
                getOrderId(order) === orderId
                  ? { ...order, status: payload.new.status, updated_at: payload.new.updated_at }
                  : order,
              ),
            )
          }
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "orderStatusUpdate" && e.newValue && onRefresh) {
        setTimeout(onRefresh, 200)
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [onRefresh])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: "bg-green-600 text-white", label: "Order Confirmed" },
      cancelled: { color: "bg-red-600 text-white", label: "Order Canceled" },
      pending: { color: "bg-yellow-600 text-white", label: "Order Pending" },
      completed: { color: "bg-blue-600 text-white", label: "Order Completed" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
    return <Badge className={`${config.color} px-3 py-1 font-medium rounded-full`}>{config.label}</Badge>
  }

  const getPaymentMethodStyle = (paymentMethod: string) => {
    const method = paymentMethod.toLowerCase()
    if (method.includes("cash")) {
      return "bg-green-600/30 text-green-200 px-2 py-1 rounded-full text-xs font-medium border border-green-600/50"
    } else if (method.includes("bkash")) {
      return "bg-pink-600/30 text-pink-200 px-2 py-1 rounded-full text-xs font-medium border border-pink-600/50"
    } else if (method.includes("pickup")) {
      return "bg-blue-600/30 text-blue-200 px-2 py-1 rounded-full text-xs font-medium border border-blue-600/50"
    } else {
      return "bg-gray-600/30 text-gray-200 px-2 py-1 rounded-full text-xs font-medium border border-gray-600/50"
    }
  }

  const generatePrintContent = useCallback(
    (order: Order) => {
      const dateTime = formatDateTime(order.created_at)
      return `
      <html>
        <head>
          <title>Order ${order.short_order_id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              padding: 20px; 
              max-width: 300px; 
              margin: 0 auto;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px;
            }
            .order-info { margin: 15px 0; }
            .items { margin: 15px 0; }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0; 
            }
            .total { 
              border-top: 2px solid #000; 
              padding-top: 10px; 
              font-weight: bold; 
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SUSHI YAKI RESTAURANT</h2>
            <p>Order #${order.short_order_id}</p>
            <p>${dateTime.date} ${dateTime.time}</p>
          </div>
          <div class="order-info">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Payment:</strong> ${order.payment_method}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          </div>
          <div class="items">
            <h3>Items:</h3>
            ${order.order_items
              .map(
                (item) => `
              <div class="item">
                <span>${item.item_name} x${item.quantity}</span>
                <span>৳${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="total">
            <p>Total: ৳${order.total_price.toFixed(2)}</p>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Visit us again soon</p>
          </div>
        </body>
      </html>
    `
    },
    [formatDateTime],
  )

  const handlePrint = useCallback(
    (order: Order) => {
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const printContent = generatePrintContent(order)
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    },
    [generatePrintContent],
  )

  const getActionButtons = (order: Order) => {
    const validOrderId = getOrderId(order)

    if (!validOrderId) {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled className="border-gray-600 text-gray-500 p-2 bg-transparent">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled className="border-gray-600 text-gray-500 p-2 bg-transparent">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-red-400 text-xs">Invalid Order ID</p>
        </div>
      )
    }

    if (order.status === "pending") {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`/dashboard/orders/${validOrderId}`, "_blank")}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handlePrint(order)}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => updateOrderStatus(validOrderId, "confirmed")}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Check className="w-4 h-4" />
              Confirm
            </Button>
            <Button
              onClick={() => updateOrderStatus(validOrderId, "cancelled")}
              size="sm"
              variant="destructive"
              className="flex-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    if (order.status === "confirmed") {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`/dashboard/orders/${validOrderId}`, "_blank")}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handlePrint(order)}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => updateOrderStatus(validOrderId, "completed")}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <CheckCircle className="w-4 h-4" />
            Complete
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(`/dashboard/orders/${validOrderId}`, "_blank")}
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handlePrint(order)}
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent p-2"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center">
          <Badge className={order.status === "completed" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}>
            {order.status === "completed" ? "Completed" : "Cancelled"}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Active Orders</h2>
          <p className="text-gray-400 text-sm mt-1">
            {displayOrders.length} order{displayOrders.length !== 1 ? "s" : ""} • Real-time updates enabled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium text-sm">LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayOrders.map((order) => {
          const dateTime = formatDateTime(order.created_at)
          const validOrderId = getOrderId(order)

          return (
            <Card
              key={validOrderId || `order-${order.customer_name}-${order.created_at}`}
              className="bg-gray-900/50 border-gray-700/30 hover:bg-gray-900/70 transition-all duration-200 relative"
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6 items-center">
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ORDER ID</p>
                      <p className="font-mono text-lg font-bold text-white">{order.short_order_id}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">CUSTOMER</p>
                      <div className="space-y-1">
                        <p className="text-white font-semibold">{order.customer_name}</p>
                        <p className="text-gray-300 text-sm">• {order.phone}</p>
                        <div className="flex items-center gap-2">
                          <span className={getPaymentMethodStyle(order.payment_method)}>{order.payment_method}</span>
                        </div>
                        <p className="text-gray-400 text-sm truncate" title={order.address}>
                          📍 {order.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ITEMS</p>
                      <div className="space-y-1">
                        {order.order_items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-300">
                            {item.item_name} <span className="text-gray-500">×{item.quantity}</span>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.order_items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">SPECIAL INSTRUCTIONS</p>
                      <div className="space-y-1">
                        {order.special_instructions ? (
                          <p className="text-white text-sm leading-relaxed">{order.special_instructions}</p>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No special instructions</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">TOTAL</p>
                      <p className="text-xl font-bold text-white">৳{order.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="col-span-2">{getActionButtons(order)}</div>
                </div>

                <div className="absolute top-4 right-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{dateTime.date}</p>
                    <p className="text-xs text-gray-400">{dateTime.time}</p>
                    <p className="text-xs text-gray-500">{getRelativeTime(order.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export { EnhancedOrdersTable }
