"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Printer, Check, X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
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

interface ConfirmationModal {
  isOpen: boolean
  orderId: string
  action: string
  actionLabel: string
  isProcessing: boolean
}

const EnhancedOrdersTable = ({
  orders = [],
  onStatusUpdate,
  onRefresh,
  userRole = "manager",
  loading = false,
}: EnhancedOrdersTableProps) => {
  const [displayOrders, setDisplayOrders] = useState<Order[]>(orders)
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    orderId: "",
    action: "",
    actionLabel: "",
    isProcessing: false,
  })
  const supabase = createClient()

  const getOrderId = (order: Order): string => {
    return order.short_order_id || ""
  }

  const fetchOrders = async () => {
    console.log("[v0] Fetching fresh orders from database...")
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Fetch Error:", error)
        return
      }

      console.log("[v0] Fresh orders fetched:", data?.length)
      if (data && data.length > 0) {
        console.log(
          "[v0] Sample order statuses:",
          data.slice(0, 3).map((order) => ({ id: order.short_order_id, status: order.status })),
        )
      }
      setDisplayOrders(data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log("[v0] Updating order status:", orderId, "to", newStatus)

    if (!orderId) {
      alert("Error: No order ID provided")
      return
    }

    setConfirmationModal((prev) => ({ ...prev, isProcessing: true }))

    try {
      const { data: existingOrder, error: checkError } = await supabase
        .from("orders")
        .select("order_id, short_order_id, status")
        .eq("short_order_id", orderId)
        .single()

      if (checkError || !existingOrder) {
        console.error("[v0] Order not found for update:", orderId, checkError)
        alert(`Error: Order ${orderId} not found in database`)
        return
      }

      console.log("[v0] Found order for update:", existingOrder)

      const { data, error, count } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("short_order_id", orderId)
        .select()

      if (error) {
        console.error("[v0] Update Error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      console.log("[v0] Update result:", { data, count, affectedRows: data?.length })

      if (!data || data.length === 0) {
        console.error("[v0] Update didn't affect any rows for order:", orderId)
        alert(`Error: Failed to update order ${orderId}`)
        return
      }

      console.log("[v0] Order status updated successfully:", data[0])

      setDisplayOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.short_order_id === orderId
            ? { ...order, ...data[0] } // Use the actual updated data from database
            : order,
        ),
      )

      await fetchOrders()

      alert(`Order ${newStatus} successfully!`)

      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus)
      }
    } catch (error) {
      console.error("[v0] Failed to update order status:", error)
      alert(`Network Error: ${error}`)
    } finally {
      setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  useEffect(() => {
    console.log("[v0] Setting up real-time subscription...")

    const subscription = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time change received:", payload.eventType)

        fetchOrders()

        if (payload.eventType === "INSERT") {
          playNotificationSound()

          if (Notification.permission === "granted") {
            new Notification(`🆕 New Order Received!`, {
              body: `Order ID: ${payload.new.short_order_id}\nCustomer: ${payload.new.customer_name}`,
              icon: "/favicon.ico",
            })
          }

          alert(`🆕 New order received!\nID: ${payload.new.short_order_id}\nCustomer: ${payload.new.customer_name}`)
        }
      })
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
      })

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/sounds/notification.mp3")
      audio.volume = 0.7
      audio.play().catch((e) => {
        console.log("[v0] Could not play notification sound:", e)
        // Fallback: try to play a system beep
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = context.createOscillator()
          const gainNode = context.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(context.destination)

          oscillator.frequency.value = 800
          gainNode.gain.setValueAtTime(0.3, context.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)

          oscillator.start(context.currentTime)
          oscillator.stop(context.currentTime + 0.5)
        } catch (beepError) {
          console.log("[v0] Could not play fallback beep:", beepError)
        }
      })
    } catch (error) {
      console.log("[v0] Notification sound error:", error)
    }
  }

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === "orderStatusUpdate" || e.key === "orderUpdate") && e.newValue && onRefresh) {
        console.log("[v0] Storage change detected, refreshing orders")
        onRefresh()
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [onRefresh])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!confirmationModal.isOpen) return

      if (event.key === "Escape" && !confirmationModal.isProcessing) {
        cancelConfirmation()
      } else if (event.key === "Enter" && !confirmationModal.isProcessing) {
        handleConfirmation()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [confirmationModal.isOpen, confirmationModal.isProcessing])

  const getStatusBadge = (status: string) => {
    console.log("[v0] Rendering status badge for:", status)

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
            ${
              order.order_items && order.order_items.length > 0
                ? order.order_items
                    .map(
                      (item) => `
                  <div class="item">
                    <span>${item.item_name} x${item.quantity}</span>
                    <span>৳${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                  </div>
                `,
                    )
                    .join("")
                : "<p>No items</p>"
            }
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

  const showConfirmation = (orderId: string, action: string, actionLabel: string) => {
    setConfirmationModal({
      isOpen: true,
      orderId,
      action,
      actionLabel,
      isProcessing: false,
    })
  }

  const handleConfirmation = async () => {
    await updateOrderStatus(confirmationModal.orderId, confirmationModal.action)
    setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
  }

  const cancelConfirmation = () => {
    if (confirmationModal.isProcessing) return
    setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
  }

  const getModalIcon = () => {
    if (confirmationModal.isProcessing) {
      return <Loader2 className="w-6 h-6 text-white animate-spin" />
    }

    switch (confirmationModal.actionLabel) {
      case "cancel":
        return <AlertTriangle className="w-6 h-6 text-white" />
      case "complete":
        return <CheckCircle className="w-6 h-6 text-white" />
      default:
        return <Check className="w-6 h-6 text-white" />
    }
  }

  const getModalColors = () => {
    switch (confirmationModal.actionLabel) {
      case "cancel":
        return "bg-red-600"
      case "complete":
        return "bg-blue-600"
      default:
        return "bg-green-600"
    }
  }

  const getActionButtons = (order: Order) => {
    const validOrderId = getOrderId(order)

    console.log("[v0] Rendering action buttons for order:", validOrderId, "status:", order.status)

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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                showConfirmation(validOrderId, "confirmed", "confirm")
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1 cursor-pointer"
              type="button"
            >
              <Check className="w-4 h-4" />
              Confirm
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                showConfirmation(validOrderId, "cancelled", "cancel")
              }}
              size="sm"
              variant="destructive"
              className="flex-1 cursor-pointer"
              type="button"
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              showConfirmation(validOrderId, "completed", "complete")
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full cursor-pointer"
            type="button"
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
                        {order.order_items && order.order_items.length > 0 ? (
                          <>
                            {order.order_items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-300">
                                {item.item_name} <span className="text-gray-500">×{item.quantity}</span>
                              </div>
                            ))}
                            {order.order_items.length > 3 && (
                              <p className="text-xs text-gray-500">+{order.order_items.length - 3} more items</p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No items</p>
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

      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-600 shadow-2xl transform transition-all duration-200 scale-100">
            <div className="text-center">
              <div
                className={`w-16 h-16 ${getModalColors()} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
              >
                {getModalIcon()}
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                {confirmationModal.actionLabel === "confirm" && "Confirm Order"}
                {confirmationModal.actionLabel === "cancel" && "Cancel Order"}
                {confirmationModal.actionLabel === "complete" && "Complete Order"}
              </h3>

              <p className="text-gray-300 mb-2">Are you sure you want to {confirmationModal.actionLabel} this order?</p>
              <p className="text-gray-400 text-sm mb-8">
                Order ID:{" "}
                <span className="font-mono font-semibold text-white">
                  {displayOrders.find((order) => order.short_order_id === confirmationModal.orderId)?.short_order_id ||
                    confirmationModal.orderId}
                </span>
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={cancelConfirmation}
                  variant="outline"
                  disabled={confirmationModal.isProcessing}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent disabled:opacity-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmation}
                  disabled={confirmationModal.isProcessing}
                  className={`flex-1 ${getModalColors()} hover:opacity-90 text-white disabled:opacity-50 transition-all duration-200 font-semibold`}
                >
                  {confirmationModal.isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "OK"
                  )}
                </Button>
              </div>

              {!confirmationModal.isProcessing && (
                <p className="text-gray-500 text-xs mt-4">
                  Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to confirm or{" "}
                  <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> to cancel
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { EnhancedOrdersTable }
