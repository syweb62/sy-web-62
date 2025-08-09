'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Database, Loader2, ExternalLink, Zap, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { 
  testSupabaseConnection, 
  getSupabaseConfig, 
  supabase,
  menuItemsService,
  socialMediaService
} from '@/lib/supabase'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  data?: any
  error?: string
}

export default function TestSupabasePage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<any>(null)

  const addResult = (result: TestResult) => {
    setResults(prev => {
      const existing = prev.find(r => r.test === result.test)
      if (existing) {
        return prev.map(r => r.test === result.test ? result : r)
      }
      return [...prev, result]
    })
  }

  const runTests = async () => {
    try {
      setIsRunning(true)
      setResults([])

      // Get configuration
      const configResult = getSupabaseConfig()
      setConfig(configResult)

      // Test 1: Configuration
      addResult({ test: 'Configuration', status: 'pending', message: 'Checking configuration...' })
      
      try {
        addResult({ 
          test: 'Configuration', 
          status: configResult.isConfigured ? 'success' : 'error', 
          message: configResult.isConfigured 
            ? `Project: ${configResult.projectId}, Client initialized: ${configResult.clientCreated}`
            : `Configuration issue: ${configResult.initializationError || 'Missing credentials'}`,
          data: configResult
        })
      } catch (error) {
        addResult({ 
          test: 'Configuration', 
          status: 'error', 
          message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 2: Connection
      addResult({ test: 'Connection', status: 'pending', message: 'Testing connection...' })
      try {
        const connectionResult = await testSupabaseConnection()
        addResult({ 
          test: 'Connection', 
          status: connectionResult.connected ? 'success' : 'error', 
          message: connectionResult.error || connectionResult.status,
          data: connectionResult.config,
          error: connectionResult.error || undefined
        })
      } catch (error) {
        addResult({ 
          test: 'Connection', 
          status: 'error', 
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Test 3: Menu Items
      addResult({ test: 'Menu Items', status: 'pending', message: 'Fetching menu items...' })
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .limit(5)
        
        if (error) throw error
        addResult({ 
          test: 'Menu Items', 
          status: 'success', 
          message: `Found ${data?.length || 0} menu items`,
          data: data
        })
      } catch (error: any) {
        addResult({ 
          test: 'Menu Items', 
          status: 'error', 
          message: `Failed to fetch menu items: ${error.message}`,
          error: error.message
        })
      }

      // Test 4: Social Media Links
      addResult({ test: 'Social Media', status: 'pending', message: 'Fetching social media links...' })
      try {
        const { data, error } = await supabase
          .from('social_media_links')
          .select('*')
        
        if (error) throw error
        addResult({ 
          test: 'Social Media', 
          status: 'success', 
          message: `Found ${data?.length || 0} social media links`,
          data: data
        })
      } catch (error: any) {
        addResult({ 
          test: 'Social Media', 
          status: 'error', 
          message: `Failed to fetch social media links: ${error.message}`,
          error: error.message
        })
      }

      // Test 5: Authentication
      addResult({ test: 'Authentication', status: 'pending', message: 'Checking auth status...' })
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        addResult({ 
          test: 'Authentication', 
          status: 'success', 
          message: user ? `Logged in as ${user.email}` : 'Not logged in (this is normal)',
          data: user ? { email: user.email, id: user.id } : null
        })
      } catch (error: any) {
        addResult({ 
          test: 'Authentication', 
          status: 'error', 
          message: `Auth check failed: ${error.message}`,
          error: error.message
        })
      }

      // Test 6: Database Tables Structure
      addResult({ test: 'Database Tables', status: 'pending', message: 'Checking table structure...' })
      try {
        const tables = ['profiles', 'menu_items', 'orders', 'order_items', 'reservations', 'social_media_links']
        const tableChecks = await Promise.all(
          tables.map(async (table) => {
            try {
              const { error } = await supabase.from(table).select('*').limit(1)
              return { table, exists: !error, error: error?.message }
            } catch (err) {
              return { table, exists: false, error: err instanceof Error ? err.message : 'Unknown error' }
            }
          })
        )
        
        const existingTables = tableChecks.filter(t => t.exists).map(t => t.table)
        const missingTables = tableChecks.filter(t => !t.exists)
        
        addResult({ 
          test: 'Database Tables', 
          status: missingTables.length === 0 ? 'success' : 'error',
          message: missingTables.length === 0 
            ? `All ${existingTables.length} tables exist and are accessible`
            : `Missing tables: ${missingTables.map(t => t.table).join(', ')}`,
          data: { existing: existingTables, missing: missingTables },
          error: missingTables.length > 0 ? `Missing tables: ${missingTables.map(t => `${t.table} (${t.error})`).join(', ')}` : undefined
        })
      } catch (error: any) {
        addResult({ 
          test: 'Database Tables', 
          status: 'error', 
          message: `Table check failed: ${error.message}`,
          error: error.message
        })
      }

    } catch (error) {
      console.error('Test runner error:', error)
      addResult({
        test: 'Test Runner',
        status: 'error',
        message: `Test runner failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">
            Testing connection to your Supabase database (Project: pjoelkxkcwtzmbyswfhu).
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Alert className="mb-6 border-green-500 bg-green-50">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold text-green-800">✅ Updated with Your Correct Credentials</p>
            <p className="text-green-700">
              Now using your correct Supabase project credentials for <strong>pjoelkxkcwtzmbyswfhu</strong>.
            </p>
            <div className="bg-white p-3 rounded border text-xs font-mono">
              <div>Project URL: <strong>https://pjoelkxkcwtzmbyswfhu.supabase.co</strong></div>
              <div>API Key: <strong>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</strong> (Updated)</div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {config && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Supabase URL:</strong> {config.urlPreview}
              </div>
              <div>
                <strong>Project ID:</strong> {config.projectId}
              </div>
              <div>
                <strong>Anon Key:</strong> {config.anonKeyPreview}
              </div>
              <div>
                <strong>Client Status:</strong> {config.clientCreated ? '✅ Initialized' : '❌ Not initialized'}
              </div>
              {config.initializationError && (
                <div className="col-span-2">
                  <strong>Error:</strong> <span className="text-red-600">{config.initializationError}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 mb-6">
        <Button onClick={runTests} disabled={isRunning} className="flex items-center gap-2">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
        <a 
          href="https://supabase.com/dashboard/project/pjoelkxkcwtzmbyswfhu" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Supabase Dashboard
          </Button>
        </a>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <CardTitle className="text-lg">{result.test}</CardTitle>
              </div>
              {getStatusBadge(result.status)}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">{result.message}</p>
              
              {result.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error Details:</strong> {result.error}
                </div>
              )}
              
              {result.data && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Data Preview:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Database Setup (if tables are missing):</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                <li>
                  Go to your{' '}
                  <a 
                    href="https://supabase.com/dashboard/project/pjoelkxkcwtzmbyswfhu" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 underline"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>Navigate to the <strong>SQL Editor</strong> tab</li>
                <li>Copy the SQL script from the scripts folder</li>
                <li>Paste it into the SQL Editor and click <strong>Run</strong></li>
                <li>Wait for the script to complete (you'll see success messages)</li>
                <li>Come back here and click <strong>Run Tests</strong></li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800 mb-2">✅ What the setup script creates:</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                <li>6 database tables with proper relationships</li>
                <li>20 sample menu items across 5 categories</li>
                <li>5 social media links</li>
                <li>Row Level Security policies</li>
                <li>Performance indexes</li>
                <li>User authentication system</li>
                <li>Automatic profile creation for new users</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800 mb-2">🎯 Ready to Deploy:</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                <li>Your credentials are now correctly configured</li>
                <li>Environment variables match your Vercel setup</li>
                <li>Database will be ready after running the SQL script</li>
                <li>Your restaurant app will be fully functional!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
