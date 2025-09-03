"use client"

import { useCallback } from "react"
import { useNotifications } from "@/context/notification-context"

export function useNotificationSystem() {
  const { addNotification } = useNotifications()

  const notifyOrderStatusChange = useCallback(
    (orderId: string, status: string, customerName: string) => {
      const statusMessages = {
        pending: "New order received",
        confirmed: "Order confirmed",
        preparing: "Order is being prepared",
        ready: "Order is ready for pickup",
        delivered: "Order delivered",
        cancelled: "Order cancelled",
        completed: "Order completed",
      }

      const message = statusMessages[status as keyof typeof statusMessages] || "Order status updated"
      const priority = status === "pending" ? "high" : "medium"

      addNotification({
        type: "order",
        title: message,
        message: `Order #${orderId} for ${customerName}`,
        priority: priority as "low" | "medium" | "high",
        data: { orderId, status, customerName },
      })
    },
    [addNotification],
  )

  const notifyReservationChange = useCallback(
    (reservationId: string, status: string, customerName: string) => {
      const statusMessages = {
        confirmed: "Reservation confirmed",
        cancelled: "Reservation cancelled",
        completed: "Reservation completed",
        pending: "New reservation received",
      }

      const message = statusMessages[status as keyof typeof statusMessages] || "Reservation status updated"

      addNotification({
        type: "reservation",
        title: message,
        message: `Reservation #${reservationId} for ${customerName}`,
        priority: "medium",
        data: { reservationId, status, customerName },
      })
    },
    [addNotification],
  )

  const notifyMenuChange = useCallback(
    (itemName: string, action: string) => {
      const actionMessages = {
        created: "New menu item added",
        updated: "Menu item updated",
        deleted: "Menu item removed",
        availability_changed: "Menu item availability changed",
      }

      const message = actionMessages[action as keyof typeof actionMessages] || "Menu item changed"

      addNotification({
        type: "menu",
        title: message,
        message: `${itemName}`,
        priority: "low",
        data: { itemName, action },
      })
    },
    [addNotification],
  )

  const notifySystemEvent = useCallback(
    (title: string, message: string, priority: "low" | "medium" | "high" = "medium") => {
      addNotification({
        type: "system",
        title,
        message,
        priority,
      })
    },
    [addNotification],
  )

  return {
    notifyOrderStatusChange,
    notifyReservationChange,
    notifyMenuChange,
    notifySystemEvent,
  }
}
