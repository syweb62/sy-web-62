"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface WebsiteSettings {
  restaurant_settings: any
  delivery_settings: any
}

export function useWebsiteSettings() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSettings()

    const channel = supabase
      .channel("website_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "website_settings",
        },
        (payload) => {
          console.log("[v0] Website settings changed:", payload)
          if (payload.new) {
            setSettings(payload.new as WebsiteSettings)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("website_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setSettings(data)
    } catch (error) {
      console.error("[v0] Error loading website settings:", error)
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, refetch: loadSettings }
}
