"use client"

import type React from "react"
import { useState, useCallback } from "react"
import Image from "next/image"
import { User } from "lucide-react"

interface ImageFallbackProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackIcon?: React.ReactNode
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  loading?: "lazy" | "eager"
}

export function ImageFallback({
  src,
  alt,
  width = 100,
  height = 100,
  className = "",
  fallbackIcon,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  loading = "lazy",
}: ImageFallbackProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageError = useCallback(() => {
    setImageError(true)
    setIsLoading(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  // If no src provided or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-700 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || <User size={Math.min(width, height) * 0.6} aria-hidden="true" />}
      </div>
    )
  }

  const imageProps = {
    src: src || "/placeholder.svg",
    alt,
    className: `object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${className}`,
    onLoad: handleImageLoad,
    onError: handleImageError,
    priority,
    quality,
    loading: priority ? "eager" : loading,
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
  }

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`} style={fill ? undefined : { width, height }}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-400 animate-pulse"
          style={fill ? undefined : { width, height }}
          aria-hidden="true"
        >
          <User size={Math.min(width, height) * 0.6} />
        </div>
      )}
      <Image {...imageProps} />
    </div>
  )
}

// Add default export to fix the import error
export default ImageFallback
