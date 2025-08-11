"use client"

import { useEffect, useCallback } from "react"
import { getClientEnv } from "@/lib/env-utils"

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
}

export function usePerformance() {
  const reportMetric = useCallback((metric: PerformanceMetrics) => {
    const { isProd } = getClientEnv()
    if (isProd) {
      console.log("Performance metric:", metric)
      // Example: analytics.track('performance', metric)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            reportMetric({ fcp: entry.startTime })
          }
        }
      })
      fcpObserver.observe({ entryTypes: ["paint"] })

      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        reportMetric({ lcp: lastEntry.startTime })
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          reportMetric({ fid: (entry as any).processingStart - entry.startTime })
        }
      })
      fidObserver.observe({ entryTypes: ["first-input"] })

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        reportMetric({ cls: clsValue })
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })

      return () => {
        fcpObserver.disconnect()
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [reportMetric])

  const measurePageLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.performance) {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalPageLoad: navigation.loadEventEnd - navigation.fetchStart,
      }

      console.log("Page load metrics:", metrics)
      return metrics
    }
  }, [])

  return { measurePageLoad }
}
