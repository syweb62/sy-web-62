"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16", 
    lg: "h-24 w-24",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={cn("mx-auto", sizeClasses[size])}
        role="status"
        aria-label="Loading"
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-HxnXJNGysz6oO66rH7dYCdfUjUidS9.webm" type="video/webm" />
        <div
          className={cn("animate-spin rounded-full border-2 border-gray-600 border-t-gold", sizeClasses[size])}
          role="status"
          aria-label="Loading"
        />
      </video>
      {text && (
        <p className="text-sm text-gray-400" aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default LoadingSpinner
