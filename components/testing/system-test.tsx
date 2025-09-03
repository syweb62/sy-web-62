"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, Wifi, Database, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/context/notification-context"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"

interface TestResult {
  name: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: string
}

export function SystemTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { user, connectionStatus } = useAuth()
  const { connectionStatus: notificationStatus } = useNotifications()
  const { orders, connectionStatus: ordersStatus, error: ordersError } = useRealtimeOrders()

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: string) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      const newTest = { name, status, message, details }

      if (existing) {
        return prev.map((t) => (t.name === name ? newTest : t))
      }
      return [...prev, newTest]
    })
  }

  const runSystemTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Authentication System
    updateTest("Authentication", "pending", "Testing authentication system...")
    try {
      if (user) {
        updateTest("Authentication", "success", `Authenticated as ${user.name} (${user.role})`, `User ID: ${user.id}`)
      } else {
        updateTest("Authentication", "warning", "Not authenticated", "User should be signed in for full testing")
      }
    } catch (error) {
      updateTest("Authentication", "error", "Authentication test failed", String(error))
    }

    // Test 2: Database Connection
    updateTest("Database Connection", "pending", "Testing Supabase connection...")
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        updateTest("Database Connection", "error", "Database connection failed", error.message)
      } else {
        updateTest("Database Connection", "success", "Database connected successfully", "Supabase client operational")
      }
    } catch (error) {
      updateTest("Database Connection", "error", "Database connection error", String(error))
    }

    // Test 3: Real-time Notifications
    updateTest("Real-time Notifications", "pending", "Testing notification system...")
    try {
      if (notificationStatus === "connected") {
        updateTest("Real-time Notifications", "success", "Notification system connected", "Real-time updates active")
      } else if (notificationStatus === "connecting") {
        updateTest("Real-time Notifications", "warning", "Notification system connecting", "Connection in progress")
      } else {
        updateTest(
          "Real-time Notifications",
          "error",
          "Notification system disconnected",
          "Real-time updates unavailable",
        )
      }
    } catch (error) {
      updateTest("Real-time Notifications", "error", "Notification test failed", String(error))
    }

    // Test 4: Orders System
    updateTest("Orders System", "pending", "Testing orders functionality...")
    try {
      if (ordersError) {
        updateTest("Orders System", "error", "Orders system error", ordersError)
      } else if (ordersStatus === "connected") {
        updateTest(
          "Orders System",
          "success",
          `Orders system operational (${orders.length} orders)`,
          "Real-time order updates working",
        )
      } else if (ordersStatus === "connecting") {
        updateTest("Orders System", "warning", "Orders system connecting", "Connection in progress")
      } else {
        updateTest("Orders System", "error", "Orders system disconnected", "Real-time order updates unavailable")
      }
    } catch (error) {
      updateTest("Orders System", "error", "Orders test failed", String(error))
    }

    // Test 5: API Endpoints
    updateTest("API Endpoints", "pending", "Testing API endpoints...")
    try {
      const endpoints = [
        { name: "Orders API", url: "/api/orders" },
        { name: "Menu API", url: "/api/menu" },
        { name: "Reservations API", url: "/api/reservations" },
      ]

      let successCount = 0
      const results = []

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url)
          if (response.ok) {
            successCount++
            results.push(`${endpoint.name}: ✓`)
          } else {
            results.push(`${endpoint.name}: ✗ (${response.status})`)
          }
        } catch (error) {
          results.push(`${endpoint.name}: ✗ (Network Error)`)
        }
      }

      if (successCount === endpoints.length) {
        updateTest("API Endpoints", "success", "All API endpoints operational", results.join(", "))
      } else if (successCount > 0) {
        updateTest(
          "API Endpoints",
          "warning",
          `${successCount}/${endpoints.length} endpoints working`,
          results.join(", "),
        )
      } else {
        updateTest("API Endpoints", "error", "All API endpoints failed", results.join(", "))
      }
    } catch (error) {
      updateTest("API Endpoints", "error", "API test failed", String(error))
    }

    // Test 6: Menu Management
    updateTest("Menu Management", "pending", "Testing menu system...")
    try {
      const supabase = createClient()
      const { data: menuItems, error } = await supabase.from("menu_items").select("menu_id, name, available").limit(5)

      if (error) {
        updateTest("Menu Management", "error", "Menu system error", error.message)
      } else {
        const availableCount = menuItems?.filter((item) => item.available).length || 0
        updateTest(
          "Menu Management",
          "success",
          `Menu system operational (${menuItems?.length || 0} items)`,
          `${availableCount} items available`,
        )
      }
    } catch (error) {
      updateTest("Menu Management", "error", "Menu test failed", String(error))
    }

    // Test 7: Reservations System
    updateTest("Reservations System", "pending", "Testing reservations...")
    try {
      const supabase = createClient()
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("reservation_id, status")
        .limit(5)

      if (error) {
        updateTest("Reservations System", "error", "Reservations system error", error.message)
      } else {
        const confirmedCount = reservations?.filter((r) => r.status === "confirmed").length || 0
        updateTest(
          "Reservations System",
          "success",
          `Reservations system operational (${reservations?.length || 0} reservations)`,
          `${confirmedCount} confirmed`,
        )
      }
    } catch (error) {
      updateTest("Reservations System", "error", "Reservations test failed", String(error))
    }

    // Test 8: Analytics System
    updateTest("Analytics System", "pending", "Testing analytics...")
    try {
      const response = await fetch("/api/analytics")
      if (response.ok) {
        const data = await response.json()
        updateTest(
          "Analytics System",
          "success",
          "Analytics system operational",
          "Revenue and order analytics available",
        )
      } else {
        updateTest("Analytics System", "error", "Analytics API failed", `HTTP ${response.status}`)
      }
    } catch (error) {
      updateTest("Analytics System", "error", "Analytics test failed", String(error))
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "pending":
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-900/50 text-green-300 border-green-700"
      case "error":
        return "bg-red-900/50 text-red-300 border-red-700"
      case "warning":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700"
      case "pending":
        return "bg-blue-900/50 text-blue-300 border-blue-700"
    }
  }

  const getOverallStatus = () => {
    if (tests.length === 0) return "Not Started"
    if (isRunning) return "Running Tests..."

    const errorCount = tests.filter((t) => t.status === "error").length
    const warningCount = tests.filter((t) => t.status === "warning").length
    const successCount = tests.filter((t) => t.status === "success").length

    if (errorCount > 0) return `${errorCount} Critical Issues`
    if (warningCount > 0) return `${warningCount} Warnings`
    return `All Systems Operational (${successCount}/${tests.length})`
  }

  useEffect(() => {
    // Auto-run tests on component mount
    runSystemTests()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-gold" />
            System Functionality Test
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">Comprehensive test of all dashboard systems and integrations</p>
            <Button onClick={runSystemTests} disabled={isRunning} className="bg-gold text-black hover:bg-gold/80">
              {isRunning ? "Running Tests..." : "Run Tests"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Wifi className={`w-5 h-5 ${connectionStatus === "connected" ? "text-green-400" : "text-red-400"}`} />
                <span className="text-sm text-gray-300">Auth: {connectionStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database
                  className={`w-5 h-5 ${notificationStatus === "connected" ? "text-green-400" : "text-red-400"}`}
                />
                <span className="text-sm text-gray-300">Notifications: {notificationStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag
                  className={`w-5 h-5 ${ordersStatus === "connected" ? "text-green-400" : "text-red-400"}`}
                />
                <span className="text-sm text-gray-300">Orders: {ordersStatus}</span>
              </div>
            </div>
            <Badge
              className={getStatusColor(
                tests.some((t) => t.status === "error")
                  ? "error"
                  : tests.some((t) => t.status === "warning")
                    ? "warning"
                    : "success",
              )}
            >
              {getOverallStatus()}
            </Badge>
          </div>

          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.name}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium text-white">{test.name}</h4>
                    <p className="text-sm text-gray-400">{test.message}</p>
                    {test.details && <p className="text-xs text-gray-500 mt-1">{test.details}</p>}
                  </div>
                </div>
                <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
              </div>
            ))}
          </div>

          {tests.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-400">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p>Click "Run Tests" to verify system functionality</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
