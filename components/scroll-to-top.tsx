"use client"

import { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import { useScrollManager } from "@/lib/scroll-manager"

interface ScrollToTopProps {
  className?: string
  threshold?: number
}

export function ScrollToTop({ className = "", threshold = 300 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollToTop } = useScrollManager()

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [threshold])

  const handleScrollToTop = () => {
    scrollToTop()
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={handleScrollToTop}
      className={`fixed bottom-8 left-8 z-50 p-3 bg-gold text-black rounded-full shadow-lg hover:bg-gold/90 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 py-1.5 px-3.5 ${className}`}
      aria-label="Scroll to top"
      type="button"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
