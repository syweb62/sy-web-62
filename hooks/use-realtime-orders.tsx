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
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
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
  const { notifyOrderStatusChange } = useNotificationSystem()
  const subscriptionsRef = useRef<any[]>([])
  const isInitializedRef = useRef(false)

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
      } else {
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
          setConnectionStatus("connected")

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
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.order_id !== payload.old.order_id))
          }
        },
      )
      .subscribe((status) => {
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
          setConnectionStatus("connected")
          debouncedRefresh()
        },
      )
      .subscribe()

    subscriptionsRef.current = [ordersSubscription, orderItemsSubscription]

    return () => {
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      subscriptionsRef.current = []
      isInitializedRef.current = false
    }
  }, []) // Removed dependencies to prevent subscription recreation

  return { orders, loading, connectionStatus, refetch: fetchOrders }
}
