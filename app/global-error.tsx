"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { getClientEnv } from "@/lib/env-utils"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error)
  }, [error])

  const { isDev } = getClientEnv()

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong!</h1>
              <p className="text-gray-300 mb-4">A critical error occurred. Please try refreshing the page.</p>
              {isDev && error.digest && <p className="text-xs text-gray-500 mb-4">Error ID: {error.digest}</p>}
            </div>

            <div className="space-y-3">
              <Button onClick={reset} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium">
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
      </body>
    </html>
  )
}
