"use client"

import { useEffect, useCallback } from "react"

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
}

export function usePerformance() {
  const reportMetric = useCallback((metric: PerformanceMetrics) => {
    // In production, send to analytics service
    if (process.env.NODE_ENV === "production") {
      console.log("Performance metric:", metric)
      // Example: analytics.track('performance', metric)
    }
  }, [])

  useEffect(() => {
    // Measure Core Web Vitals
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            reportMetric({ fcp: entry.startTime })
          }
        }
      })
      fcpObserver.observe({ entryTypes: ["paint"] })

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        reportMetric({ lcp: lastEntry.startTime })
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          reportMetric({ fid: (entry as any).processingStart - entry.startTime })
        }
      })
      fidObserver.observe({ entryTypes: ["first-input"] })

      // Cumulative Layout Shift
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
