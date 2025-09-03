"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"

export interface Notification {
  id: string
  type: "order" | "reservation" | "system" | "menu"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high"
  data?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  connectionStatus: "connected" | "connecting" | "disconnected"
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const isConnectingRef = useRef(false)

  const setupConnection = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log("[v0] Connection attempt already in progress, skipping...")
      return
    }

    isConnectingRef.current = true

    try {
      setConnectionStatus("connecting")
      console.log("[v0] Setting up notifications connection...")

      const supabase = supabaseRef.current

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("[v0] Error loading notifications:", error)
        throw error
      }

      const formattedNotifications: Notification[] = data.map((item) => ({
        id: item.notification_id,
        type: item.type || "system",
        title: item.message?.split(":")[0] || "Notification",
        message: item.message || "",
        timestamp: new Date(item.created_at),
        read: item.is_read || false,
        priority: "medium",
      }))

      setNotifications(formattedNotifications)

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      channelRef.current = supabase
        .channel(`notifications-changes-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            console.log("[v0] Real-time notification change:", payload)
            reconnectAttemptsRef.current = 0

            if (payload.eventType === "INSERT") {
              const newNotification: Notification = {
                id: payload.new.notification_id,
                type: payload.new.type || "system",
                title: payload.new.message?.split(":")[0] || "Notification",
                message: payload.new.message || "",
                timestamp: new Date(payload.new.created_at),
                read: false,
                priority: "medium",
              }

              setNotifications((prev) => [newNotification, ...prev.slice(0, 49)])

              if (newNotification.priority === "high" || newNotification.type === "order") {
                try {
                  const audio = new Audio("/sounds/notification.mp3")
                  audio.volume = 0.3
                  audio.play().catch(() => {
                    if ("Notification" in window && Notification.permission === "granted") {
                      new Notification(newNotification.title, {
                        body: newNotification.message,
                        icon: "/favicon.ico",
                        tag: newNotification.id,
                      })
                    }
                  })
                } catch (error) {
                  console.log("[v0] Audio notification not available:", error)
                }
              }
            } else if (payload.eventType === "UPDATE") {
              setNotifications((prev) =>
                prev.map((notification) =>
                  notification.id === payload.new.notification_id
                    ? { ...notification, read: payload.new.is_read || false }
                    : notification,
                ),
              )
            }
          },
        )
        .subscribe((status) => {
          console.log("[v0] Notifications subscription status:", status)

          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected")
            reconnectAttemptsRef.current = 0
            isConnectingRef.current = false
            console.log("[v0] Notifications real-time connection established")
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setConnectionStatus("disconnected")
            isConnectingRef.current = false
            console.log("[v0] Notifications connection lost, attempting reconnection...")

            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++
                setupConnection()
              }, delay)
            } else {
              console.log("[v0] Max reconnection attempts reached, stopping reconnection")
            }
          }
        })
    } catch (error) {
      console.error("[v0] Error setting up notifications connection:", error)
      setConnectionStatus("disconnected")
      isConnectingRef.current = false

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          setupConnection()
        }, delay)
      }
    }
  }, [])

  useEffect(() => {
    setupConnection()

    return () => {
      isConnectingRef.current = false
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [setupConnection])

  useEffect(() => {
    const cleanup = setInterval(
      () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        setNotifications((prev) => prev.filter((notification) => notification.timestamp > oneDayAgo))
      },
      60 * 60 * 1000,
    )

    return () => clearInterval(cleanup)
  }, [])

  const addNotification = useCallback(async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    try {
      await supabaseRef.current.from("notifications").insert({
        notification_id: newNotification.id,
        type: newNotification.type,
        message: `${newNotification.title}: ${newNotification.message}`,
        is_read: false,
      })
    } catch (error) {
      console.error("[v0] Error saving notification to database:", error)
    }

    setNotifications((prev) => [newNotification, ...prev.slice(0, 99)])

    if (notification.priority === "high" || notification.type === "order") {
      try {
        const audio = new Audio("/sounds/notification.mp3")
        audio.volume = 0.3
        audio.play().catch(() => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
              tag: newNotification.id,
            })
          }
        })
      } catch (error) {
        console.log("[v0] Audio notification not available:", error)
      }
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await supabaseRef.current.from("notifications").update({ is_read: true }).eq("notification_id", id)
    } catch (error) {
      console.error("[v0] Error updating notification read status:", error)
    }

    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await supabaseRef.current.from("notifications").update({ is_read: true }).eq("is_read", false)
    } catch (error) {
      console.error("[v0] Error marking all notifications as read:", error)
    }

    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const removeNotification = useCallback(async (id: string) => {
    try {
      await supabaseRef.current.from("notifications").delete().eq("notification_id", id)
    } catch (error) {
      console.error("[v0] Error removing notification from database:", error)
    }

    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await supabaseRef.current.from("notifications").delete().neq("notification_id", "")
    } catch (error) {
      console.error("[v0] Error clearing all notifications:", error)
    }

    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        connectionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
