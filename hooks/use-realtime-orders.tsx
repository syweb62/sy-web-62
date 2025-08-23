"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useNotificationSystem } from "@/hooks/use-notification-system"

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

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { notifyOrderStatusChange } = useNotificationSystem()
  const subscriptionsRef = useRef<any[]>([])

  const fetchOrders = useCallback(async () => {
    try {
      console.log("[v0] Fetching orders from API...")
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders API response:", data)
        setOrders(data.orders || [])
      } else {
        console.error("[v0] Failed to fetch orders:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOrderNotification = useCallback(
    (orderId: string, status: string, customerName: string) => {
      notifyOrderStatusChange(orderId, status, customerName)
    },
    [notifyOrderStatusChange],
  )

  useEffect(() => {
    fetchOrders()

    const supabase = createClient()

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

          if (payload.eventType === "INSERT") {
            handleOrderNotification(
              payload.new.short_order_id || payload.new.order_id,
              "pending",
              payload.new.customer_name,
            )
            setOrders((prev) => [payload.new as Order, ...prev])
          } else if (payload.eventType === "UPDATE") {
            handleOrderNotification(
              payload.new.short_order_id || payload.new.order_id,
              payload.new.status,
              payload.new.customer_name,
            )
            setOrders((prev) =>
              prev.map((order) => (order.id === payload.new.order_id ? { ...order, ...payload.new } : order)),
            )
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.order_id))
          }
        },
      )
      .subscribe()

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
          setTimeout(() => fetchOrders(), 500)
        },
      )
      .subscribe()

    subscriptionsRef.current = [ordersSubscription, orderItemsSubscription]

    return () => {
      console.log("[v0] Cleaning up real-time subscriptions...")
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      subscriptionsRef.current = []
    }
  }, [])

  return { orders, loading, refetch: fetchOrders }
}
