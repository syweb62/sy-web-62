"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface LazySectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  once?: boolean
}

export function LazySection({
  children,
  className,
  threshold = 0.1,
  rootMargin = "50px",
  fallback,
  once = true,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            setHasBeenVisible(true)
            observer.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  const shouldRender = once ? hasBeenVisible || isVisible : isVisible

  return (
    <div ref={ref} className={cn(className)}>
      {shouldRender ? children : fallback || <div className="h-96 bg-gray-800/20 animate-pulse" />}
    </div>
  )
}
