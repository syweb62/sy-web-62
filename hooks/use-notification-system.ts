"use client"
import { useNotifications } from "@/context/notification-context"

export function useNotificationSystem() {
  const { addNotification } = useNotifications()

  // Order status change notifications
  const notifyOrderStatusChange = (orderId: string, status: string, customerName?: string) => {
    const statusMessages = {
      pending: "New order received",
      preparing: "Order is being prepared",
      ready: "Order is ready for pickup/delivery",
      completed: "Order has been completed",
      cancelled: "Order has been cancelled",
    }

    addNotification({
      type: "order",
      title: statusMessages[status as keyof typeof statusMessages] || "Order status updated",
      message: `Order ${orderId}${customerName ? ` for ${customerName}` : ""} is now ${status}`,
      priority: status === "pending" ? "high" : "medium",
      data: { orderId, status, customerName },
    })
  }

  // Reservation notifications
  const notifyReservation = (
    type: "new" | "updated" | "cancelled",
    reservationId: string,
    customerName: string,
    time: string,
  ) => {
    const messages = {
      new: "New reservation received",
      updated: "Reservation has been updated",
      cancelled: "Reservation has been cancelled",
    }

    addNotification({
      type: "reservation",
      title: messages[type],
      message: `Reservation ${reservationId} for ${customerName} at ${time}`,
      priority: type === "new" ? "high" : "medium",
      data: { reservationId, customerName, time },
    })
  }

  // System notifications
  const notifySystem = (title: string, message: string, priority: "low" | "medium" | "high" = "medium") => {
    addNotification({
      type: "system",
      title,
      message,
      priority,
    })
  }

  return {
    notifyOrderStatusChange,
    notifyReservation,
    notifySystem,
  }
}
