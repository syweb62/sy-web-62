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
 * - Enhanced visual appeal with better sizing options
 */
export function LoadingSpinner({ size = "md", text, className, textClassName, showText = true }: LoadingSpinnerProps) {
  const px = React.useMemo(() => {
    switch (size) {
      case "sm":
        return 16
      case "lg":
        return 32
      case "xl":
        return 48 // Increased xl size for better visibility
      case "md":
      default:
        return 24
    }
  }, [size])

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)} // Increased gap for better spacing
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="rounded-full border-2 border-gray-300/20 border-t-gold/70 animate-spin shadow-sm" // Enhanced with gold accent and shadow
        style={{
          width: px,
          height: px,
          animationDuration: "1.2s", // Slightly slower for smoother appearance
        }}
        aria-label="Loading"
      />

      {showText && (text || "Loading...") && (
        <p className={cn("text-sm text-gray-500 opacity-80 font-medium", textClassName)}>{text || "Loading..."}</p> // Enhanced typography
      )}

      <span className="sr-only">Loading</span>
    </div>
  )
}

export default LoadingSpinner
