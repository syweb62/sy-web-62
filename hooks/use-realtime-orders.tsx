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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const requestInProgressRef = useRef(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchOrders = useCallback(async () => {
    if (requestInProgressRef.current) {
      console.log("[v0] Request already in progress, skipping...")
      return
    }

    const now = Date.now()
    if (now - lastFetchRef.current < 1000) {
      console.log("[v0] Debouncing rapid request...")
      return
    }

    lastFetchRef.current = now
    requestInProgressRef.current = true

    try {
      setError(null)
      console.log("[v0] Fetching orders from API...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch("/api/orders", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders API response:", data.orders?.length || 0, "orders")
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
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
      requestInProgressRef.current = false
    }
  }, [])

  const debouncedFetchOrders = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchOrders()
    }, 300) // 300ms debounce for smooth performance
  }, [fetchOrders])

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
        .channel("orders-realtime-instant")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            console.log("[v0] Real-time update received:", payload.eventType)
            debouncedFetchOrders()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Subscription status:", status)

          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected")
            reconnectAttemptsRef.current = 0
            console.log("[v0] Real-time connection established successfully")
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.log("[v0] Real-time connection failed, attempting reconnection")
            setConnectionStatus("disconnected")
            attemptReconnection()
          }
        })

      subscriptionRef.current = channel

      setTimeout(() => {
        if (connectionStatus !== "connected") {
          console.log("[v0] Real-time connection timeout, attempting reconnection")
          attemptReconnection()
        }
      }, 3000)
    } catch (error) {
      console.error("[v0] Error setting up real-time subscription:", error)
      attemptReconnection()
    }
  }, [supabase, debouncedFetchOrders, connectionStatus])

  const setupPollingFallback = useCallback(() => {
    console.log("[v0] Setting up polling fallback...")

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchOrders()
    }, 10000)

    setConnectionStatus("connected")
  }, [fetchOrders])

  const attemptReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= 3) {
      // Reduced max attempts from 5 to 3
      console.log("[v0] Max reconnection attempts reached, using polling fallback")
      setupPollingFallback()
      return
    }

    const delay = Math.min(1000 * Math.pow(1.2, reconnectAttemptsRef.current), 5000)
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

    setupRealtimeSubscription()

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

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      isInitializedRef.current = false
    }
  }, [fetchOrders, setupRealtimeSubscription])

  return { orders, loading, connectionStatus, error, refetch: fetchOrders }
}
