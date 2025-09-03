"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { useNotificationSystem } from "@/hooks/use-notification-system"

interface Order {
  id: string
  order_id: string
  short_order_id?: string
  customer_name: string
  phone: string
  address: string
  total_price: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | "completed"
  created_at: string
  special_instructions?: string
  payment_method?: string
  message?: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [error, setError] = useState<string | null>(null)
  const { notifyOrderStatusChange } = useNotificationSystem()
  const subscriptionsRef = useRef<any[]>([])
  const isInitializedRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const fetchOrders = useCallback(async () => {
    try {
      setError(null)
      console.log("[v0] Fetching orders from API...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/orders", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders API response:", data.orders?.length || 0, "orders")
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      setConnectionStatus("disconnected")

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("Failed to fetch orders")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOrderNotification = useCallback(
    (orderId: string, status: string, customerName: string, isNewOrder = false) => {
      if (isNewOrder || status !== "pending") {
        notifyOrderStatusChange(orderId, status, customerName)
      }
    },
    [notifyOrderStatusChange],
  )

  const debouncedRefresh = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fetchOrders(), 300)
    }
  }, [fetchOrders])

  const setupRealtimeSubscriptions = useCallback(() => {
    const supabase = createClient()
    setConnectionStatus("connecting")
    setError(null)

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach((sub) => {
      try {
        sub?.unsubscribe()
      } catch (error) {
        console.warn("[v0] Error unsubscribing:", error)
      }
    })
    subscriptionsRef.current = []

    console.log("[v0] Setting up real-time subscriptions...")

    const ordersSubscription = supabase
      .channel(`orders-changes-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log(
            "[v0] Real-time order change:",
            payload.eventType,
            payload.new?.short_order_id || payload.old?.short_order_id,
          )
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0

          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order
            handleOrderNotification(
              newOrder.short_order_id || newOrder.order_id,
              "pending",
              newOrder.customer_name,
              true,
            )

            setOrders((prev) => {
              const exists = prev.find((order) => order.order_id === newOrder.order_id)
              if (exists) return prev
              return [newOrder, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order
            handleOrderNotification(
              updatedOrder.short_order_id || updatedOrder.order_id,
              updatedOrder.status,
              updatedOrder.customer_name,
              false,
            )

            setOrders((prev) =>
              prev.map((order) => (order.order_id === updatedOrder.order_id ? { ...order, ...updatedOrder } : order)),
            )

            const statusChangeEvent = new CustomEvent("orderStatusChanged", {
              detail: {
                orderId: updatedOrder.short_order_id || updatedOrder.order_id,
                newStatus: updatedOrder.status,
                customerName: updatedOrder.customer_name,
              },
            })
            window.dispatchEvent(statusChangeEvent)
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.order_id !== payload.old.order_id))
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Orders subscription status:", status)
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0
          setError(null)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = undefined
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("[v0] Orders subscription error, attempting reconnect...")
          setConnectionStatus("disconnected")

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              setupRealtimeSubscriptions()
            }, delay)
          } else {
            setError("Real-time connection failed. Please refresh manually.")
          }
        }
      })

    const orderItemsSubscription = supabase
      .channel(`order-items-changes-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        (payload) => {
          console.log("[v0] Real-time order items change:", payload.eventType)
          setConnectionStatus("connected")
          debouncedRefresh()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Order items subscription status:", status)
      })

    subscriptionsRef.current = [ordersSubscription, orderItemsSubscription]
  }, [handleOrderNotification, debouncedRefresh])

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log("[v0] Initializing real-time orders hook...")
    fetchOrders()
    setupRealtimeSubscriptions()

    return () => {
      console.log("[v0] Cleaning up real-time orders hook...")
      subscriptionsRef.current.forEach((sub) => {
        try {
          sub?.unsubscribe()
        } catch (error) {
          console.warn("[v0] Error during cleanup:", error)
        }
      })
      subscriptionsRef.current = []
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      isInitializedRef.current = false
    }
  }, []) // Removed dependencies to prevent subscription recreation

  return { orders, loading, connectionStatus, error, refetch: fetchOrders }
}
