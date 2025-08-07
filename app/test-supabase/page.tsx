'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Database, Users, ShoppingCart } from 'lucide-react'

const supabaseUrl = 'https://bncgfivqfuryyyxbvzhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuY3pnZml2cWZ1cnl5eGJ2emhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI3ODYsImV4cCI6MjA3MDEyODc4Nn0.gq24PaaaO9yd7Z5MZpuwjt5Fpk-eL1UI01DYP8n_4h4'

const supabase = createClient(supabaseUrl, supabaseKey)

interface TestResult {
  name: string
  status: 'success' | 'error' | 'loading'
  message: string
  data?: any
}

export default function TestSupabasePage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Connection', status: 'loading', message: 'Testing connection...' },
    { name: 'Menu Items', status: 'loading', message: 'Fetching menu items...' },
    { name: 'Social Media Links', status: 'loading', message: 'Fetching social media links...' },
    { name: 'Database Tables', status: 'loading', message: 'Checking table structure...' }
  ])

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...update } : test))
  }

  const runTests = async () => {
    // Reset all tests
    setTests([
      { name: 'Connection', status: 'loading', message: 'Testing connection...' },
      { name: 'Menu Items', status: 'loading', message: 'Fetching menu items...' },
      { name: 'Social Media Links', status: 'loading', message: 'Fetching social media links...' },
      { name: 'Database Tables', status: 'loading', message: 'Checking table structure...' }
    ])

    // Test 1: Basic Connection
    try {
      const { data, error } = await supabase.from('menu_items').select('count', { count: 'exact', head: true })
      if (error) throw error
      updateTest(0, { 
        status: 'success', 
        message: `Connected successfully! Found ${data?.length || 0} records in menu_items table.` 
      })
    } catch (error: any) {
      updateTest(0, { 
        status: 'error', 
        message: `Connection failed: ${error.message}` 
      })
    }

    // Test 2: Menu Items
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(5)
      
      if (error) throw error
      updateTest(1, { 
        status: 'success', 
        message: `Successfully fetched ${data?.length || 0} menu items`,
        data: data 
      })
    } catch (error: any) {
      updateTest(1, { 
        status: 'error', 
        message: `Failed to fetch menu items: ${error.message}` 
      })
    }

    // Test 3: Social Media Links
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
      
      if (error) throw error
      updateTest(2, { 
        status: 'success', 
        message: `Successfully fetched ${data?.length || 0} social media links`,
        data: data 
      })
    } catch (error: any) {
      updateTest(2, { 
        status: 'error', 
        message: `Failed to fetch social media links: ${error.message}` 
      })
    }

    // Test 4: Check table structure
    try {
      const tables = ['profiles', 'menu_items', 'orders', 'order_items', 'reservations', 'social_media_links']
      const tableChecks = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select('*').limit(1)
          return { table, exists: !error }
        })
      )
      
      const existingTables = tableChecks.filter(t => t.exists).map(t => t.table)
      const missingTables = tableChecks.filter(t => !t.exists).map(t => t.table)
      
      updateTest(3, { 
        status: missingTables.length === 0 ? 'success' : 'error',
        message: missingTables.length === 0 
          ? `All ${existingTables.length} tables exist and are accessible`
          : `Missing tables: ${missingTables.join(', ')}`,
        data: { existing: existingTables, missing: missingTables }
      })
    } catch (error: any) {
      updateTest(3, { 
        status: 'error', 
        message: `Failed to check tables: ${error.message}` 
      })
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'loading':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'loading':
        return <Badge variant="secondary">Loading...</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
        <p className="text-muted-foreground">
          Testing connection to your Supabase database and verifying table structure.
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm"><strong>Supabase URL:</strong> {supabaseUrl}</p>
          <p className="text-sm"><strong>Project ID:</strong> bncgfivqfuryyyxbvzhp</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={runTests} className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Run Tests Again
        </Button>
      </div>

      <div className="grid gap-6">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(test.status)}
                <CardTitle className="text-lg">{test.name}</CardTitle>
              </div>
              {getStatusBadge(test.status)}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {test.message}
              </CardDescription>
              
              {test.data && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Data Preview:</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(test.data, null, 2)}
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
            <Users className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>✅ <strong>If all tests pass:</strong> Your Supabase database is ready to use!</p>
            <p>❌ <strong>If tests fail:</strong> Make sure you've run the database setup script in your Supabase SQL editor.</p>
            <p>🔧 <strong>Missing tables:</strong> Copy and run the <code>setup-supabase-database-v2.sql</code> script.</p>
            <p>🚀 <strong>Ready to deploy:</strong> Add your environment variables to Vercel and deploy!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
