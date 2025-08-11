"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { getClientEnv } from "@/lib/env-utils"

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { isDev } = getClientEnv()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-300 mb-4">We apologize for the inconvenience. An unexpected error occurred.</p>
          {error && isDev && (
            <details className="text-left bg-gray-800 p-4 rounded-lg mb-4">
              <summary className="cursor-pointer text-sm text-gray-400 mb-2">Error Details (Development)</summary>
              <pre className="text-xs text-red-400 whitespace-pre-wrap break-words">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={resetError} className="w-full bg-gold hover:bg-gold/90 text-black font-medium">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
