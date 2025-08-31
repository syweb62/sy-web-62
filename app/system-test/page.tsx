"use client"

import { SystemTest } from "@/components/system-test"

export default function SystemTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management System Test Suite</h1>
          <p className="text-gray-600">Comprehensive testing of all system components and flows</p>
        </div>

        <SystemTest />
      </div>
    </div>
  )
}
