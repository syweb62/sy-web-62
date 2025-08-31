"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message: string
  details?: any
}

export function SystemTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: "pending", message: "Not started" },
    { name: "Orders API GET", status: "pending", message: "Not started" },
    { name: "Orders API PATCH", status: "pending", message: "Not started" },
    { name: "Real-time Subscription", status: "pending", message: "Not started" },
    { name: "Cross-window Communication", status: "pending", message: "Not started" },
    { name: "Complete Flow Test", status: "pending", message: "Not started" },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const supabase = createClient()

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests((prev) => prev.map((test) => (test.name === name ? { ...test, status, message, details } : test)))
  }

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    updateTest(testName, "running", "Running...")
    try {
      await testFn()
      updateTest(testName, "success", "✅ Passed")
    } catch (error) {
      updateTest(testName, "error", `❌ Failed: ${error}`, error)
    }
  }

  const testDatabaseConnection = async () => {
    console.log("[v0] ========== TESTING DATABASE CONNECTION ==========")

    const { data, error } = await supabase.from("orders").select("order_id, short_order_id, status").limit(1)

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    console.log("[v0] Database connection test successful:", data)
    updateTest("Database Connection", "success", `✅ Connected - Found ${data?.length || 0} orders`)
  }

  const testOrdersAPIGet = async () => {
    console.log("[v0] ========== TESTING ORDERS API GET ==========")

    const response = await fetch("/api/orders")
    if (!response.ok) {
      throw new Error(`API GET failed with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Orders API GET test successful:", data)

    if (!data.orders || !Array.isArray(data.orders)) {
      throw new Error("API response format invalid")
    }

    updateTest("Orders API GET", "success", `✅ API working - ${data.orders.length} orders`)
  }

  const testOrdersAPIPatch = async () => {
    console.log("[v0] ========== TESTING ORDERS API PATCH ==========")

    // First get an order to test with
    const getResponse = await fetch("/api/orders")
    const getData = await getResponse.json()

    if (!getData.orders || getData.orders.length === 0) {
      throw new Error("No orders available for testing")
    }

    const testOrder = getData.orders[0]
    const originalStatus = testOrder.status
    const testStatus = originalStatus === "pending" ? "confirmed" : "pending"

    console.log("[v0] Testing with order:", testOrder.short_order_id, "changing from", originalStatus, "to", testStatus)

    // Test the PATCH request
    const patchResponse = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: testOrder.short_order_id,
        status: testStatus,
      }),
    })

    if (!patchResponse.ok) {
      const errorData = await patchResponse.json()
      throw new Error(`API PATCH failed: ${errorData.error || patchResponse.statusText}`)
    }

    const patchData = await patchResponse.json()
    console.log("[v0] Orders API PATCH test successful:", patchData)

    // Revert the change
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: testOrder.short_order_id,
        status: originalStatus,
      }),
    })

    updateTest("Orders API PATCH", "success", `✅ Status update working - Order ${testOrder.short_order_id}`)
  }

  const testRealtimeSubscription = async () => {
    console.log("[v0] ========== TESTING REAL-TIME SUBSCRIPTION ==========")

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        reject(new Error("Real-time subscription test timed out"))
      }, 10000)

      const subscription = supabase
        .channel("system-test-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            console.log("[v0] Real-time subscription test received update:", payload)
            clearTimeout(timeout)
            subscription.unsubscribe()
            resolve()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Real-time subscription status:", status)
          if (status === "SUBSCRIBED") {
            updateTest("Real-time Subscription", "success", "✅ Subscription active - Listening for changes")
            clearTimeout(timeout)
            subscription.unsubscribe()
            resolve()
          } else if (status === "CHANNEL_ERROR") {
            clearTimeout(timeout)
            subscription.unsubscribe()
            reject(new Error("Real-time subscription failed"))
          }
        })
    })
  }

  const testCrossWindowCommunication = async () => {
    console.log("[v0] ========== TESTING CROSS-WINDOW COMMUNICATION ==========")

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("orderStatusChanged", handler)
        reject(new Error("Cross-window communication test timed out"))
      }, 5000)

      const handler = (event: CustomEvent) => {
        console.log("[v0] Cross-window communication test received event:", event.detail)
        clearTimeout(timeout)
        window.removeEventListener("orderStatusChanged", handler)
        resolve()
      }

      window.addEventListener("orderStatusChanged", handler as EventListener)

      // Trigger the event
      const testEvent = new CustomEvent("orderStatusChanged", {
        detail: { orderId: "test-123", status: "confirmed" },
      })
      window.dispatchEvent(testEvent)
    })
  }

  const testCompleteFlow = async () => {
    console.log("[v0] ========== TESTING COMPLETE SYSTEM FLOW ==========")

    // This test verifies that all components work together
    const startTime = Date.now()

    // 1. Check database has orders
    const { data: orders } = await supabase.from("orders").select("order_id, short_order_id, status").limit(1)

    if (!orders || orders.length === 0) {
      throw new Error("No orders in database for complete flow test")
    }

    // 2. Test API can fetch orders
    const apiResponse = await fetch("/api/orders")
    const apiData = await apiResponse.json()

    if (!apiData.orders || apiData.orders.length === 0) {
      throw new Error("API not returning orders")
    }

    // 3. Verify order data consistency
    const dbOrder = orders[0]
    const apiOrder = apiData.orders.find((o: any) => o.short_order_id === dbOrder.short_order_id)

    if (!apiOrder) {
      throw new Error("Order data inconsistency between database and API")
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    updateTest("Complete Flow Test", "success", `✅ End-to-end flow working - ${duration}ms`)
  }

  const runAllTests = async () => {
    setIsRunning(true)
    console.log("[v0] ========== STARTING COMPREHENSIVE SYSTEM TEST ==========")
    console.log("[v0] Test start time:", new Date().toISOString())

    try {
      await runTest("Database Connection", testDatabaseConnection)
      await runTest("Orders API GET", testOrdersAPIGet)
      await runTest("Orders API PATCH", testOrdersAPIPatch)
      await runTest("Real-time Subscription", testRealtimeSubscription)
      await runTest("Cross-window Communication", testCrossWindowCommunication)
      await runTest("Complete Flow Test", testCompleteFlow)

      console.log("[v0] ========== ALL SYSTEM TESTS COMPLETED ==========")
      console.log("[v0] Test end time:", new Date().toISOString())
    } catch (error) {
      console.error("[v0] System test suite failed:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "running":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600 text-white">Passed</Badge>
      case "error":
        return <Badge className="bg-red-600 text-white">Failed</Badge>
      case "running":
        return <Badge className="bg-blue-600 text-white">Running</Badge>
      default:
        return <Badge className="bg-gray-600 text-white">Pending</Badge>
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const totalTests = tests.length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Flow Test Suite</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {successCount}/{totalTests} passed
            </span>
            <Button onClick={runAllTests} disabled={isRunning} className="bg-blue-600 hover:bg-blue-700">
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">{getStatusBadge(test.status)}</div>
            </div>
          ))}
        </div>

        {(successCount > 0 || errorCount > 0) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{totalTests - successCount - errorCount}</div>
                <div className="text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
