"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const supabase = createClient()

export interface OrderHistoryItem {
  order_id: string
  short_order_id?: string
  customer_name: string
  phone: string // Updated interface to match page expectations
  address: string
  payment_method: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total_price: number // Updated interface to match page expectations
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  message?: string
  created_at: string
  items?: Array<{
    id: string
    menu_item_id?: string | null // Added for compatibility with reorder function
    quantity: number
    price_at_purchase: number // Updated interface to match page expectations
    item_name?: string | null // Updated interface to match page expectations
    item_description?: string | null // Added for compatibility
    item_image?: string | null // Added for compatibility
  }>
}

export function useOrderHistory() {
  const { user, session } = useAuth()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    console.log("[v0] ========== FETCHING ORDER HISTORY ==========")
    console.log("[v0] User authenticated:", !!user)
    console.log("[v0] User email:", user?.email)
    console.log("[v0] Session exists:", !!session)

    try {
      setLoading(true)
      setError(null)

      let filteredData: any[] = []

      if (user?.email === "admin@sushiyaki.com") {
        // Admin sees all orders
        const { data, error: fetchError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              item_id,
              quantity,
              price,
              product_name
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50)

        if (fetchError) {
          console.error("[v0] Error fetching orders:", fetchError)
          setError(`Failed to load order history: ${fetchError.message}`)
          return
        }

        filteredData = data || []
        console.log("[v0] Admin access - showing all orders:", filteredData.length)
      } else if (user && session) {
        // Authenticated user sees their own orders
        const { data: profile } = await supabase.from("profiles").select("phone").eq("email", user.email).single()
        const userPhone = profile?.phone || ""

        const { data, error: fetchError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              item_id,
              quantity,
              price,
              product_name
            )
          `)
          .or(`customer_name.eq.${user.email},phone_number.eq.${userPhone}`)
          .order("created_at", { ascending: false })
          .limit(20)

        if (fetchError) {
          console.error("[v0] Error fetching user orders:", fetchError)
          setError(`Failed to load order history: ${fetchError.message}`)
          return
        }

        filteredData = (data || []).filter(
          (order) => order.customer_name === user.email || (userPhone && order.phone_number === userPhone),
        )

        console.log("[v0] User-specific orders found:", filteredData.length)
      } else {
        // Non-authenticated user - check localStorage for customer info
        const storedCustomerInfo = localStorage.getItem("customerInfo")
        if (storedCustomerInfo) {
          const customerInfo = JSON.parse(storedCustomerInfo)
          console.log("[v0] Using stored customer info for order lookup")

          const { data, error: fetchError } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                item_id,
                quantity,
                price,
                product_name
              )
            `)
            .eq("phone_number", customerInfo.phone)
            .order("created_at", { ascending: false })
            .limit(10)

          if (fetchError) {
            console.error("[v0] Error fetching orders by phone:", fetchError)
            setError(`Failed to load order history: ${fetchError.message}`)
            return
          }

          filteredData = data || []
          console.log("[v0] Orders found by phone:", filteredData.length)
        } else {
          console.log("[v0] No authenticated user and no stored customer info - showing empty results")
          setOrders([])
          setLoading(false)
          return
        }
      }

      const formattedOrders: OrderHistoryItem[] = filteredData.map((order) => ({
        order_id: order.order_id,
        short_order_id: order.short_order_id,
        customer_name: order.customer_name || "Unknown",
        phone: order.phone_number || "", // Map phone_number to phone
        address: order.address || "",
        payment_method: order.payment_method || "cash",
        status: order.status,
        total_price: order.total_amount || 0, // Map total_amount to total_price
        subtotal: order.total_amount ? order.total_amount - (order.discount || 0) : 0,
        discount: order.discount,
        vat: 0, // VAT not in current schema
        delivery_charge: 0, // Delivery charge not in current schema
        created_at: order.created_at,
        items: (order.order_items || []).map((item: any) => ({
          id: item.item_id,
          menu_item_id: item.item_id, // Use item_id as menu_item_id for compatibility
          quantity: item.quantity,
          price_at_purchase: item.price, // Map price to price_at_purchase
          item_name: item.product_name, // Map product_name to item_name
          item_description: null, // Not available in current schema
          item_image: null, // Not available in current schema
        })),
      }))

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

  useEffect(() => {
    const subscription = supabase
      .channel("order-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time order update received:", payload)
        fetchOrders() // Refresh orders when any order is updated
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
  }, [user?.email, session])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    reorder,
    cancelOrder,
  }
}
