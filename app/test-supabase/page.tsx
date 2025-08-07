'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { testSupabaseConnection } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    status: string
    error: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [envVars, setEnvVars] = useState<{
    supabaseUrl: string
    supabaseAnonKey: string
  }>({
    supabaseUrl: '',
    supabaseAnonKey: ''
  })

  useEffect(() => {
    // Check environment variables on client side
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'
    })
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const result = await testSupabaseConnection()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({
        connected: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />
    if (!connectionStatus) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return connectionStatus.connected ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Testing...</Badge>
    if (!connectionStatus) return <Badge variant="outline">Not tested</Badge>
    return connectionStatus.connected ? 
      <Badge variant="default" className="bg-green-500">Connected</Badge> : 
      <Badge variant="destructive">Disconnected</Badge>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">
            Verify that your Vercel deployment is properly connected to Supabase
          </p>
        </div>

        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Check if Supabase environment variables are properly set
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
              <Badge variant={envVars.supabaseUrl !== 'Not set' ? 'default' : 'destructive'}>
                {envVars.supabaseUrl}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <Badge variant={envVars.supabaseAnonKey !== 'Not set' ? 'default' : 'destructive'}>
                {envVars.supabaseAnonKey}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Connection Status
            </CardTitle>
            <CardDescription>
              Test the actual connection to your Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              {getStatusBadge()}
            </div>
            
            {connectionStatus?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">Error:</p>
                <p className="text-sm text-red-600">{connectionStatus.error}</p>
              </div>
            )}

            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to properly connect Vercel to Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-medium">Create a Supabase Project</p>
                  <p className="text-sm text-muted-foreground">Go to supabase.com and create a new project</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-medium">Get your Supabase credentials</p>
                  <p className="text-sm text-muted-foreground">
                    From your Supabase project settings, copy the Project URL and anon public key
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-white text-sm flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="font-medium">Add environment variables to Vercel</p>
                  <p className="text-sm text-muted-foreground">
                    In your Vercel project settings, add these environment variables:
                  </p>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono">
                    <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
                    <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="font-medium">Run the database setup script</p>
                  <p className="text-sm text-muted-foreground">
                    Execute the SQL script in your Supabase SQL Editor to create the necessary tables
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">5</div>
                <div>
                  <p className="font-medium">Redeploy your Vercel project</p>
                  <p className="text-sm text-muted-foreground">
                    After adding environment variables, trigger a new deployment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                Open Supabase Dashboard
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                Open Vercel Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
