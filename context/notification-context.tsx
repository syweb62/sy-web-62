"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef } from "react"

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
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3")
      audioRef.current.preload = "auto"
      audioRef.current.volume = 0.7
    }
  }, [])

  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled) return

    try {
      initializeAudio()
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        console.log("[v0] Notification sound played successfully")
      }
    } catch (error) {
      console.log("[v0] Could not play notification sound:", error)
    }
  }, [soundEnabled, initializeAudio])

  const addNotification = useCallback(
    async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      }

      console.log("[v0] Adding notification:", newNotification.title, newNotification.message)
      setNotifications((prev) => [newNotification, ...prev.slice(0, 99)])

      if (notification.priority === "high" || notification.type === "order") {
        await playNotificationSound()
      }

      if (notification.priority === "high" || notification.type === "order") {
        try {
          if ("Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/favicon.ico",
                tag: newNotification.id,
                badge: "/favicon.ico",
                requireInteraction: notification.type === "order", // Keep order notifications visible longer
              })
            } else if (Notification.permission === "default") {
              const permission = await Notification.requestPermission()
              if (permission === "granted") {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: "/favicon.ico",
                  tag: newNotification.id,
                  badge: "/favicon.ico",
                  requireInteraction: notification.type === "order",
                })
              }
            }
          }
        } catch (error) {
          console.log("[v0] Browser notification not available:", error)
        }
      }
    },
    [playNotificationSound],
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
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
        soundEnabled,
        setSoundEnabled,
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
