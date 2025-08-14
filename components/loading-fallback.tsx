"use client"

interface LoadingFallbackProps {
  message?: string
}

export default function LoadingFallback({ message = "Loading..." }: LoadingFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center">
        <div
          className="h-6 w-6 mx-auto mb-3 rounded-full border-2 border-gold/20 border-t-gold/60 animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        <p className="text-gray-400 text-sm opacity-80">{message}</p>
      </div>
    </div>
  )
}
