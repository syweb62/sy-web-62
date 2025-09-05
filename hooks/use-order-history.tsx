"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const supabase = createClient()

export interface OrderHistoryItem {
  order_id: string
  short_order_id?: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total_price: number
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  message?: string
  created_at: string
  items?: Array<{
    id: string
    menu_item_id?: string | null
    quantity: number
    price_at_purchase: number
    item_name?: string | null
    item_description?: string | null
    item_image?: string | null
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

      // Check if user is admin
      if (user?.email === "admin@sushiyaki.com") {
        console.log("[v0] Admin user detected - fetching all orders")
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
          console.error("[v0] Error fetching admin orders:", fetchError)
          setError(`Failed to load order history: ${fetchError.message}`)
          return
        }

        filteredData = data || []
        console.log("[v0] Admin access - showing all orders:", filteredData.length)
      } else {
        // For regular users (authenticated or not), use phone number matching
        let customerPhone = ""
        let customerEmail = ""

        if (user && session) {
          // Authenticated user - get their profile info
          customerEmail = user.email || ""
          console.log("[v0] Authenticated user, email:", customerEmail)

          // Try to get phone from profile
          const { data: profile } = await supabase.from("profiles").select("phone").eq("email", customerEmail).single()

          customerPhone = profile?.phone || ""
          console.log("[v0] User profile phone:", customerPhone)
        } else {
          // Non-authenticated user - check localStorage
          const storedCustomerInfo = localStorage.getItem("customerInfo")
          if (storedCustomerInfo) {
            try {
              const customerInfo = JSON.parse(storedCustomerInfo)
              customerPhone = customerInfo.phone || ""
              customerEmail = customerInfo.email || ""
              console.log("[v0] Using stored customer info - phone:", customerPhone, "email:", customerEmail)
            } catch (e) {
              console.error("[v0] Error parsing stored customer info:", e)
            }
          }
        }

        // If we have either phone or email, fetch orders
        if (customerPhone || customerEmail) {
          let query = supabase.from("orders").select(`
              *,
              order_items (
                item_id,
                quantity,
                price,
                product_name
              )
            `)

          // Build filter conditions
          const conditions = []
          if (customerPhone) conditions.push(`phone_number.eq.${customerPhone}`)
          if (customerEmail) conditions.push(`customer_name.eq.${customerEmail}`)

          if (conditions.length > 0) {
            query = query.or(conditions.join(","))
          }

          const { data, error: fetchError } = await query.order("created_at", { ascending: false }).limit(20)

          if (fetchError) {
            console.error("[v0] Error fetching user orders:", fetchError)
            setError(`Failed to load order history: ${fetchError.message}`)
            return
          }

          // Additional client-side filtering for security
          filteredData = (data || []).filter((order) => {
            const phoneMatch = customerPhone && order.phone_number === customerPhone
            const emailMatch = customerEmail && order.customer_name === customerEmail
            return phoneMatch || emailMatch
          })

          console.log("[v0] User-specific orders found:", filteredData.length)
          console.log("[v0] Filter criteria - phone:", customerPhone, "email:", customerEmail)
        } else {
          console.log("[v0] No customer identification available - showing empty results")
          setOrders([])
          setLoading(false)
          return
        }
      }

      const formattedOrders: OrderHistoryItem[] = filteredData.map((order) => ({
        order_id: order.order_id,
        short_order_id: order.short_order_id,
        customer_name: order.customer_name || "Unknown",
        phone: order.phone_number || "",
        address: order.address || "",
        payment_method: order.payment_method || "cash",
        status: order.status,
        total_price: order.total_amount || 0,
        subtotal: order.total_amount ? order.total_amount - (order.discount || 0) : 0,
        discount: order.discount || 0,
        vat: 0,
        delivery_charge: 0,
        created_at: order.created_at,
        items: (order.order_items || []).map((item: any) => ({
          id: item.item_id,
          menu_item_id: item.item_id,
          quantity: item.quantity,
          price_at_purchase: item.price,
          item_name: item.product_name,
          item_description: null,
          item_image: null,
        })),
      }))

      console.log("[v0] Final formatted orders count:", formattedOrders.length)
      if (formattedOrders.length > 0) {
        console.log("[v0] Sample order:", {
          id: formattedOrders[0].order_id,
          customer: formattedOrders[0].customer_name,
          phone: formattedOrders[0].phone,
          total: formattedOrders[0].total_price,
          items: formattedOrders[0].items?.length || 0,
        })
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
    console.log("[v0] Setting up real-time subscription for order updates")

    const subscription = supabase
      .channel("order-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time order update received:", payload)
        fetchOrders() // Refresh orders when any order is updated
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time new order received:", payload)
        fetchOrders() // Refresh orders when new order is created
      })
      .subscribe((status) => {
        console.log("[v0] Real-time subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
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
