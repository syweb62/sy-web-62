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
        .limit(50)

      console.log("[v0] Database query result:", { data: data?.length || 0, error: fetchError })

      if (fetchError) {
        console.error("[v0] Error fetching orders:", fetchError)
        setError(`Failed to load order history: ${fetchError.message}`)
        return
      }

      if (!data || data.length === 0) {
        console.log("[v0] No orders found in database")
        setOrders([])
        return
      }

      let filteredData = data

      // If user is authenticated, try to filter by their information
      if (user?.email) {
        const userOrders = data.filter((order) => {
          const emailMatch = order.customer_name?.toLowerCase().includes(user.email?.split("@")[0].toLowerCase() || "")
          const phoneMatch = user.phone && order.phone_number === user.phone
          return emailMatch || phoneMatch
        })

        if (userOrders.length > 0) {
          filteredData = userOrders
          console.log("[v0] Found user-specific orders:", userOrders.length)
        } else {
          console.log("[v0] No user-specific orders found, showing recent orders")
          // Show recent orders from last 7 days if no user-specific orders
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          filteredData = data.filter((order) => new Date(order.created_at) >= sevenDaysAgo)
        }
      } else {
        const recentOrderInfo = localStorage.getItem("recent_order_info")
        if (recentOrderInfo) {
          try {
            const orderInfo = JSON.parse(recentOrderInfo)
            if (orderInfo.phone) {
              const phoneOrders = data.filter((order) => order.phone_number === orderInfo.phone)
              if (phoneOrders.length > 0) {
                filteredData = phoneOrders
                console.log("[v0] Found orders by stored phone:", phoneOrders.length)
              }
            }
          } catch (e) {
            console.log("[v0] Error parsing stored order info")
          }
        }

        // If no stored info or no matching orders, show recent orders from last 24 hours
        if (filteredData === data) {
          const oneDayAgo = new Date()
          oneDayAgo.setDate(oneDayAgo.getDate() - 1)
          filteredData = data.filter((order) => new Date(order.created_at) >= oneDayAgo)
          console.log("[v0] Showing recent orders from last 24 hours:", filteredData.length)
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
