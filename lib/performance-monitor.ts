// Enhanced performance monitoring for cross-browser testing
export interface PerformanceData {
  timestamp: string
  url: string
  userAgent: string
  metrics: {
    // Core Web Vitals
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift

    // Other important metrics
    fcp?: number // First Contentful Paint
    ttfb?: number // Time to First Byte
    tti?: number // Time to Interactive
    tbt?: number // Total Blocking Time

    // Custom metrics
    loadTime: number
    domContentLoaded: number
    resourceLoadTime: number

    // Memory usage (if available)
    memoryUsage?: {
      used: number
      total: number
    }
  }
  resources: {
    images: number
    scripts: number
    stylesheets: number
    fonts: number
    other: number
  }
  errors: string[]
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private data: PerformanceData[] = []
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  init() {
    if (typeof window === "undefined") return

    // Set up performance observers
    this.setupLCPObserver()
    this.setupFIDObserver()
    this.setupCLSObserver()
    this.setupResourceObserver()
    this.setupErrorTracking()

    // Collect initial metrics when page loads
    if (document.readyState === "complete") {
      this.collectMetrics()
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => this.collectMetrics(), 1000)
      })
    }
  }

  private setupLCPObserver() {
    if (!("PerformanceObserver" in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.updateMetric("lcp", lastEntry.startTime)
      })
      observer.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("LCP observer not supported")
    }
  }

  private setupFIDObserver() {
    if (!("PerformanceObserver" in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.updateMetric("fid", entry.processingStart - entry.startTime)
        })
      })
      observer.observe({ entryTypes: ["first-input"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("FID observer not supported")
    }
  }

  private setupCLSObserver() {
    if (!("PerformanceObserver" in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.updateMetric("cls", clsValue)
          }
        })
      })
      observer.observe({ entryTypes: ["layout-shift"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("CLS observer not supported")
    }
  }

  private setupResourceObserver() {
    if (!("PerformanceObserver" in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        // Resource timing data is collected in collectMetrics
      })
      observer.observe({ entryTypes: ["resource"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("Resource observer not supported")
    }
  }

  private setupErrorTracking() {
    const errors: string[] = []

    window.addEventListener("error", (event) => {
      errors.push(`JavaScript Error: ${event.message} at ${event.filename}:${event.lineno}`)
    })

    window.addEventListener("unhandledrejection", (event) => {
      errors.push(`Unhandled Promise Rejection: ${event.reason}`)
    })

    // Store errors reference for later use
    ;(window as any).__performanceErrors = errors
  }

  private updateMetric(metric: string, value: number) {
    const currentData = this.data[this.data.length - 1]
    if (currentData) {
      ;(currentData.metrics as any)[metric] = value
    }
  }

  private collectMetrics() {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType("paint")
    const resources = performance.getEntriesByType("resource")

    // Calculate paint metrics
    let fcp = 0
    paint.forEach((entry) => {
      if (entry.name === "first-contentful-paint") {
        fcp = entry.startTime
      }
    })

    // Calculate resource counts
    const resourceCounts = {
      images: 0,
      scripts: 0,
      stylesheets: 0,
      fonts: 0,
      other: 0,
    }

    resources.forEach((resource: any) => {
      switch (resource.initiatorType) {
        case "img":
          resourceCounts.images++
          break
        case "script":
          resourceCounts.scripts++
          break
        case "link":
          if (resource.name.includes(".css")) {
            resourceCounts.stylesheets++
          } else if (resource.name.includes("font")) {
            resourceCounts.fonts++
          } else {
            resourceCounts.other++
          }
          break
        default:
          resourceCounts.other++
      }
    })

    // Get memory usage if available
    let memoryUsage
    if ("memory" in performance) {
      const memory = (performance as any).memory
      memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      }
    }

    // Get errors
    const errors = (window as any).__performanceErrors || []

    const data: PerformanceData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {
        fcp,
        ttfb: navigation.responseStart - navigation.requestStart,
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        resourceLoadTime: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
        tti: navigation.domInteractive - navigation.navigationStart,
        memoryUsage,
      },
      resources: resourceCounts,
      errors: [...errors],
    }

    this.data.push(data)
  }

  getLatestData(): PerformanceData | null {
    return this.data[this.data.length - 1] || null
  }

  getAllData(): PerformanceData[] {
    return this.data
  }

  exportData(): string {
    return JSON.stringify(this.data, null, 2)
  }

  clearData() {
    this.data = []
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
