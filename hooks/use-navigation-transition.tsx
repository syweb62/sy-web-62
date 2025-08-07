"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useScrollManager } from "@/lib/scroll-manager"

export function useNavigationTransition() {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scrollManager = useScrollManager()

  // Handle route changes
  useEffect(() => {
    // Navigation completed, ensure we're at the top
    scrollManager.handleNavigation(pathname, true)
    setIsNavigating(false)

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollManager.scrollToTop(false)
    }, 50)

    return () => clearTimeout(timer)
  }, [pathname, searchParams, scrollManager])

  // Start navigation transition
  const startNavigation = useCallback(() => {
    setIsNavigating(true)

    // Use global navigation indicator if available
    if (typeof window !== "undefined" && (window as any).startNavigation) {
      return (window as any).startNavigation()
    }

    return () => setIsNavigating(false)
  }, [])

  // Handle programmatic navigation
  const navigateToTop = useCallback(() => {
    scrollManager.scrollToTop(true)
  }, [scrollManager])

  // Handle navigation with scroll to top
  const handleNavigationWithScrollReset = useCallback(
    (path: string) => {
      setIsNavigating(true)
      scrollManager.handleNavigation(path, true)
    },
    [scrollManager],
  )

  return {
    isNavigating,
    startNavigation,
    navigateToTop,
    handleNavigationWithScrollReset,
    currentPath: scrollManager.getCurrentPath(),
  }
}
