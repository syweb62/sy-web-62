"use client"

import { SystemTest } from "@/components/testing/system-test"

export default function TestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white">System Test</h1>
        <p className="text-gray-400 mt-1">Comprehensive testing of all dashboard functionality and integrations</p>
      </div>

      <SystemTest />
    </div>
  )
}
