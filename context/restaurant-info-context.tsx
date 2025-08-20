"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface RestaurantInfo {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
  currency: string
  timezone: string
  vatRate: number
  deliveryCharge: number
}

interface RestaurantInfoContextType {
  restaurantInfo: RestaurantInfo
  updateRestaurantInfo: (info: Partial<RestaurantInfo>) => void
}

const defaultRestaurantInfo: RestaurantInfo = {
  name: "Sushi Yaki",
  address: "Sushi Yaki, Mohammadpur, Dhaka",
  phone: "+880 1234 567890",
  email: "info@sushiyakiresto.com",
  currency: "Tk.",
  timezone: "Asia/Dhaka",
  vatRate: 0.05, // 5% VAT
  deliveryCharge: 50,
}

const RestaurantInfoContext = createContext<RestaurantInfoContextType | undefined>(undefined)

export function RestaurantInfoProvider({ children }: { children: React.ReactNode }) {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(defaultRestaurantInfo)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("restaurant-info")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setRestaurantInfo({ ...defaultRestaurantInfo, ...parsed })
      } catch (error) {
        console.error("Failed to parse restaurant info from localStorage")
      }
    }
  }, [])

  const updateRestaurantInfo = (info: Partial<RestaurantInfo>) => {
    const updated = { ...restaurantInfo, ...info }
    setRestaurantInfo(updated)
    localStorage.setItem("restaurant-info", JSON.stringify(updated))
  }

  return (
    <RestaurantInfoContext.Provider
      value={{
        restaurantInfo,
        updateRestaurantInfo,
      }}
    >
      {children}
    </RestaurantInfoContext.Provider>
  )
}

export function useRestaurantInfo() {
  const context = useContext(RestaurantInfoContext)
  if (context === undefined) {
    throw new Error("useRestaurantInfo must be used within a RestaurantInfoProvider")
  }
  return context
}
