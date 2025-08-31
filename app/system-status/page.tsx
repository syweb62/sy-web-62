"use client"

import { SystemStatus } from "@/components/system-status"

export default function SystemStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Management System Status</h1>
          <p className="text-gray-600 text-lg">Complete system verification and readiness report</p>
        </div>

        <SystemStatus />
      </div>
    </div>
  )
}
