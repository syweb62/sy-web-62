"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  value?: string
}

export function DeploymentDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    results.push({
      name: "Supabase URL",
      status: supabaseUrl ? "success" : "error",
      message: supabaseUrl ? "Environment variable found" : "NEXT_PUBLIC_SUPABASE_URL is missing",
      value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : undefined,
    })

    results.push({
      name: "Supabase Anon Key",
      status: supabaseAnonKey ? "success" : "error",
      message: supabaseAnonKey ? "Environment variable found" : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing",
      value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : undefined,
    })

    // Check domain configuration
    const currentDomain = window.location.hostname
    results.push({
      name: "Current Domain",
      status: "success",
      message: "Current deployment domain",
      value: currentDomain,
    })

    // Test Supabase connection
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

        // Test basic connection
        const { data, error } = await supabase.from("orders").select("count").limit(1)

        results.push({
          name: "Database Connection",
          status: error ? "error" : "success",
          message: error ? `Connection failed: ${error.message}` : "Database connection successful",
        })

        // Test real-time connection
        const channel = supabase.channel("test-connection")

        const connectionPromise = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000)

          channel
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {})
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                clearTimeout(timeout)
                resolve(true)
              } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                clearTimeout(timeout)
                resolve(false)
              }
            })
        })

        const realtimeConnected = await connectionPromise

        results.push({
          name: "Real-time Connection",
          status: realtimeConnected ? "success" : "error",
          message: realtimeConnected
            ? "Real-time subscriptions working"
            : "Real-time connection failed - check CORS and WebSocket settings",
        })

        // Cleanup
        supabase.removeChannel(channel)
      } catch (error) {
        results.push({
          name: "Supabase Connection Test",
          status: "error",
          message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    // Check for common deployment issues
    const isProduction = process.env.NODE_ENV === "production"
    results.push({
      name: "Environment",
      status: isProduction ? "success" : "warning",
      message: isProduction ? "Running in production mode" : "Running in development mode",
      value: process.env.NODE_ENV,
    })

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Deployment Diagnostics</h2>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Diagnostics"}
          </button>
        </div>

        <div className="space-y-4">
          {diagnostics.map((result, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border">
              <div
                className={`w-3 h-3 rounded-full mt-1 ${
                  result.status === "success"
                    ? "bg-green-500"
                    : result.status === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{result.name}</h3>
                <p
                  className={`text-sm ${
                    result.status === "success"
                      ? "text-green-700"
                      : result.status === "error"
                        ? "text-red-700"
                        : "text-yellow-700"
                  }`}
                >
                  {result.message}
                </p>
                {result.value && <p className="text-xs text-gray-500 mt-1 font-mono">{result.value}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Deployment Checklist</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="font-semibold">1.</span>
            <div>
              <strong>Environment Variables:</strong> Ensure all Supabase environment variables are set in your Vercel
              deployment:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_URL</code>
                </li>
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                </li>
                <li>
                  <code>SUPABASE_SERVICE_ROLE_KEY</code>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <span className="font-semibold">2.</span>
            <div>
              <strong>Supabase Project Settings:</strong> Add your production domain to allowed origins:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Go to Supabase Dashboard → Authentication → URL Configuration</li>
                <li>
                  Add <code>https://sushiyakiresto.com</code> to Site URL
                </li>
                <li>
                  Add <code>https://sushiyakiresto.com/**</code> to Redirect URLs
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <span className="font-semibold">3.</span>
            <div>
              <strong>Real-time Configuration:</strong> Ensure WebSocket connections are allowed:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Check Supabase Dashboard → Settings → API</li>
                <li>Verify Real-time is enabled for your project</li>
                <li>Ensure no firewall blocking WebSocket connections</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <span className="font-semibold">4.</span>
            <div>
              <strong>Vercel Deployment:</strong> Verify deployment configuration:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Check Vercel Dashboard → Project → Settings → Environment Variables</li>
                <li>Ensure all variables are set for Production environment</li>
                <li>Redeploy after adding environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
