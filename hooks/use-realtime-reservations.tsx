"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useNotificationSystem } from "@/hooks/use-notification-system"

interface Reservation {
  reservation_id: string
  name: string
  phone: string
  date: string
  time: string
  people_count: number
  user_id: string | null
  created_at: string
  status: string
  table: string
  notes: string
}

export function useRealtimeReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [error, setError] = useState<string | null>(null)
  const { notifyReservationChange } = useNotificationSystem()
  const subscriptionRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const fetchReservations = useCallback(async () => {
    try {
      setError(null)
      console.log("[v0] Fetching reservations from API...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/reservations", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Reservations API response:", data.reservations?.length || 0, "reservations")
        setReservations(data.reservations || [])
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("[v0] Error fetching reservations:", error)
      setConnectionStatus("disconnected")

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("Failed to fetch reservations")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const setupRealtimeSubscription = useCallback(() => {
    const supabase = createClient()
    setConnectionStatus("connecting")
    setError(null)

    // Clean up existing subscription
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (error) {
        console.warn("[v0] Error unsubscribing from reservations:", error)
      }
      subscriptionRef.current = null
    }

    console.log("[v0] Setting up reservations real-time subscription...")

    subscriptionRef.current = supabase
      .channel(`reservations-changes-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        (payload) => {
          console.log(
            "[v0] Real-time reservation change:",
            payload.eventType,
            payload.new?.reservation_id || payload.old?.reservation_id,
          )
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0

          if (payload.eventType === "INSERT") {
            const newReservation = payload.new as Reservation
            notifyReservationChange(newReservation.reservation_id, "pending", newReservation.name)

            setReservations((prev) => {
              const exists = prev.find((r) => r.reservation_id === newReservation.reservation_id)
              if (exists) return prev
              return [newReservation, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedReservation = payload.new as Reservation
            const oldReservation = payload.old as Reservation

            if (oldReservation.status !== updatedReservation.status) {
              notifyReservationChange(
                updatedReservation.reservation_id,
                updatedReservation.status,
                updatedReservation.name,
              )
            }

            setReservations((prev) =>
              prev.map((reservation) =>
                reservation.reservation_id === updatedReservation.reservation_id
                  ? { ...reservation, ...updatedReservation }
                  : reservation,
              ),
            )
          } else if (payload.eventType === "DELETE") {
            const deletedReservation = payload.old as Reservation
            notifyReservationChange(deletedReservation.reservation_id, "cancelled", deletedReservation.name)

            setReservations((prev) =>
              prev.filter((reservation) => reservation.reservation_id !== deletedReservation.reservation_id),
            )
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Reservations subscription status:", status)

        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
          reconnectAttemptsRef.current = 0
          setError(null)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = undefined
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("[v0] Reservations subscription error, attempting reconnect...")
          setConnectionStatus("disconnected")

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              setupRealtimeSubscription()
            }, delay)
          } else {
            setError("Real-time connection failed. Please refresh manually.")
          }
        }
      })
  }, [notifyReservationChange])

  useEffect(() => {
    fetchReservations()
    setupRealtimeSubscription()

    return () => {
      console.log("[v0] Cleaning up reservation subscriptions...")
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe()
        } catch (error) {
          console.warn("[v0] Error during cleanup:", error)
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [fetchReservations, setupRealtimeSubscription])

  return {
    reservations,
    loading,
    connectionStatus,
    error,
    refetch: fetchReservations,
  }
}
