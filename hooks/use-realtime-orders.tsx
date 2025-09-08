"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useNotificationSystem } from "@/hooks/use-notification-system"

interface Order {
  id: string
  order_id: string
  short_order_id?: string
  customer_name: string
  phone: string
  address: string
  total_price: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | "completed"
  created_at: string
  special_instructions?: string
  payment_method?: string
  message?: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [error, setError] = useState<string | null>(null)
  const { notifyOrderStatusChange } = useNotificationSystem()
  const isInitializedRef = useRef(false)
  const lastFetchRef = useRef<number>(0)
  const requestInProgressRef = useRef(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchOrders = useCallback(async () => {
    if (requestInProgressRef.current) {
      return
    }

    requestInProgressRef.current = true

    try {
      setError(null)
      setLoading(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch("/api/orders", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      setConnectionStatus("disconnected")

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("Failed to fetch orders")
      }
    } finally {
      setLoading(false)
      requestInProgressRef.current = false
    }
  }, [])

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    fetchOrders()

    return () => {
      isInitializedRef.current = false
    }
  }, [fetchOrders])

  return { orders, loading, connectionStatus, error, refetch: fetchOrders }
}
