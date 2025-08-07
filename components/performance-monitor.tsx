"use client"

import { useEffect } from "react"
import { usePerformance } from "@/hooks/use-performance"

export function PerformanceMonitor() {
  const { measurePageLoad } = usePerformance()

  useEffect(() => {
    // Measure performance on page load
    const handleLoad = () => {
      setTimeout(() => {
        measurePageLoad()
      }, 0)
    }

    if (document.readyState === "complete") {
      handleLoad()
    } else {
      window.addEventListener("load", handleLoad)
      return () => window.removeEventListener("load", handleLoad)
    }
  }, [measurePageLoad])

  // This component doesn't render anything visible
  return null
}
