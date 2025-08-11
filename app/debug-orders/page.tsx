"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugOrdersPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testOrdersAPI = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Testing orders API...")
      const response = await fetch("/api/orders")
      const data = await response.json()

      console.log("API Response:", data)

      setDebugInfo({
        status: response.status,
        ok: response.ok,
        data: data,
        ordersCount: data.orders?.length || 0,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Error testing API:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Testing Supabase connection...")
      const response = await fetch("/api/test-supabase-orders")
      const data = await response.json()

      console.log("Supabase Test Response:", data)

      setDebugInfo({
        ...debugInfo,
        supabaseTest: data,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Error testing Supabase:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Orders Debug Page</h1>

      <div className="space-y-4 mb-6">
        <Button onClick={testOrdersAPI} disabled={loading}>
          {loading ? "Testing..." : "Test Orders API"}
        </Button>

        <Button onClick={testSupabaseConnection} disabled={loading} variant="outline">
          {loading ? "Testing..." : "Test Supabase Direct"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
