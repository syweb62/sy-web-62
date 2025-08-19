"use client"

import { useState, useCallback } from "react"
import { useCart } from "@/hooks/use-cart"
import { getBangladeshTime, formatBangladeshTime } from "@/lib/supabase"

export interface OrderItem {
  id: string
  name: string
  price: number
  image?: string
  category?: string
  description?: string
  quantity?: number
}

export interface OrderOptions {
  deliveryType?: "delivery" | "pickup"
  specialInstructions?: string
  estimatedTime?: string
}

function generateShortOrderId(): string {
  const timestamp = Date.now().toString().slice(-4) // Last 4 digits of timestamp
  const random = Math.random().toString(36).substring(2, 4).toLowerCase() // 2 random chars
  return `${timestamp}${random}` // Format like "1205e"
}

export function useOrderSystem() {
  const { addItem, items, totalItems, totalPrice } = useCart()
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const orderNow = useCallback(
    async (item: OrderItem, options?: OrderOptions) => {
      setOrderError(null)

      try {
        // Add to cart first
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity || 1,
        })

        const bangladeshTime = getBangladeshTime()
        const orderId = generateShortOrderId()

        console.log(`[v0] Order created at Bangladesh time: ${formatBangladeshTime(bangladeshTime)}`)
        console.log(`[v0] Order ID: ${orderId}`)

        setOrderSuccess(orderId)

        // Auto-clear success message
        setTimeout(() => {
          setOrderSuccess(null)
        }, 3000)

        return { success: true, orderId }
      } catch (error) {
        setOrderError("Failed to process order. Please try again.")
        setTimeout(() => {
          setOrderError(null)
        }, 5000)
        return { success: false, error }
      }
    },
    [addItem],
  )

  const quickOrder = useCallback(
    async (items: OrderItem[], options?: OrderOptions) => {
      setOrderError(null)

      try {
        // Add all items to cart
        items.forEach((item) => {
          addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity || 1,
          })
        })

        // Simulate order processing
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const bangladeshTime = getBangladeshTime()
        const orderId = generateShortOrderId()

        console.log(`[v0] Bulk order created at Bangladesh time: ${formatBangladeshTime(bangladeshTime)}`)
        console.log(`[v0] Bulk order ID: ${orderId}`)

        setOrderSuccess(orderId)

        setTimeout(() => {
          setOrderSuccess(null)
        }, 3000)

        return { success: true, orderId }
      } catch (error) {
        setOrderError("Failed to process bulk order. Please try again.")
        setTimeout(() => {
          setOrderError(null)
        }, 5000)
        return { success: false, error }
      }
    },
    [addItem],
  )

  const reorder = useCallback(
    async (previousOrderId: string) => {
      setOrderError(null)

      try {
        // In a real app, fetch previous order items from API
        // For demo, we'll simulate some items
        const previousItems: OrderItem[] = [
          {
            id: "item-1",
            name: "Sushi Platter",
            price: 24.99,
            image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
          },
          {
            id: "item-3",
            name: "Tonkotsu Ramen",
            price: 18.99,
            image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e",
          },
        ]

        await quickOrder(previousItems)
        return { success: true }
      } catch (error) {
        setOrderError("Failed to reorder. Please try again.")
        return { success: false, error }
      }
    },
    [quickOrder],
  )

  return {
    orderNow,
    quickOrder,
    reorder,
    orderSuccess,
    orderError,
    cartItems: items,
    cartTotal: totalPrice,
    cartCount: totalItems,
  }
}
