"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
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

  useEffect(() => {
    fetchOrders()

    const supabase = createClient()

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
            addNotification({
              type: "info",
              title: "New Order Received",
              message: `Order from ${payload.new.customer_name || "Customer"}`,
              priority: "high",
            })

            // Refresh orders list
            fetchOrders()
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.order_id ? { ...order, status: payload.new.status, ...payload.new } : order,
              ),
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
          // Refresh orders when items change
          fetchOrders()
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Cleaning up real-time subscriptions...")
      ordersSubscription.unsubscribe()
      orderItemsSubscription.unsubscribe()
    }
  }, [fetchOrders, addNotification])

  return { orders, loading, refetch: fetchOrders }
}
