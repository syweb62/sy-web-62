"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useNotifications } from "@/context/notification-context"

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
  const { addNotification } = useNotifications()

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

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
            // New order notification
            addNotification({
              type: "order",
              title: "New Order Received",
              message: `Order from ${payload.new.customer_name}`,
              priority: "high",
              data: payload.new,
            })

            // Refresh orders list
            fetchOrders()
          } else if (payload.eventType === "UPDATE") {
            // Order status update
            setOrders((prev) =>
              prev.map((order) => (order.id === payload.new.id ? { ...order, ...payload.new } : order)),
            )
          } else if (payload.eventType === "DELETE") {
            // Order deleted
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
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
          // Refresh orders when items change
          fetchOrders()
        },
      )
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
      orderItemsSubscription.unsubscribe()
    }
  }, [fetchOrders, addNotification])

  return { orders, loading, refetch: fetchOrders }
}
