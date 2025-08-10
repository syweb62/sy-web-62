"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

export interface OrderHistoryItem {
  order_id: string
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
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    // Avoid RLS errors by not querying when logged out
    if (!user?.id) {
      setOrders([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price_at_purchase,
            item_name,
            item_description,
            item_image
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("Error fetching orders:", fetchError)
        setError("Failed to load order history")
        return
      }

      const formattedOrders: OrderHistoryItem[] = (data || []).map((order: any) => ({
        order_id: order.order_id,
        customer_name: order.customer_name || "Unknown",
        phone: order.phone || "",
        address: order.address || "",
        payment_method: order.payment_method || "cash",
        status: order.status,
        total_price: order.total_price,
        subtotal: order.subtotal,
        discount: order.discount,
        vat: order.vat,
        delivery_charge: order.delivery_charge,
        message: order.message,
        created_at: order.created_at,
        items: order.order_items || [],
      }))

      setOrders(formattedOrders)
    } catch (err) {
      console.error("Error in fetchOrders:", err)
      setError("Failed to load order history")
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
  }, [user?.id])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    reorder,
    cancelOrder,
  }
}
