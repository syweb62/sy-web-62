"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  created_at: string
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
  const { notifyOrderStatusChange } = useNotificationSystem()
  const subscriptionsRef = useRef<any[]>([])
  const isInitializedRef = useRef(false)

  const fetchOrders = useCallback(async () => {
    try {
      console.log("[v0] Fetching orders from API...")
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders API response:", data)
        setOrders(data.orders || [])
        setConnectionStatus("connected")
      } else {
        console.error("[v0] Failed to fetch orders:", response.status)
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      setConnectionStatus("disconnected")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOrderNotification = useCallback(
    (orderId: string, status: string, customerName: string, isNewOrder = false) => {
      console.log("[v0] Triggering notification:", { orderId, status, customerName, isNewOrder })

      // Always notify for new orders or status changes
      if (isNewOrder || status !== "pending") {
        notifyOrderStatusChange(orderId, status, customerName)
      }
    },
    [notifyOrderStatusChange],
  )

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    fetchOrders()

    const supabase = createClient()
    setConnectionStatus("connecting")

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
    subscriptionsRef.current = []

    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("[v0] Real-time order change:", payload)
          setConnectionStatus("connected")

          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order
            console.log("[v0] New order received:", newOrder)

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
            console.log("[v0] Order updated:", updatedOrder)

            handleOrderNotification(
              updatedOrder.short_order_id || updatedOrder.order_id,
              updatedOrder.status,
              updatedOrder.customer_name,
              false,
            )

            setOrders((prev) =>
              prev.map((order) => (order.order_id === updatedOrder.order_id ? { ...order, ...updatedOrder } : order)),
            )
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.order_id !== payload.old.order_id))
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Orders subscription status:", status)
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("disconnected")
        }
      })

    const orderItemsSubscription = supabase
      .channel("order-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          console.log("[v0] Order items changed, refreshing orders...")
          setConnectionStatus("connected")
          setTimeout(() => fetchOrders(), 200)
        },
      )
      .subscribe()

    subscriptionsRef.current = [ordersSubscription, orderItemsSubscription]

    return () => {
      console.log("[v0] Cleaning up real-time subscriptions...")
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      subscriptionsRef.current = []
      isInitializedRef.current = false
    }
  }, [fetchOrders, handleOrderNotification])

  return { orders, loading, connectionStatus, refetch: fetchOrders }
}
