"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, CheckCircle, Loader2, RefreshCw, AlertCircle, Wifi, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Order {
  order_id: string
  short_order_id?: string
  customer_name: string
  phone_number: string
  address: string
  payment_method: string
  total_amount: number
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  status: "confirmed" | "cancelled" | "pending" | "completed"
  created_at: string
  updated_at?: string
  special_instructions?: string
  order_items: Array<{
    product_name: string
    quantity: number
    price: number
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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    orderId: "",
    action: "",
    actionLabel: "",
    isProcessing: false,
  })
  const [connectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionRef = useRef<any>(null)

  const [supabase] = useState(() => {
    try {
      const client = createClient()
      console.log("[v0] Supabase client created successfully")
      return client
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      setError("Failed to initialize database connection")
      return null
    }
  })

  const setupRealtimeConnection = useCallback(async () => {
    if (!supabase) {
      setError("Database client not available")
      return
    }

    try {
      setError(null)
      console.log("[v0] Setting up real-time connection...")

      // Clean up existing subscription
      if (subscriptionRef.current) {
        await supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      subscriptionRef.current = supabase
        .channel(`orders-changes-${Date.now()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
          console.log("[v0] Real-time order update received:", payload)
          setRetryCount(0)

          if (onRefresh) {
            onRefresh()
          }
        })
        .subscribe((status) => {
          console.log("[v0] Subscription status:", status)

          if (status === "SUBSCRIBED") {
            setRetryCount(0)
            setError(null)
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
              console.log(`[v0] Connection lost, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

              retryTimeoutRef.current = setTimeout(() => {
                setRetryCount((prev) => prev + 1)
                setupRealtimeConnection()
              }, delay)
            } else {
              setError("Real-time connection failed. Please refresh manually.")
            }
          }
        })
    } catch (error) {
      console.error("[v0] Error setting up real-time connection:", error)
      setError("Failed to establish real-time connection")
    }
  }, [supabase, onRefresh, retryCount, maxRetries])

  useEffect(() => {
    setupRealtimeConnection()

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [setupRealtimeConnection])

  useEffect(() => {
    setDisplayOrders(orders)
  }, [orders])

  const getOrderId = (order: Order): string => {
    return order.order_id || order.short_order_id || ""
  }

  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
    if (!orderId || !newStatus) {
      setError("Missing order information")
      return false
    }

    try {
      setError(null)
      console.log("[v0] Updating order status:", { orderId, newStatus })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Update failed")
      }

      console.log("[v0] Order status updated successfully")

      // Trigger refresh with delay to ensure database consistency
      setTimeout(() => {
        if (onRefresh) {
          onRefresh()
        }
      }, 500)

      return true
    } catch (error) {
      console.error("[v0] Error updating order status:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else if (error.message.includes("fetch")) {
          setError("Network error. Please check your connection.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred")
      }

      return false
    }
  }

  const showConfirmation = (orderId: string, action: string, actionLabel: string) => {
    if (!orderId || !action) {
      setError("Invalid order information")
      return
    }

    setConfirmationModal({
      isOpen: true,
      orderId,
      action,
      actionLabel,
      isProcessing: false,
    })
  }

  const handleConfirmation = async () => {
    if (!confirmationModal.orderId || !confirmationModal.action) {
      setError("Missing confirmation data")
      return
    }

    setConfirmationModal((prev) => ({ ...prev, isProcessing: true }))

    try {
      const success = await updateOrderStatus(confirmationModal.orderId, confirmationModal.action)

      if (success) {
        setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
      } else {
        setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
      }
    } catch (error) {
      console.error("[v0] Confirmation error:", error)
      setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const cancelConfirmation = () => {
    if (confirmationModal.isProcessing) return
    setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
  }

  const handleManualRetry = () => {
    setRetryCount(0)
    setError(null)
    setupRealtimeConnection()
  }

  const getActionButtons = (order: Order) => {
    const validOrderId = getOrderId(order)

    if (!validOrderId) {
      return (
        <div className="space-y-3">
          <p className="text-red-400 text-xs">Invalid Order ID</p>
        </div>
      )
    }

    if (order.status === "pending") {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => showConfirmation(validOrderId, "confirmed", "confirm")}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Check className="w-4 h-4" />
              Confirm
            </Button>
            <Button
              onClick={() => showConfirmation(validOrderId, "cancelled", "cancel")}
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
          <Button
            onClick={() => showConfirmation(validOrderId, "completed", "complete")}
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
        <div className="text-center">
          <Badge className={order.status === "completed" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}>
            {order.status === "completed" ? "Completed" : "Cancelled"}
          </Badge>
        </div>
      </div>
    )
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

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
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
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              if (onRefresh) onRefresh()
            }}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">LIVE</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-300 font-medium">Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
          <Button
            onClick={handleManualRetry}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-300 hover:bg-red-900/30 bg-transparent"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-400">Loading orders...</span>
        </div>
      )}

      {!loading && displayOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No orders found</div>
          <p className="text-gray-500 text-sm">Orders will appear here when customers place them</p>
        </div>
      )}

      <div className="space-y-4">
        {displayOrders.map((order) => {
          const validOrderId = getOrderId(order)
          const isExpanded = expandedOrders.has(validOrderId)

          return (
            <Card
              key={validOrderId || `order-${order.customer_name}-${order.created_at}`}
              className="bg-gray-900/50 border-gray-700/30 hover:bg-gray-900/70 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-3">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ORDER</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {order.short_order_id || order.order_id?.slice(-8).toUpperCase() || "N/A"}
                      </p>
                      {getStatusBadge(order.status)}
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString("en-BD", {
                          timeZone: "Asia/Dhaka",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">CUSTOMER</p>
                      <div className="space-y-1">
                        <p className="text-white font-semibold">{order.customer_name}</p>
                        <p className="text-gray-300 text-sm">📞 {order.phone_number}</p>
                        <p className="text-gray-400 text-sm truncate" title={order.address}>
                          📍 {order.address}
                        </p>
                        {order.payment_method && (
                          <p className="text-gray-400 text-sm">
                            💳 {order.payment_method === "bkash" ? "bKash" : order.payment_method}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ORDER SUMMARY</p>
                        <button
                          onClick={() => toggleOrderExpansion(validOrderId)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal:</span>
                            <span className="text-white">৳{(order.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {order.discount && order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Discount:</span>
                              <span className="text-green-400">-৳{order.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {order.vat && order.vat > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">VAT:</span>
                              <span className="text-white">৳{order.vat.toFixed(2)}</span>
                            </div>
                          )}
                          {order.delivery_charge !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Delivery:</span>
                              <span className="text-white">
                                {order.delivery_charge === 0 ? "FREE" : `৳${order.delivery_charge.toFixed(2)}`}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-gray-600 pt-1 mt-2">
                            <div className="flex justify-between font-bold">
                              <span className="text-white">Total:</span>
                              <span className="text-yellow-400">৳{(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-yellow-400">৳{(order.total_amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">
                            {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                          </p>
                          {order.delivery_charge !== undefined && (
                            <p className="text-xs text-gray-400">
                              Delivery: {order.delivery_charge === 0 ? "FREE" : `৳${order.delivery_charge.toFixed(2)}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">{getActionButtons(order)}</div>
                </div>

                {isExpanded && order.order_items && order.order_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">ORDER ITEMS</p>
                    <div className="space-y-2">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <span className="text-white">{item.product_name}</span>
                            <span className="text-gray-400 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="text-gray-300">৳{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-600 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-3">
                {confirmationModal.actionLabel === "confirm" && "Confirm Order"}
                {confirmationModal.actionLabel === "cancel" && "Cancel Order"}
                {confirmationModal.actionLabel === "complete" && "Complete Order"}
              </h3>

              <p className="text-gray-300 mb-2">Are you sure you want to {confirmationModal.actionLabel} this order?</p>
              <p className="text-gray-400 text-sm mb-8">
                Order ID:{" "}
                <span className="font-mono font-semibold text-white">
                  {displayOrders.find((o) => getOrderId(o) === confirmationModal.orderId)?.short_order_id ||
                    confirmationModal.orderId}
                </span>
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={cancelConfirmation}
                  variant="outline"
                  disabled={confirmationModal.isProcessing}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmation}
                  disabled={confirmationModal.isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { EnhancedOrdersTable }
