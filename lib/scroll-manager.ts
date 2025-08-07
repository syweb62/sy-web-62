"use client"

interface ScrollPosition {
  x: number
  y: number
  timestamp: number
}

class ScrollManager {
  private static instance: ScrollManager
  private scrollPositions = new Map<string, ScrollPosition>()
  private currentPath = ""
  private isNavigating = false
  private scrollListeners = new Set<() => void>()
  private throttleTimer: NodeJS.Timeout | null = null

  private constructor() {
    if (typeof window !== "undefined") {
      this.currentPath = window.location.pathname
      this.setupScrollListener()
    }
  }

  static getInstance(): ScrollManager {
    if (!ScrollManager.instance) {
      ScrollManager.instance = new ScrollManager()
    }
    return ScrollManager.instance
  }

  private setupScrollListener() {
    if (typeof window === "undefined") return

    const handleScroll = () => {
      if (this.isNavigating) return

      // Throttle scroll position updates for performance
      if (this.throttleTimer) {
        clearTimeout(this.throttleTimer)
      }

      this.throttleTimer = setTimeout(() => {
        this.saveCurrentScrollPosition()
      }, 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    // Save scroll position before page unload
    window.addEventListener("beforeunload", () => {
      this.saveCurrentScrollPosition()
    })
  }

  private saveCurrentScrollPosition() {
    if (typeof window === "undefined" || this.isNavigating) return

    const position: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now(),
    }

    this.scrollPositions.set(this.currentPath, position)
  }

  public handleNavigation(newPath: string, scrollToTop = true) {
    if (typeof window === "undefined") return

    // Save current scroll position before navigation
    this.saveCurrentScrollPosition()

    // Set navigation state
    this.isNavigating = true
    this.currentPath = newPath

    if (scrollToTop) {
      // Immediately scroll to top for new page navigation
      this.scrollToTop(false)

      // Also scroll to top after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.scrollToTop(false)
        this.isNavigating = false
      }, 50)
    } else {
      // Reset navigation state
      setTimeout(() => {
        this.isNavigating = false
      }, 100)
    }
  }

  public scrollToTop(smooth = false) {
    if (typeof window === "undefined") return

    const behavior = smooth ? "smooth" : "instant"

    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: behavior as ScrollBehavior,
      })
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0)
    }
  }

  public scrollToElement(elementId: string, offset = 0, smooth = true) {
    if (typeof window === "undefined") return

    const element = document.getElementById(elementId)
    if (!element) return

    const elementTop = element.offsetTop - offset
    const behavior = smooth ? "smooth" : "instant"

    try {
      window.scrollTo({
        top: elementTop,
        left: 0,
        behavior: behavior as ScrollBehavior,
      })
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, elementTop)
    }
  }

  public getCurrentPath(): string {
    return this.currentPath
  }

  public isCurrentlyNavigating(): boolean {
    return this.isNavigating
  }

  public getScrollPosition(path: string): ScrollPosition | undefined {
    return this.scrollPositions.get(path)
  }

  public clearScrollPosition(path: string) {
    this.scrollPositions.delete(path)
  }

  public clearAllScrollPositions() {
    this.scrollPositions.clear()
  }

  // Clean up method
  public destroy() {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
    }
    this.scrollPositions.clear()
    this.scrollListeners.clear()
  }
}

// Export hook for React components
export function useScrollManager() {
  return ScrollManager.getInstance()
}

// Export singleton instance
export const scrollManager = ScrollManager.getInstance()
