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
    <div className="fixed inset-0 bg-darkBg/90 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300">
      <div className="text-center">
        <div className="mb-4">
          <Image
            src="/images/logo.png"
            alt="Sushi Yaki"
            width={150}
            height={90}
            className="h-auto w-auto max-w-[150px] animate-pulse"
            priority
          />
        </div>
        <div className="text-[#30c8d6] text-lg flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[#30c8d6]/30 border-t-[#30c8d6] rounded-full animate-spin"></span>
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
