"use client"

import { useState, useEffect } from "react"
import { supabase, testSupabaseConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface TestResult {
  test: string
  status: "success" | "error" | "pending"
  message: string
  data?: any
}

export default function TestSupabase() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result])
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Basic connection
    addResult({ test: "Basic Connection", status: "pending", message: "Testing..." })
    try {
      const connectionResult = await testSupabaseConnection()
      addResult({
        test: "Basic Connection",
        status: connectionResult.success ? "success" : "error",
        message: connectionResult.success ? "Connected successfully" : connectionResult.error || "Connection failed",
        data: connectionResult.data,
      })
    } catch (error) {
      addResult({
        test: "Basic Connection",
        status: "error",
        message: `Connection error: ${error}`,
      })
    }

    // Test 2: Menu Items
    addResult({ test: "Menu Items", status: "pending", message: "Fetching menu items..." })
    try {
      const { data, error } = await supabase.from("menu_items").select("*").limit(5)
      addResult({
        test: "Menu Items",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : `Found ${data?.length || 0} menu items`,
        data: data?.slice(0, 3),
      })
    } catch (error) {
      addResult({
        test: "Menu Items",
        status: "error",
        message: `Menu items error: ${error}`,
      })
    }

    // Test 3: Orders table
    addResult({ test: "Orders Table", status: "pending", message: "Testing orders table..." })
    try {
      const { data, error } = await supabase.from("orders").select("order_id, status, created_at").limit(3)
      addResult({
        test: "Orders Table",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : `Orders table accessible, found ${data?.length || 0} orders`,
        data: data,
      })
    } catch (error) {
      addResult({
        test: "Orders Table",
        status: "error",
        message: `Orders error: ${error}`,
      })
    }

    // Test 4: Reservations table
    addResult({ test: "Reservations Table", status: "pending", message: "Testing reservations table..." })
    try {
      const { data, error } = await supabase.from("reservations").select("reservation_id, name, date").limit(3)
      addResult({
        test: "Reservations Table",
        status: error ? "error" : "success",
        message: error
          ? `Error: ${error.message}`
          : `Reservations table accessible, found ${data?.length || 0} reservations`,
        data: data,
      })
    } catch (error) {
      addResult({
        test: "Reservations Table",
        status: "error",
        message: `Reservations error: ${error}`,
      })
    }

    // Test 5: Authentication
    addResult({ test: "Authentication", status: "pending", message: "Testing auth..." })
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      addResult({
        test: "Authentication",
        status: "success",
        message: user ? `Authenticated as: ${user.email}` : "Not authenticated (this is normal)",
        data: user ? { id: user.id, email: user.email } : null,
      })
    } catch (error) {
      addResult({
        test: "Authentication",
        status: "error",
        message: `Auth error: ${error}`,
      })
    }

    // Test 6: Environment Variables
    addResult({ test: "Environment Variables", status: "pending", message: "Checking env vars..." })
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    addResult({
      test: "Environment Variables",
      status: supabaseUrl && supabaseKey ? "success" : "error",
      message: `URL: ${supabaseUrl ? "✓ Set" : "✗ Missing"}, Key: ${supabaseKey ? "✓ Set" : "✗ Missing"}`,
      data: {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "Not set",
        keyLength: supabaseKey ? `${supabaseKey.length} characters` : "Not set",
      },
    })

    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "pending":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "✓"
      case "error":
        return "✗"
      case "pending":
        return "⏳"
      default:
        return "?"
    }
  }

  return (
    <div className="min-h-screen bg-darkBg text-white py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-4">Supabase Connection Test</h1>
          <p className="text-gray-300 mb-6">Testing database connectivity and functionality</p>
          <Button onClick={runTests} disabled={isRunning} className="mb-8">
            {isRunning ? "Running Tests..." : "Run Tests Again"}
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-black/30 rounded-lg border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{result.test}</h3>
                <span className={`text-xl ${getStatusColor(result.status)}`}>{getStatusIcon(result.status)}</span>
              </div>

              <p className={`text-sm mb-3 ${getStatusColor(result.status)}`}>{result.message}</p>

              {result.data && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">View Data</summary>
                  <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-8 p-6 bg-black/30 rounded-lg border border-gray-800">
            <h3 className="text-lg font-medium mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {results.filter((r) => r.status === "success").length}
                </div>
                <div className="text-sm text-gray-400">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {results.filter((r) => r.status === "error").length}
                </div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {results.filter((r) => r.status === "pending").length}
                </div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-blue-300">Setup Instructions</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>1. Make sure your Supabase project is created and running</p>
            <p>2. Set your environment variables in Vercel or .env.local:</p>
            <div className="bg-gray-900 p-3 rounded mt-2 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
            </div>
            <p>3. Run the database setup script in your Supabase SQL editor</p>
            <p>4. Check that RLS policies are properly configured</p>
          </div>
        </div>
      </div>
    </div>
  )
}
