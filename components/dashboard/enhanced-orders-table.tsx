"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Check,
  X,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Wifi,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useNotificationSystem } from "@/hooks/use-notification-system"
import { useAuth } from "@/hooks/use-auth"
import type { EnhancedOrdersTableProps, Order, ConfirmationModal } from "@/types"

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
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "connecting",
  )
  const subscriptionRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)
  const { notifyNewOrder, notifyOrderStatusChange } = useNotificationSystem()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      console.log("[v0] User not authenticated, skipping real-time setup")
      setConnectionStatus("disconnected")
      return
    }

    if (isSubscribedRef.current) {
      console.log("[v0] Subscription already active, skipping setup")
      return
    }

    console.log("[v0] Setting up real-time order notifications...")
    setConnectionStatus("connecting")

    const supabase = createClient()

    const existingChannels = supabase.getChannels()
    existingChannels.forEach((ch) => {
      if (ch.topic.includes("order-notifications")) {
        supabase.removeChannel(ch)
      }
    })

    const channel = supabase
      .channel(`order-notifications-${Date.now()}`, {
        config: {
          presence: {
            key: user.id,
          },
          broadcast: { self: false }, // Prevent self-broadcast loops
          private: false,
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("[v0] New order detected:", payload.new)

          try {
            const audio = new Audio("/sounds/notification.mp3")
            audio.volume = 0.7
            audio.play().catch((e) => console.log("[v0] Audio play failed:", e))
          } catch (error) {
            console.log("[v0] Audio creation failed:", error)
          }

          // Trigger notification for new order
          if (payload.new) {
            notifyNewOrder({
              order_id: payload.new.order_id,
              short_order_id: payload.new.short_order_id,
              customer_name: payload.new.customer_name || "Guest",
              total_amount: payload.new.total_amount || 0,
            })
          }

          setDisplayOrders((prev) => [payload.new as Order, ...prev])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("[v0] Order status updated:", payload.new)

          // Trigger notification for status change
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status
            const newStatus = payload.new.status

            if (oldStatus !== newStatus) {
              try {
                const audio = new Audio("/sounds/notification.mp3")
                audio.volume = 0.5
                audio.play().catch((e) => console.log("[v0] Audio play failed:", e))
              } catch (error) {
                console.log("[v0] Audio creation failed:", error)
              }

              notifyOrderStatusChange(
                payload.new.short_order_id || payload.new.order_id,
                newStatus,
                payload.new.customer_name || "Guest",
              )
            }
          }

          setDisplayOrders((prev) =>
            prev.map((order) =>
              order.order_id === payload.new.order_id || order.short_order_id === payload.new.short_order_id
                ? ({ ...order, ...payload.new } as Order)
                : order,
            ),
          )
        },
      )
      .subscribe((status, err) => {
        console.log("[v0] Real-time subscription status:", status)

        if (err) {
          console.error("[v0] Real-time subscription error:", err)
          setConnectionStatus("error")
          setError(`Real-time connection failed: ${err.message}`)
          isSubscribedRef.current = false
        } else {
          switch (status) {
            case "SUBSCRIBED":
              setConnectionStatus("connected")
              setError(null)
              isSubscribedRef.current = true
              console.log("[v0] Real-time connection established successfully")
              break
            case "CHANNEL_ERROR":
              setConnectionStatus("error")
              setError("Real-time connection channel_error")
              isSubscribedRef.current = false
              console.error("[v0] Channel error - checking authentication and permissions")
              break
            case "TIMED_OUT":
              setConnectionStatus("error")
              setError("Real-time connection timed_out")
              isSubscribedRef.current = false
              console.error("[v0] Connection timed out")
              break
            case "CLOSED":
              console.log("[v0] Connection closed")
              setConnectionStatus("disconnected")
              isSubscribedRef.current = false
              break
            default:
              setConnectionStatus("connecting")
              console.log("[v0] Connection status:", status)
          }
        }
      })

    subscriptionRef.current = channel

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      isSubscribedRef.current = false
    }
  }, [user]) // Updated to depend on user object instead of user?.id

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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

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

      setTimeout(() => {
        if (onRefresh) {
          onRefresh()
        }
      }, 100)

      return true
    } catch (error) {
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

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    if (!orderId) {
      setError("Missing order information")
      return false
    }

    try {
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`/api/orders?orderId=${orderId}`, {
        method: "DELETE",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Delete failed")
      }

      setDisplayOrders((prev) => prev.filter((order) => getOrderId(order) !== orderId))

      setTimeout(() => {
        if (onRefresh) {
          onRefresh()
        }
      }, 100)

      return true
    } catch (error) {
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
      let success = false

      if (confirmationModal.action === "delete") {
        success = await deleteOrder(confirmationModal.orderId)
      } else {
        success = await updateOrderStatus(confirmationModal.orderId, confirmationModal.action)
      }

      if (success) {
        setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
      } else {
        setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
      }
    } catch (error) {
      setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const cancelConfirmation = () => {
    if (confirmationModal.isProcessing) return
    setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
  }

  const getActionButtons = useMemo(() => {
    return (order: Order) => {
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
            <Button
              onClick={() => showConfirmation(validOrderId, "delete", "delete")}
              size="sm"
              variant="outline"
              className="w-full text-red-400 hover:text-red-300 border-red-600 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Order
            </Button>
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
            <Button
              onClick={() => showConfirmation(validOrderId, "delete", "delete")}
              size="sm"
              variant="outline"
              className="w-full text-red-400 hover:text-red-300 border-red-600 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Order
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
          <Button
            onClick={() => showConfirmation(validOrderId, "delete", "delete")}
            size="sm"
            variant="outline"
            className="w-full text-red-400 hover:text-red-300 border-red-600 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Order
          </Button>
        </div>
      )
    }
  }, [])

  const getStatusBadge = useMemo(() => {
    return (status: string) => {
      const statusConfig = {
        confirmed: { color: "bg-green-600 text-white", label: "Order Confirmed" },
        cancelled: { color: "bg-red-600 text-white", label: "Order Canceled" },
        pending: { color: "bg-yellow-600 text-white", label: "Order Pending" },
        completed: { color: "bg-blue-600 text-white", label: "Order Completed" },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
      return <Badge className={`${config.color} px-3 py-1 font-medium rounded-full`}>{config.label}</Badge>
    }
  }, [])

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }, [])

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
            <Wifi
              className={`w-4 h-4 ${
                connectionStatus === "connected"
                  ? "text-green-400"
                  : connectionStatus === "connecting"
                    ? "text-yellow-400"
                    : connectionStatus === "error"
                      ? "text-red-400"
                      : "text-gray-400"
              }`}
            />
            <span
              className={`font-medium text-sm ${
                connectionStatus === "connected"
                  ? "text-green-400"
                  : connectionStatus === "connecting"
                    ? "text-yellow-400"
                    : connectionStatus === "error"
                      ? "text-red-400"
                      : "text-gray-400"
              }`}
            >
              {connectionStatus === "connected"
                ? "LIVE"
                : connectionStatus === "connecting"
                  ? "CONNECTING"
                  : connectionStatus === "error"
                    ? "ERROR"
                    : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-300 font-medium">Real-time Connection Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => setError(null)}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-300 hover:bg-red-900/30 bg-transparent"
          >
            Dismiss
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
                        {order.phone && order.phone !== "N/A" && (
                          <p className="text-gray-300 text-sm">📞 {order.phone}</p>
                        )}
                        {order.payment_method && (
                          <p className="text-gray-300 text-sm">
                            💳{" "}
                            <span
                              className={`${
                                order.payment_method === "bkash"
                                  ? "text-pink-400"
                                  : order.payment_method === "pickup"
                                    ? "text-blue-400"
                                    : "text-green-400"
                              }`}
                            >
                              {order.payment_method === "bkash"
                                ? "bKash"
                                : order.payment_method === "pickup"
                                  ? "Pickup"
                                  : "Cash"}
                            </span>
                          </p>
                        )}
                        <p className="text-gray-400 text-sm truncate" title={order.address}>
                          📍 {order.address}
                        </p>
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
                            <span className="text-white">Tk{(order.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {order.discount && order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Discount:</span>
                              <span className="text-green-400">-Tk{order.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {order.vat && order.vat > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">VAT:</span>
                              <span className="text-white">Tk{order.vat.toFixed(2)}</span>
                            </div>
                          )}
                          {order.delivery_charge !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Delivery:</span>
                              <span className="text-white flex items-center gap-1">
                                {order.delivery_charge === 0 ? "FREE" : `Tk${Number(order.delivery_charge).toFixed(2)}`}
                                <span className="text-xs text-gray-400 ml-2">
                                  •{" "}
                                  {new Date(order.created_at).toLocaleString("en-BD", {
                                    timeZone: "Asia/Dhaka",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="border-t border-gray-600 pt-1 mt-2">
                            <div className="flex justify-between font-bold">
                              <span className="text-white">Total:</span>
                              <span className="text-yellow-400">Tk{Number(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-yellow-400">
                            Tk{Number(order.total_amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                          </p>
                          {order.delivery_charge !== undefined && (
                            <p className="text-xs text-gray-400">
                              Delivery:{" "}
                              {order.delivery_charge === 0 ? "FREE" : `Tk${Number(order.delivery_charge).toFixed(2)}`}
                              <span
                                className={`ml-1 ${
                                  order.payment_method === "pickup"
                                    ? "text-blue-400"
                                    : order.payment_method === "bkash"
                                      ? "text-pink-400"
                                      : "text-green-400"
                                }`}
                              >
                                (
                                {order.payment_method === "pickup"
                                  ? "Pickup"
                                  : order.payment_method === "bkash"
                                    ? "bKash"
                                    : "Cash"}
                                )
                              </span>
                              <span className="text-gray-500 ml-2">
                                •{" "}
                                {new Date(order.created_at).toLocaleString("en-BD", {
                                  timeZone: "Asia/Dhaka",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">{getActionButtons(order)}</div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">ORDER ITEMS</p>
                    <div className="space-y-3">
                      {order.order_items && order.order_items.length > 0 ? (
                        <>
                          {order.order_items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-start text-sm bg-gray-800/40 rounded-lg p-3 border border-gray-700/30"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold">
                                    {item.product_name || "Unknown Item"}
                                  </span>
                                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                                    ×{item.quantity || 1}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-xs">
                                  Unit price: Tk{Number(item.price || 0).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-yellow-400 font-bold text-base">
                                  Tk{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-6 bg-gray-800/20 rounded-lg border border-gray-700/30">
                          <div className="space-y-2">
                            <p className="text-gray-400 text-sm">⚠️ Order items not available</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>Total Amount: Tk{Number(order.total_amount || 0).toFixed(2)}</p>
                              <p>Items Count: {order.order_items?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
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
              <div className="mb-4">
                {confirmationModal.actionLabel === "delete" ? (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                {confirmationModal.actionLabel === "confirm" && "Confirm Order"}
                {confirmationModal.actionLabel === "cancel" && "Cancel Order"}
                {confirmationModal.actionLabel === "complete" && "Complete Order"}
                {confirmationModal.actionLabel === "delete" && "Delete Order"}
              </h3>

              <p className="text-gray-300 mb-2">
                {confirmationModal.actionLabel === "delete"
                  ? "Are you sure you want to permanently delete this order? This action cannot be undone."
                  : `Are you sure you want to ${confirmationModal.actionLabel} this order?`}
              </p>
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
                  className={`flex-1 ${
                    confirmationModal.actionLabel === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {confirmationModal.isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : confirmationModal.actionLabel === "delete" ? (
                    "Delete Permanently"
                  ) : (
                    "Confirm"
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
