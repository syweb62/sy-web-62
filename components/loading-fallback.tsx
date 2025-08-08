"use client"

interface LoadingFallbackProps {
  message?: string
}

export default function LoadingFallback({ message = "Loading..." }: LoadingFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="mb-4">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-16 w-16 mx-auto"
            aria-label="Loading animation"
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-HxnXJNGysz6oO66rH7dYCdfUjUidS9.webm" type="video/webm" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-gold mx-auto"></div>
          </video>
        </div>
        <p className="text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  )
}
