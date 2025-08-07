"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface CSRFContextType {
  token: string | null
  refreshToken: () => Promise<void>
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined)

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/csrf-token")
      const data = await response.json()
      setToken(data.token)
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error)
    }
  }

  useEffect(() => {
    refreshToken()
  }, [])

  return <CSRFContext.Provider value={{ token, refreshToken }}>{children}</CSRFContext.Provider>
}

export function useCSRF() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error("useCSRF must be used within CSRFProvider")
  }
  return context
}
