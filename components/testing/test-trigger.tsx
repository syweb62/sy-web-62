"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TestDashboard } from "./test-dashboard"
import { BarChart3 } from "lucide-react"

export function TestTrigger() {
  const [showDashboard, setShowDashboard] = useState(false)

  // Only show in development or when explicitly enabled
  const shouldShow =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.search.includes("testing=true"))

  if (!shouldShow) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDashboard(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Testing
        </Button>
      </div>

      {showDashboard && <TestDashboard isVisible={showDashboard} />}

      {showDashboard && <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={() => setShowDashboard(false)} />}
    </>
  )
}
