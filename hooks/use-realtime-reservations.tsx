"use client"

import { useState, useEffect, useCallback } from "react"
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
  const { notifyReservation } = useNotificationSystem()

  const fetchReservations = useCallback(async () => {
    try {
      console.log("[v0] Fetching reservations from API...")
      const response = await fetch("/api/reservations")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Reservations API response:", data)
        setReservations(data.reservations || [])
      } else {
        console.error("[v0] Failed to fetch reservations:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservations()

    const supabase = createClient()

    const reservationsSubscription = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        (payload) => {
          console.log("[v0] Real-time reservation change:", payload)

          if (payload.eventType === "INSERT") {
            notifyReservation(
              "new",
              payload.new.reservation_id,
              payload.new.name,
              `${payload.new.date} at ${payload.new.time}`,
            )
            fetchReservations()
          } else if (payload.eventType === "UPDATE") {
            const statusChanged = payload.old.status !== payload.new.status
            if (statusChanged) {
              notifyReservation(
                "updated",
                payload.new.reservation_id,
                payload.new.name,
                `${payload.new.date} at ${payload.new.time}`,
              )
            }
            setReservations((prev) =>
              prev.map((reservation) =>
                reservation.reservation_id === payload.new.reservation_id
                  ? { ...reservation, ...payload.new }
                  : reservation,
              ),
            )
          } else if (payload.eventType === "DELETE") {
            notifyReservation(
              "cancelled",
              payload.old.reservation_id,
              payload.old.name,
              `${payload.old.date} at ${payload.old.time}`,
            )
            setReservations((prev) =>
              prev.filter((reservation) => reservation.reservation_id !== payload.old.reservation_id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Cleaning up reservation subscriptions...")
      reservationsSubscription.unsubscribe()
    }
  }, [fetchReservations, notifyReservation])

  return { reservations, loading, refetch: fetchReservations }
}
