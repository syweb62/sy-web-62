"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { Eye, Printer, Clock, Check, X, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"

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
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set())
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    orderId: string
    newStatus: string
    type: "confirm" | "cancel" | "warning"
  }>({
    isOpen: false,
    orderId: "",
    newStatus: "",
    type: "confirm",
  })

  const supabase = createClient()

  const getValidOrderId = (order: Order): string => {
    return order.order_id || order.short_order_id || ""
  }

  useEffect(() => {
    const timeSinceLastUpdate = Date.now() - lastUpdateTime
    const hasRecentUpdate = timeSinceLastUpdate < 5000 // 5 seconds

    if (processingOrders.size === 0 && !hasRecentUpdate) {
      console.log("[v0] Syncing display orders with parent orders (no processing, no recent updates)")
      setDisplayOrders(orders)
    } else {
      console.log("[v0] Skipping sync - processing:", Array.from(processingOrders), "recent update:", hasRecentUpdate)
    }
  }, [orders, processingOrders, lastUpdateTime])

  const [localOrders, setLocalOrders] = useState<Order[]>(orders)
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [recentUpdates, setRecentUpdates] = useState<Set<string>>(new Set())

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

  const handleStatusUpdateWithConfirmation = async (orderId: string, newStatus: string) => {
    console.log("[v0] handleStatusUpdateWithConfirmation called:", { orderId, newStatus })

    if (!orderId || orderId === "undefined") {
      console.error("[v0] Invalid order ID provided:", orderId)
      return
    }

    if (updatingOrders.has(orderId)) {
      console.log("[v0] Order already being updated:", orderId)
      return
    }

    console.log("[v0] Opening confirmation modal for:", { orderId, newStatus })

    setConfirmationModal({
      isOpen: true,
      orderId,
      newStatus,
      type: newStatus === "confirmed" ? "confirm" : newStatus === "cancelled" ? "cancel" : "confirm",
    })
  }

  const handleModalConfirm = async () => {
    console.log("[v0] handleModalConfirm called with modal state:", confirmationModal)

    const { orderId, newStatus } = confirmationModal

    setConfirmationModal({
      isOpen: false,
      orderId: "",
      newStatus: "",
      type: "confirm",
    })

    try {
      await handleStatusUpdate(orderId, newStatus)
    } catch (error) {
      console.error("[v0] Status update failed:", error)
    }
  }

  const handleModalClose = () => {
    setConfirmationModal({
      isOpen: false,
      orderId: "",
      newStatus: "",
      type: "confirm",
    })
  }

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

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: string) => {
      console.log("[v0] Starting status update:", { orderId, newStatus })

      if (!orderId || processingOrders.has(orderId)) {
        console.log("[v0] Skipping update - invalid ID or already processing")
        return
      }

      setLastUpdateTime(Date.now())
      setProcessingOrders((prev) => new Set(prev).add(orderId))

      try {
        setDisplayOrders((prevOrders) =>
          prevOrders.map((order) => {
            const validOrderId = getValidOrderId(order)
            if (validOrderId === orderId) {
              console.log("[v0] Optimistically updating order:", validOrderId, "->", newStatus)
              return { ...order, status: newStatus as Order["status"] }
            }
            return order
          }),
        )

        console.log("[v0] Making API call to persist status change")
        const response = await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            status: newStatus,
          }),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const result = await response.json()
        console.log("[v0] Status update successful:", result)

        const eventData = {
          orderId: orderId,
          newStatus: newStatus,
          timestamp: new Date().toISOString(),
          source: "dashboard",
        }

        console.log("[v0] Broadcasting orderStatusChanged event")
        window.dispatchEvent(new CustomEvent("orderStatusChanged", { detail: eventData }))

        console.log("[v0] Broadcasting orderUpdated event")
        window.dispatchEvent(new CustomEvent("orderUpdated", { detail: eventData }))

        try {
          const updateData = {
            orderId,
            newStatus,
            timestamp: Date.now(),
            source: "dashboard",
          }

          localStorage.setItem("lastOrderUpdate", JSON.stringify(updateData))
          localStorage.setItem("orderUpdateTrigger", Date.now().toString())
          console.log("[v0] Stored cross-window update data:", updateData)

          setTimeout(() => {
            try {
              localStorage.removeItem("orderUpdateTrigger")
            } catch (e) {
              console.log("[v0] Could not clean up localStorage trigger:", e.message)
            }
          }, 2000)
        } catch (storageError) {
          console.log("[v0] Could not use localStorage for cross-window communication:", storageError.message)
        }

        try {
          const broadcastMessage = {
            type: "orderStatusChanged",
            data: eventData,
          }

          if (window.parent && window.parent !== window) {
            window.parent.postMessage(broadcastMessage, "*")
            console.log("[v0] Posted message to parent window")
          }

          if (window.opener && window.opener !== window) {
            window.opener.postMessage(broadcastMessage, "*")
            console.log("[v0] Posted message to opener window")
          }
        } catch (postMessageError) {
          console.log("[v0] Could not broadcast via postMessage:", postMessageError.message)
        }

        if (onStatusUpdate) {
          onStatusUpdate(orderId, newStatus)
        }

        if (onRefresh) {
          setTimeout(() => {
            console.log("[v0] Triggering parent refresh after status update")
            onRefresh()
          }, 3000) // Increased delay to 3 seconds
        }
      } catch (error) {
        console.error("[v0] Status update failed:", error)
        setDisplayOrders(orders)
        throw error
      } finally {
        setTimeout(() => {
          setProcessingOrders((prev) => {
            const newSet = new Set(prev)
            newSet.delete(orderId)
            console.log("[v0] Cleared processing state for order:", orderId)
            return newSet
          })
        }, 4000) // Increased to 4 seconds
      }
    },
    [orders, processingOrders, onStatusUpdate, onRefresh],
  )

  useEffect(() => {
    console.log("[v0] Setting up enhanced real-time subscription for orders")

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
          try {
            console.log("[v0] Real-time order update detected:", payload)

            if (payload.eventType === "UPDATE" && payload.new) {
              const orderId = payload.new.order_id || payload.new.short_order_id

              if (!orderId) {
                console.warn("[v0] Real-time update received but no valid order ID found")
                return
              }

              setDisplayOrders((prevOrders) =>
                prevOrders.map((order) => {
                  const validOrderId = getValidOrderId(order)
                  if (validOrderId === orderId) {
                    console.log("[v0] Updating order from real-time:", validOrderId, "->", payload.new.status)
                    return { ...order, status: payload.new.status as Order["status"] }
                  }
                  return order
                }),
              )

              setProcessingOrders((prev) => {
                const newSet = new Set(prev)
                newSet.delete(orderId)
                return newSet
              })

              try {
                const statusChangeEvent = new CustomEvent("orderStatusChanged", {
                  detail: {
                    orderId: orderId,
                    shortOrderId: payload.new.short_order_id,
                    newStatus: payload.new.status,
                    customerName: payload.new.customer_name,
                    totalPrice: payload.new.total_price,
                    timestamp: new Date().toISOString(),
                    source: "realtime",
                    eventType: payload.eventType,
                  },
                })

                window.dispatchEvent(statusChangeEvent)
                console.log("[v0] Dispatched orderStatusChanged event:", statusChangeEvent.detail)

                const orderUpdatedEvent = new CustomEvent("orderUpdated", {
                  detail: {
                    orderId: orderId,
                    shortOrderId: payload.new.short_order_id,
                    status: payload.new.status,
                    customerName: payload.new.customer_name,
                    phone: payload.new.phone,
                    address: payload.new.address,
                    totalPrice: payload.new.total_price,
                    paymentMethod: payload.new.payment_method,
                    specialInstructions: payload.new.message,
                    updatedAt: new Date().toISOString(),
                    source: "realtime",
                    eventType: payload.eventType,
                  },
                })
                window.dispatchEvent(orderUpdatedEvent)
              } catch (eventError) {
                console.error("[v0] Error dispatching custom events:", eventError)
              }

              try {
                const updateData = {
                  orderId,
                  newStatus: payload.new.status,
                  timestamp: Date.now(),
                  source: "realtime",
                  eventType: payload.eventType,
                }

                localStorage.setItem("lastOrderUpdate", JSON.stringify(updateData))
                localStorage.setItem("orderUpdateTrigger", Date.now().toString())
                console.log("[v0] Stored real-time cross-window update data:", updateData)

                setTimeout(() => {
                  try {
                    localStorage.removeItem("orderUpdateTrigger")
                  } catch (e) {
                    console.log("[v0] Could not clean up localStorage trigger:", e.message)
                  }
                }, 2000)
              } catch (storageError) {
                console.log("[v0] Could not use localStorage for cross-window communication:", storageError.message)
              }

              try {
                const broadcastToWindows = (eventData: any) => {
                  const message = {
                    type: "orderStatusChanged",
                    data: eventData,
                  }

                  if (window.parent && window.parent !== window) {
                    try {
                      window.parent.postMessage(message, "*")
                      console.log("[v0] Posted real-time message to parent window")
                    } catch (e) {
                      console.log("[v0] Could not post message to parent:", e.message)
                    }
                  }

                  if (window.opener && window.opener !== window) {
                    try {
                      window.opener.postMessage(message, "*")
                      console.log("[v0] Posted real-time message to opener window")
                    } catch (e) {
                      console.log("[v0] Could not post message to opener:", e.message)
                    }
                  }
                }

                broadcastToWindows({
                  orderId: orderId,
                  shortOrderId: payload.new.short_order_id,
                  newStatus: payload.new.status,
                  timestamp: new Date().toISOString(),
                  source: "realtime",
                })
              } catch (postMessageError) {
                console.error("[v0] Error with postMessage communication:", postMessageError.message)
              }
            }

            try {
              setTimeout(() => {
                console.log("[v0] Triggering parent refresh after real-time update")
                if (onRefresh) {
                  onRefresh()
                }
              }, 300)
            } catch (refreshError) {
              console.error("[v0] Error triggering parent refresh:", refreshError)
            }
          } catch (error) {
            console.error("[v0] Error in real-time subscription callback:", error)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Real-time subscription status:", status)
        if (status === "SUBSCRIBED") {
          console.log("[v0] Successfully subscribed to real-time order updates")
        } else if (status === "CHANNEL_ERROR") {
          console.error("[v0] Real-time subscription error")
        } else if (status === "TIMED_OUT") {
          console.error("[v0] Real-time subscription timed out")
        } else if (status === "CLOSED") {
          console.log("[v0] Real-time subscription closed")
        }
      })

    return () => {
      try {
        console.log("[v0] Cleaning up real-time subscription")
        subscription.unsubscribe()
      } catch (error) {
        console.error("[v0] Error cleaning up subscription:", error)
      }
    }
  }, [onRefresh, supabase])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "orderUpdateTrigger" && e.newValue) {
        try {
          const lastUpdate = localStorage.getItem("lastOrderUpdate")
          if (lastUpdate) {
            const update = JSON.parse(lastUpdate)
            console.log("[v0] Received cross-window order update:", update)

            if (onRefresh) {
              onRefresh()
            }
          }
        } catch (error) {
          console.error("[v0] Error parsing storage update:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [onRefresh])

  const getActionButtons = (order: Order) => {
    const validOrderId = getValidOrderId(order)
    const isProcessing = processingOrders.has(validOrderId)

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
              onClick={() => {
                console.log("[v0] Confirm button clicked for order:", validOrderId)
                handleStatusUpdateWithConfirmation(validOrderId, "confirmed")
              }}
              size="sm"
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Cancel button clicked for order:", validOrderId)
                handleStatusUpdateWithConfirmation(validOrderId, "cancelled")
              }}
              size="sm"
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              {isProcessing ? "Processing..." : "Cancel"}
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
            onClick={() => {
              console.log("[v0] Complete button clicked for order:", validOrderId)
              handleStatusUpdateWithConfirmation(validOrderId, "completed")
            }}
            size="sm"
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isProcessing ? "Processing..." : "Complete"}
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
          const validOrderId = getValidOrderId(order)

          return (
            <Card
              key={validOrderId || `order-${order.customer_name}-${order.created_at}`}
              className="bg-gray-900/50 border-gray-700/30 hover:bg-gray-900/70 transition-all duration-200 relative"
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6 items-center">
                  {/* Order ID */}
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ORDER ID</p>
                      <p className="font-mono text-lg font-bold text-white">{order.short_order_id}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Customer */}
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

                  {/* Items */}
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

                  {/* Special Instructions */}
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

                  {/* Total */}
                  <div className="col-span-1">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">TOTAL</p>
                      <p className="text-xl font-bold text-white">৳{order.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2">{getActionButtons(order)}</div>
                </div>

                {/* Placed Time */}
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
      {/* Custom Confirmation Modal */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          title={
            confirmationModal.type === "confirm"
              ? "Confirm Order"
              : confirmationModal.type === "cancel"
                ? "Cancel Order"
                : "Update Order"
          }
          message={
            confirmationModal.type === "confirm"
              ? "Are you sure you want to confirm this order?"
              : confirmationModal.type === "cancel"
                ? "Are you sure you want to cancel this order?"
                : "Are you sure you want to update this order?"
          }
          type={confirmationModal.type}
        />
      )}
    </div>
  )
}

export { EnhancedOrdersTable }
