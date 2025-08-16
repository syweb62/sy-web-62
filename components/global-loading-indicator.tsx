"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"

export function GlobalLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Reset loading state when route changes
    setIsLoading(false)
  }, [pathname, searchParams])

  // Expose a global method to trigger loading state
  useEffect(() => {
    // Create a global navigation state manager
    window.startNavigation = () => {
      setIsLoading(true)
      return () => setIsLoading(false)
    }

    return () => {
      // Clean up
      delete window.startNavigation
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-darkBg/80 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-500">
      <div className="text-center">
        <div className="mb-3">
          <Image
            src="/images/sushiyaki-logo.png"
            alt="Sushi Yaki"
            width={120}
            height={120}
            className="h-auto w-auto max-w-[120px] opacity-90"
            priority
          />
        </div>
        <div className="text-[#30c8d6] text-sm flex items-center justify-center gap-2 opacity-80">
          <span
            className="w-3 h-3 border border-[#30c8d6]/30 border-t-[#30c8d6]/70 rounded-full animate-spin"
            style={{ animationDuration: "1.8s" }}
          ></span>
          <span>Loading...</span>
        </div>
      </div>
    </div>
  )
}

// Add TypeScript global type definition
declare global {
  interface Window {
    startNavigation?: () => () => void
  }
}
