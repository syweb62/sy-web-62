"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReservationsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/book")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to booking page...</p>
      </div>
    </div>
  )
}
