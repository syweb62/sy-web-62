"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg" | "xl"

export interface LoadingSpinnerProps {
  size?: Size
  text?: string
  className?: string
  videoClassName?: string
  textClassName?: string
  showText?: boolean
}

/**
 * Sushi Loading Spinner
 * - Uses /publichttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-7EnDgi4AZlDTFOrpwt6HOp3oC83HAn.webm
 * - Mobile-friendly autoplay via muted + playsInline
 * - Graceful CSS spinner fallback
 */
export function LoadingSpinner({
  size = "md",
  text,
  className,
  videoClassName,
  textClassName,
  showText = true,
}: LoadingSpinnerProps) {
  const [canPlay, setCanPlay] = React.useState(true)

  const px = React.useMemo(() => {
    switch (size) {
      case "sm":
        return 64
      case "lg":
        return 128
      case "xl":
        return 160
      case "md":
      default:
        return 96
    }
  }, [size])

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 text-white", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Video loader with graceful fallback */}
      <div className="relative" style={{ width: px, height: px }}>
        {canPlay ? (
          <video
            className={cn("w-full h-full rounded-full object-contain", videoClassName)}
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-7EnDgi4AZlDTFOrpwt6HOp3oC83HAn.webm"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setCanPlay(false)}
          />
        ) : (
          <div
            className="w-full h-full rounded-full border-4 border-white/20 border-t-transparent animate-spin"
            aria-label="Loading"
          />
        )}
      </div>

      {showText && (text || "Loading...") && (
        <p className={cn("text-sm text-gray-300", textClassName)}>{text || "Loading..."}</p>
      )}

      <span className="sr-only">Loading</span>
    </div>
  )
}

export default LoadingSpinner
