"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

// Generate a simple blur data URL
const generateBlurDataURL = (width = 10, height = 10): string => {
  if (typeof window === "undefined") {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWYyOTM3Ii8+Cjwvc3ZnPgo="
  }

  try {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#1f2937"
      ctx.fillRect(0, 0, width, height)
    }
    return canvas.toDataURL()
  } catch {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWYyOTM3Ii8+Cjwvc3ZnPgo="
  }
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = "blur",
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = "/placeholder.svg",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const retryCountRef = useRef(0)
  const maxRetries = 2

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setImageLoaded(true)
    setHasError(false)
    retryCountRef.current = 0
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)

    if (retryCountRef.current < maxRetries && currentSrc !== fallbackSrc) {
      retryCountRef.current++

      // Try fallback src first, then placeholder
      if (retryCountRef.current === 1 && fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc)
        return
      }
    }

    setHasError(true)
    onError?.()
  }, [currentSrc, fallbackSrc, onError])

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc && src !== fallbackSrc) {
      setCurrentSrc(src)
      setIsLoading(true)
      setHasError(false)
      setImageLoaded(false)
      retryCountRef.current = 0
    }
  }, [src, currentSrc, fallbackSrc])

  // Generate blur data URL if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL()

  if (hasError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-gray-800 text-gray-400", className)}
        style={fill ? undefined : { width, height }}
        role="img"
        aria-label={`Failed to load: ${alt}`}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", fill ? "w-full h-full" : "")}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse",
            className,
          )}
          style={fill ? undefined : { width, height }}
          aria-hidden="true"
        />
      )}

      <Image
        src={currentSrc || fallbackSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          imageLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        priority={priority}
        // elevate only when explicitly marked priority
        fetchPriority={priority ? "high" : undefined}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        unoptimized={false}
      />
    </div>
  )
}
