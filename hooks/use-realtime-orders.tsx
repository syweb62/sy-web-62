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
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [error, setError] = useState<string | null>(null)
  const { notifyOrderStatusChange } = useNotificationSystem()
  const isInitializedRef = useRef(false)
  const lastFetchRef = useRef<number>(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout>()
  const subscriptionRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchOrders = useCallback(async () => {
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) {
      console.log("[v0] Skipping fetch - too soon since last fetch")
      return
    }
    lastFetchRef.current = now

    try {
      setError(null)
      console.log("[v0] Fetching orders from API...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch("/api/orders", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders API response:", data.orders?.length || 0, "orders")
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0 // Reset reconnect attempts on success
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
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
    }
  }, [])

  const setupRealtimeSubscription = useCallback(() => {
    console.log("[v0] Setting up real-time subscription...")
    setConnectionStatus("connecting")

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    try {
      const channel = supabase
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            console.log("[v0] Real-time update received:", payload.eventType)

            // Debounced refresh to avoid excessive API calls
            setTimeout(() => {
              fetchOrders()
            }, 500)
          },
        )
        .subscribe((status) => {
          console.log("[v0] Subscription status:", status)

          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected")
            reconnectAttemptsRef.current = 0
            console.log("[v0] Real-time connection established successfully")
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.log("[v0] Real-time connection failed, falling back to polling")
            setConnectionStatus("disconnected")
            setupPollingFallback()
          }
        })

      subscriptionRef.current = channel

      // Set a timeout to fallback to polling if subscription doesn't connect within 10 seconds
      setTimeout(() => {
        if (connectionStatus !== "connected") {
          console.log("[v0] Real-time connection timeout, falling back to polling")
          setupPollingFallback()
        }
      }, 10000)
    } catch (error) {
      console.error("[v0] Error setting up real-time subscription:", error)
      setupPollingFallback()
    }
  }, [supabase, fetchOrders, connectionStatus])

  const setupPollingFallback = useCallback(() => {
    console.log("[v0] Setting up polling fallback...")

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Poll every 30 seconds as fallback
    pollingIntervalRef.current = setInterval(() => {
      fetchOrders()
    }, 30000)

    setConnectionStatus("connected") // Show as connected even with polling
  }, [fetchOrders])

  const attemptReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= 3) {
      console.log("[v0] Max reconnection attempts reached, using polling fallback")
      setupPollingFallback()
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
    reconnectAttemptsRef.current++

    console.log(`[v0] Attempting reconnection ${reconnectAttemptsRef.current}/3 in ${delay}ms`)

    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtimeSubscription()
    }, delay)
  }, [setupRealtimeSubscription, setupPollingFallback])

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log("[v0] Initializing real-time orders hook...")

    // Initial fetch
    fetchOrders()

    // Setup real-time subscription after initial fetch
    setTimeout(() => {
      setupRealtimeSubscription()
    }, 2000)

    return () => {
      console.log("[v0] Cleaning up real-time orders hook...")

      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }

      // Clean up polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      isInitializedRef.current = false
    }
  }, [fetchOrders, setupRealtimeSubscription])

  return { orders, loading, connectionStatus, error, refetch: fetchOrders }
}
