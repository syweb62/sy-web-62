"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ReservationsPage() {
  const router = useRouter()
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true)
    }, 2000)

    // Auto-redirect after short delay
    const redirectTimer = setTimeout(() => {
      router.replace("/book")
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(redirectTimer)
    }
  }, [router])

  const handleManualRedirect = () => {
    router.replace("/book")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-gray-400 mb-4">Redirecting to booking page...</p>

        {showButton && (
          <button
            onClick={handleManualRedirect}
            className="px-6 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition-colors"
          >
            Continue to Booking
          </button>
        )}
      </div>
    </div>
  )
}
