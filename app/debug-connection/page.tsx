"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Loader2 } from "lucide-react"

export default function DebugConnectionPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkEnvironmentVariables = () => {
    setIsLoading(true)

    // Check client-side environment variables
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || "Not on Vercel",
    }

    // Check if running in browser
    const browserInfo = {
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "Server-side",
      location: typeof window !== "undefined" ? window.location.href : "Server-side",
      isClient: typeof window !== "undefined",
    }

    setDebugInfo({
      clientEnv,
      browserInfo,
      timestamp: new Date().toISOString(),
    })

    setIsLoading(false)
  }

  const testSupabaseImport = async () => {
    try {
      const { supabase, getSupabaseConfig } = await import("@/lib/supabase")
      const config = getSupabaseConfig()

      setDebugInfo((prev) => ({
        ...prev,
        supabaseImport: "Success",
        supabaseClient: supabase ? "Created" : "Failed to create",
        config,
      }))
    } catch (error) {
      setDebugInfo((prev) => ({
        ...prev,
        supabaseImport: "Failed",
        importError: error instanceof Error ? error.message : "Unknown error",
      }))
    }
  }

  const testBasicConnection = async () => {
    try {
      const { testSupabaseConnection } = await import("@/lib/supabase")
      const result = await testSupabaseConnection()

      setDebugInfo((prev) => ({
        ...prev,
        connectionTest: result,
      }))
    } catch (error) {
      setDebugInfo((prev) => ({
        ...prev,
        connectionTest: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  }

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Connection Debug Tool</h1>
          <p className="text-gray-400 mb-6">Debugging Supabase connection issues step by step</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="text-blue-500" size={24} />
                Environment Variables Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={checkEnvironmentVariables} disabled={isLoading} className="mb-4">
                {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Refresh Environment Check
              </Button>

              {debugInfo?.clientEnv && (
                <div className="space-y-2">
                  {Object.entries(debugInfo.clientEnv).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <span className="font-mono text-sm">{key}:</span>
                      <span className={`text-sm ${value === "Not set" ? "text-red-400" : "text-green-400"}`}>
                        {value as string}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Supabase Import Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testSupabaseImport} className="mb-4">
                Test Supabase Import
              </Button>

              {debugInfo?.supabaseImport && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.supabaseImport === "Success" ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                    <span>Import Status: {debugInfo.supabaseImport}</span>
                  </div>

                  {debugInfo.supabaseClient && (
                    <div className="flex items-center gap-2">
                      {debugInfo.supabaseClient === "Created" ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                      <span>Client Status: {debugInfo.supabaseClient}</span>
                    </div>
                  )}

                  {debugInfo.importError && (
                    <Alert className="border-red-500 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        Import Error: {debugInfo.importError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testBasicConnection} className="mb-4">
                Test Basic Connection
              </Button>

              {debugInfo?.connectionTest && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.connectionTest.connected ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                    <span>Connection: {debugInfo.connectionTest.connected ? "Success" : "Failed"}</span>
                  </div>

                  {debugInfo.connectionTest.error && (
                    <Alert className="border-red-500 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        Connection Error: {debugInfo.connectionTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {debugInfo && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Full Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center">
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-700">
              <strong>Common Issues:</strong>
              <ul className="list-disc list-inside mt-2 text-left">
                <li>Environment variables not set in Vercel deployment</li>
                <li>CORS issues with Supabase configuration</li>
                <li>Network connectivity problems</li>
                <li>Supabase project not properly configured</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
