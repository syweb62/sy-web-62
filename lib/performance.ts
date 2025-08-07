// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  return async () => {
    const start = performance.now()
    try {
      await fn()
    } finally {
      const end = performance.now()
      console.log(`${name} took ${end - start} milliseconds`)

      // In production, send to analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "timing_complete", {
          name,
          value: Math.round(end - start),
        })
      }
    }
  }
}

// Image optimization utilities
export function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#1f2937")
    gradient.addColorStop(1, "#374151")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  return canvas.toDataURL()
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  })
}
