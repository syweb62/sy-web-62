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

      if (!user?.email) {
        console.log("[v0] No authenticated user, showing empty order history")
        setOrders([])
        setLoading(false)
        return
      }

      // Get user profile to find associated phone number or customer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name, email")
        .eq("email", user.email)
        .single()

      console.log("[v0] User profile:", profile)

      let query = supabase
        .from("orders")
        .select(`
          order_id,
          short_order_id,
          customer_name,
          phone_number,
          address,
          payment_method,
          status,
          total_amount,
          discount,
          created_at,
          order_items (
            item_id,
            quantity,
            price,
            product_name
          )
        `)
        .order("created_at", { ascending: false })

      if (profile?.phone) {
        // Filter by phone number if available in profile
        query = query.eq("phone_number", profile.phone)
        console.log("[v0] Filtering orders by phone number:", profile.phone)
      } else {
        // Fallback: filter by customer name matching user's full name or email
        const searchTerms = [user.email]
        if (profile?.full_name) {
          searchTerms.push(profile.full_name)
        }

        // Use OR condition to match either customer name or email-like patterns
        const orConditions = searchTerms.map((term) => `customer_name.ilike.%${term}%`).join(",")
        query = query.or(orConditions)
        console.log("[v0] Filtering orders by customer name/email patterns:", searchTerms)
      }

      const { data, error: fetchError } = await query

      console.log("[v0] Database query result:", { data: data?.length || 0, error: fetchError })

      if (fetchError) {
        console.error("[v0] Error fetching orders:", fetchError)
        setError(`Failed to load order history: ${fetchError.message}`)
        return
      }

      const filteredData = data || []
      console.log("[v0] User-specific orders found:", filteredData.length)

      const formattedOrders: OrderHistoryItem[] = filteredData.map((order: any) => ({
        order_id: order.order_id,
        short_order_id: order.short_order_id, // Added short_order_id field for human-readable order IDs
        customer_name: order.customer_name || "Unknown",
        phone_number: order.phone_number || "",
        address: order.address || "",
        payment_method: order.payment_method || "cash",
        status: order.status,
        total_amount: order.total_amount || 0,
        discount: order.discount,
        created_at: order.created_at,
        items: (order.order_items || []).map((item: any) => ({
          id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.product_name,
        })),
      }))

      console.log("[v0] Formatted orders count:", formattedOrders.length)
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
