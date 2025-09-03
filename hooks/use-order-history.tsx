"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

export interface OrderHistoryItem {
  order_id: string
  short_order_id?: string
  customer_name: string
  phone_number: string // Updated to match database schema
  address: string
  payment_method: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total_amount: number // Updated to match database schema
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  message?: string
  created_at: string
  items?: Array<{
    id: string
    quantity: number
    price: number // Updated to match database schema
    product_name?: string | null // Updated to match database schema
  }>
}

export function useOrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    console.log("[v0] ========== FETCHING ORDER HISTORY ==========")
    console.log("[v0] User authenticated:", !!user)
    console.log("[v0] User email:", user?.email)
    console.log("[v0] Fetch time:", new Date().toISOString())

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      console.log("[v0] Database query result:", { data: data?.length || 0, error: fetchError })

      if (fetchError) {
        console.error("[v0] Error fetching orders:", fetchError)
        setError(`Failed to load order history: ${fetchError.message}`)
        return
      }

      let filteredData = data || []

      if (user?.email) {
        // For authenticated users, try to match by email or name patterns
        const emailPattern = user.email.toLowerCase()
        filteredData = filteredData.filter(
          (order) =>
            order.customer_name?.toLowerCase().includes(emailPattern.split("@")[0]) ||
            order.phone_number === user.phone,
        )
        console.log("[v0] Filtered orders for authenticated user:", filteredData.length)
      } else {
        // For non-authenticated users, check localStorage for recent order info
        const recentOrderInfo = localStorage.getItem("recent_order_info")
        if (recentOrderInfo) {
          try {
            const orderInfo = JSON.parse(recentOrderInfo)
            if (orderInfo.phone) {
              filteredData = filteredData.filter((order) => order.phone_number === orderInfo.phone)
              console.log("[v0] Filtered orders by stored phone:", filteredData.length)
            } else if (orderInfo.name) {
              filteredData = filteredData.filter((order) =>
                order.customer_name?.toLowerCase().includes(orderInfo.name.toLowerCase()),
              )
              console.log("[v0] Filtered orders by stored name:", filteredData.length)
            }
          } catch (e) {
            console.log("[v0] Error parsing stored order info")
          }
        }

        if (filteredData.length === 0) {
          const oneDayAgo = new Date()
          oneDayAgo.setDate(oneDayAgo.getDate() - 1)
          filteredData = (data || []).filter((order) => new Date(order.created_at) >= oneDayAgo)
          console.log("[v0] No stored order info, showing recent orders from last 24 hours")
        }
      }

      const formattedOrders: OrderHistoryItem[] = []

      for (const order of filteredData) {
        const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", order.order_id)

        formattedOrders.push({
          order_id: order.order_id,
          short_order_id: order.short_order_id,
          customer_name: order.customer_name || "Unknown",
          phone_number: order.phone_number || "",
          address: order.address || "",
          payment_method: order.payment_method || "cash",
          status: order.status,
          total_amount: order.total_amount || 0,
          discount: order.discount,
          created_at: order.created_at,
          items: (orderItems || []).map((item: any) => ({
            id: item.item_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name,
          })),
        })
      }

      console.log("[v0] Final formatted orders count:", formattedOrders.length)
      if (formattedOrders.length > 0) {
        console.log("[v0] Sample order:", formattedOrders[0])
      }

      setOrders(formattedOrders)
    } catch (err) {
      console.error("[v0] Error in fetchOrders:", err)
      setError(`Failed to load order history: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const reorder = async (order: OrderHistoryItem) => {
    console.log("Reordering:", order)
    return Promise.resolve()
  }

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("order_id", orderId)
      if (error) {
        console.error("Error cancelling order:", error)
        throw error
      }
      await fetchOrders()
    } catch (err) {
      console.error("Error in cancelOrder:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user?.email])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    reorder,
    cancelOrder,
  }
}
