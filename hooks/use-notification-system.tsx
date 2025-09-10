"use client"

import { useCallback } from "react"
import { useNotifications } from "@/context/notification-context"

export function useNotificationSystem() {
  const { addNotification } = useNotifications()

  const notifyOrderStatusChange = useCallback(
    (orderId: string, status: string, customerName: string) => {
      const statusMessages = {
        pending: "🔔 New Order Received!",
        confirmed: "✅ Order Confirmed",
        preparing: "👨‍🍳 Order Being Prepared",
        ready: "🍱 Order Ready for Pickup",
        delivered: "🚚 Order Delivered",
        cancelled: "❌ Order Cancelled",
        completed: "✨ Order Completed",
      }

      const message = statusMessages[status as keyof typeof statusMessages] || "Order status updated"
      const priority = status === "pending" ? "high" : "medium"

      const shortOrderId = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase()

      addNotification({
        type: "order",
        title: message,
        message: `Order #${shortOrderId} • ${customerName}`,
        priority: priority as "low" | "medium" | "high",
        data: { orderId, shortOrderId, status, customerName },
      })

      console.log("[v0] Order notification triggered:", { orderId: shortOrderId, status, customerName })
    },
    [addNotification],
  )

  const notifyNewOrder = useCallback(
    (order: { order_id: string; short_order_id?: string; customer_name: string; total_amount: number }) => {
      const shortOrderId = order.short_order_id || order.order_id.slice(-8).toUpperCase()

      addNotification({
        type: "order",
        title: "🔔 New Order Received!",
        message: `Order #${shortOrderId} • ${order.customer_name} • Tk${order.total_amount.toFixed(2)}`,
        priority: "high",
        data: {
          orderId: order.order_id,
          shortOrderId,
          customerName: order.customer_name,
          totalAmount: order.total_amount,
          status: "pending",
        },
      })

      console.log("[v0] New order notification:", {
        shortOrderId,
        customer: order.customer_name,
        amount: order.total_amount,
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
    notifyNewOrder,
    notifyReservationChange,
    notifyMenuChange,
    notifySystemEvent,
  }
}
