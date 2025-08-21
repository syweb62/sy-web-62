"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export function useRealtimeMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenuItems()

    const menuSubscription = supabase
      .channel("menu-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          console.log("[v0] Real-time menu change:", payload)

          if (payload.eventType === "INSERT") {
            setMenuItems((prev) => [payload.new as MenuItem, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setMenuItems((prev) =>
              prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item)),
            )
          } else if (payload.eventType === "DELETE") {
            setMenuItems((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      menuSubscription.unsubscribe()
    }
  }, [fetchMenuItems])

  return { menuItems, loading, refetch: fetchMenuItems }
}
