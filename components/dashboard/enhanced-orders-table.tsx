"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

console.log("[v0] ========== ENHANCED ORDERS TABLE FILE LOADED ==========")
console.log("[v0] File load time:", new Date().toISOString())
console.log("[v0] Environment check - window exists:", typeof window !== "undefined")

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
  console.log("[v0] ========== ENHANCED ORDERS TABLE COMPONENT FUNCTION ==========")
  console.log("[v0] Component render time:", new Date().toISOString())
  console.log("[v0] Props received:")
  console.log("[v0] - orders.length:", orders.length)
  console.log("[v0] - loading:", loading)
  console.log("[v0] - onRefresh type:", typeof onRefresh)

  const [displayOrders, setDisplayOrders] = useState<Order[]>(orders)
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    orderId: "",
    action: "",
    actionLabel: "",
    isProcessing: false,
  })
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] ========== COMPONENT MOUNTED ==========")
    console.log("[v0] Mount time:", new Date().toISOString())
    console.log("[v0] Orders received:", orders.length)
    console.log("[v0] Supabase client created:", !!supabase)
    if (orders.length > 0) {
      console.log("[v0] Sample order:", orders[0])
    }

    // Test if component is interactive
    const testTimer = setTimeout(() => {
      console.log("[v0] Component is interactive after 1 second")
    }, 1000)

    return () => clearTimeout(testTimer)
  }, [])

  useEffect(() => {
    console.log("[v0] Orders prop changed, updating displayOrders")
    setDisplayOrders(orders)
  }, [orders])

  useEffect(() => {
    console.log("✅ Enhanced Orders Table Component Loaded")
    console.log("🔄 Realtime listener active")

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("📡 Order changed:", payload)
        // Refresh orders when database changes
        if (onRefresh) {
          onRefresh()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onRefresh])

  const getOrderId = (order: Order): string => {
    return order.short_order_id || ""
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    console.log(`[v0] Updating order ${orderId} to ${newStatus}`)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      const data = await res.json()
      if (data.success) {
        console.log(`✅ Order ${newStatus}:`, orderId)
        alert(`✅ Order ${newStatus} successfully!`)
        if (onRefresh) {
          onRefresh()
        }
        return true
      } else {
        console.error("❌ Failed to update:", data.error)
        alert(`❌ Failed to update: ${data.error}`)
        return false
      }
    } catch (error) {
      console.error("❌ Network error:", error)
      alert(`❌ Network error: ${error}`)
      return false
    }
  }

  const showConfirmation = (orderId: string, action: string, actionLabel: string) => {
    console.log("[v0] ========== SHOW CONFIRMATION ==========")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] Action:", action)
    console.log("[v0] Action Label:", actionLabel)

    setConfirmationModal({
      isOpen: true,
      orderId,
      action,
      actionLabel,
      isProcessing: false,
    })
  }

  const handleConfirmation = async () => {
    console.log("[v0] ========== HANDLE CONFIRMATION START ==========")
    console.log("[v0] Modal state:", confirmationModal)

    if (!confirmationModal.orderId || !confirmationModal.action) {
      console.log("[v0] ERROR: Missing confirmation data")
      alert("❌ Error: Missing confirmation data")
      return
    }

    setConfirmationModal((prev) => ({ ...prev, isProcessing: true }))

    try {
      const success = await updateOrderStatus(confirmationModal.orderId, confirmationModal.action)
      console.log("[v0] Update result:", success)

      if (success) {
        console.log("[v0] Closing modal after successful update")
        setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
      } else {
        console.log("[v0] Keeping modal open after failed update")
        setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
      }
    } catch (error) {
      console.log("[v0] handleConfirmation error:", error)
      setConfirmationModal((prev) => ({ ...prev, isProcessing: false }))
    }

    console.log("[v0] ========== HANDLE CONFIRMATION END ==========")
  }

  const cancelConfirmation = () => {
    if (confirmationModal.isProcessing) return
    setConfirmationModal({ isOpen: false, orderId: "", action: "", actionLabel: "", isProcessing: false })
  }

  const getActionButtons = (order: Order) => {
    const validOrderId = getOrderId(order)
    console.log("[v0] Rendering action buttons for order:", validOrderId, "status:", order.status)

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
              onClick={() => {
                console.log("[v0] ========== CONFIRM BUTTON CLICKED ==========")
                console.log("[v0] Order ID:", validOrderId)
                console.log("[v0] Time:", new Date().toISOString())
                showConfirmation(validOrderId, "confirmed", "confirm")
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Check className="w-4 h-4" />
              Confirm
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] ========== CANCEL BUTTON CLICKED ==========")
                console.log("[v0] Order ID:", validOrderId)
                console.log("[v0] Time:", new Date().toISOString())
                showConfirmation(validOrderId, "cancelled", "cancel")
              }}
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
            onClick={() => {
              console.log("[v0] ========== COMPLETE BUTTON CLICKED ==========")
              console.log("[v0] Order ID:", validOrderId)
              console.log("[v0] Time:", new Date().toISOString())
              showConfirmation(validOrderId, "completed", "complete")
            }}
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

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      console.log("[v0] ========== GLOBAL CLICK DETECTED ==========")
      console.log("[v0] Target:", (e.target as HTMLElement).tagName)
      console.log("[v0] Target class:", (e.target as HTMLElement).className)
      console.log("[v0] Time:", new Date().toISOString())

      // Check if it's a button click
      const target = e.target as HTMLElement
      if (target.tagName === "BUTTON" || target.closest("button")) {
        console.log("[v0] BUTTON CLICK DETECTED!")
        console.log("[v0] Button text:", target.textContent || target.closest("button")?.textContent)
      }
    }

    document.addEventListener("click", handleGlobalClick)
    return () => document.removeEventListener("click", handleGlobalClick)
  }, [])

  console.log("[v0] About to render component with", displayOrders.length, "orders")

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

      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => {
            console.log("[v0] ========== COMPONENT TEST BUTTON CLICKED ==========")
            console.log("[v0] Component state:", { displayOrders: displayOrders.length, loading })
            alert("✅ EnhancedOrdersTable component is working! Orders: " + displayOrders.length)
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          TEST COMPONENT ({displayOrders.length})
        </Button>

        <Button
          onClick={async () => {
            console.log("[v0] ========== DIRECT API TEST ==========")
            try {
              const response = await fetch("/api/orders")
              const data = await response.json()
              console.log("[v0] Direct API response:", data)
              alert("✅ Direct API call successful! Orders: " + (data.orders?.length || 0))
            } catch (error) {
              console.log("[v0] Direct API error:", error)
              alert("❌ Direct API error: " + error)
            }
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          TEST API DIRECT
        </Button>
      </div>

      <div className="space-y-4">
        {displayOrders.map((order) => {
          const validOrderId = getOrderId(order)
          console.log("[v0] Rendering order:", validOrderId)

          return (
            <Card
              key={validOrderId || `order-${order.customer_name}-${order.created_at}`}
              className="bg-gray-900/50 border-gray-700/30 hover:bg-gray-900/70 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6 items-center">
                  <div className="col-span-3">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ORDER</p>
                      <p className="font-mono text-lg font-bold text-white">{order.short_order_id}</p>
                      <p className="font-mono text-sm text-gray-600">#{order.order_id.slice(0, 6)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">CUSTOMER</p>
                      <div className="space-y-1">
                        <p className="text-white font-semibold">{order.customer_name}</p>
                        <p className="text-gray-300 text-sm">• {order.phone}</p>
                        <p className="text-gray-400 text-sm truncate" title={order.address}>
                          📍 {order.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">TOTAL</p>
                      <p className="text-xl font-bold text-white">৳{order.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="col-span-3">{getActionButtons(order)}</div>
                </div>
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
                Order ID: <span className="font-mono font-semibold text-white">{confirmationModal.orderId}</span>
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    console.log("[v0] ========== MODAL CANCEL CLICKED ==========")
                    cancelConfirmation()
                  }}
                  variant="outline"
                  disabled={confirmationModal.isProcessing}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log("[v0] ========== MODAL OK CLICKED ==========")
                    console.log("[v0] Time:", new Date().toISOString())
                    handleConfirmation()
                  }}
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
