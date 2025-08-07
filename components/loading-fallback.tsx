"use client"

import { Loader2 } from "lucide-react"

interface LoadingFallbackProps {
  message?: string
}

export default function LoadingFallback({ message = "Loading..." }: LoadingFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
        <p className="text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  )
}
