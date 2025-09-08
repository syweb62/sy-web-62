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
      return
    }

    const now = Date.now()
    if (now - lastFetchRef.current < 3000) {
      return
    }

    lastFetchRef.current = now
    requestInProgressRef.current = true

    try {
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch("/api/orders", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
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

  const debouncedFetchOrders = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchOrders()
    }, 1000)
  }, [fetchOrders])

  const setupRealtimeSubscription = useCallback(() => {
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
            debouncedFetchOrders()
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected")
            reconnectAttemptsRef.current = 0
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnectionStatus("disconnected")
            attemptReconnection()
          }
        })

      subscriptionRef.current = channel

      setTimeout(() => {
        if (connectionStatus !== "connected") {
          attemptReconnection()
        }
      }, 2000)
    } catch (error) {
      attemptReconnection()
    }
  }, [supabase, debouncedFetchOrders, connectionStatus])

  const setupPollingFallback = useCallback(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchOrders()
    }, 60000)

    setConnectionStatus("connected")
  }, [fetchOrders])

  const attemptReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= 3) {
      setupPollingFallback()
      return
    }

    const delay = Math.min(1000 * (reconnectAttemptsRef.current + 1), 3000)
    reconnectAttemptsRef.current++

    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtimeSubscription()
    }, delay)
  }, [setupRealtimeSubscription, setupPollingFallback])

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Initial fetch
    fetchOrders()
    setupRealtimeSubscription()

    return () => {
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
