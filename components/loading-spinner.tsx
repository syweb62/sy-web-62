"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg" | "xl"

export interface LoadingSpinnerProps {
  size?: Size
  text?: string
  className?: string
  textClassName?: string
  showText?: boolean
}

/**
 * Minimal Loading Spinner
 * - Clean CSS-only spinner animation
 * - Subtle and non-distracting
 * - Accessible with proper ARIA labels
 */
export function LoadingSpinner({ size = "md", text, className, textClassName, showText = true }: LoadingSpinnerProps) {
  const px = React.useMemo(() => {
    switch (size) {
      case "sm":
        return 16
      case "lg":
        return 32
      case "xl":
        return 40
      case "md":
      default:
        return 24
    }
  }, [size])

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="rounded-full border-2 border-gray-300/20 border-t-gray-600/60 animate-spin"
        style={{
          width: px,
          height: px,
          animationDuration: "1s",
        }}
        aria-label="Loading"
      />

      {showText && (text || "Loading...") && (
        <p className={cn("text-xs text-gray-500 opacity-70", textClassName)}>{text || "Loading..."}</p>
      )}

      <span className="sr-only">Loading</span>
    </div>
  )
}

export default LoadingSpinner
