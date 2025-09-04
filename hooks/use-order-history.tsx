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

      let filteredData: any[] = []

      if (user?.email) {
        // For authenticated users, only show their orders
        if (user.email === "admin@sushiyaki.com") {
          // Admin can see all orders
          const { data, error: fetchError } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50)

          if (fetchError) {
            console.error("[v0] Error fetching orders:", fetchError)
            setError(`Failed to load order history: ${fetchError.message}`)
            return
          }

          filteredData = data || []
          console.log("[v0] Admin access - showing all orders:", filteredData.length)
        } else {
          // Regular users - filter by their email or phone
          const { data, error: fetchError } = await supabase
            .from("orders")
            .select("*")
            .or(`customer_name.ilike.%${user.email.split("@")[0]}%,phone_number.eq.${user.phone || ""}`)
            .order("created_at", { ascending: false })
            .limit(50)

          if (fetchError) {
            console.error("[v0] Error fetching user orders:", fetchError)
            setError(`Failed to load order history: ${fetchError.message}`)
            return
          }

          filteredData = data || []
          console.log("[v0] User-specific orders found:", filteredData.length)
        }
      } else {
        // For non-authenticated users, try to match by stored phone number only
        const recentOrderInfo = localStorage.getItem("recent_order_info")
        if (recentOrderInfo) {
          try {
            const orderInfo = JSON.parse(recentOrderInfo)
            if (orderInfo.phone) {
              const { data, error: fetchError } = await supabase
                .from("orders")
                .select("*")
                .eq("phone_number", orderInfo.phone)
                .order("created_at", { ascending: false })
                .limit(20)

              if (fetchError) {
                console.error("[v0] Error fetching orders by phone:", fetchError)
                setError(`Failed to load order history: ${fetchError.message}`)
                return
              }

              filteredData = data || []
              console.log("[v0] Orders found by stored phone:", filteredData.length)
            }
          } catch (e) {
            console.log("[v0] Error parsing stored order info")
          }
        }

        // If no stored info, show empty results (don't show other users' orders)
        if (!recentOrderInfo) {
          console.log("[v0] No authentication or stored info - showing empty results")
          setOrders([])
          setLoading(false)
          return
        }
      }

      console.log("[v0] Database query result:", { data: filteredData.length, error: null })

      if (!filteredData || filteredData.length === 0) {
        console.log("[v0] No orders found for this user")
        setOrders([])
        return
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
  }, [])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    reorder,
    cancelOrder,
  }
}
