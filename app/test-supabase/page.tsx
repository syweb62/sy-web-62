"use client"

import { useState, useEffect } from 'react'
import { testSupabaseConnection, menuItemsService, ordersService, profileService } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, Database, Users, ShoppingCart, MenuIcon } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: any
}

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending')

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const runComprehensiveTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    try {
      // Test 1: Basic Connection
      addTestResult({ name: 'Basic Connection', status: 'pending', message: 'Testing Supabase connection...' })
      const connectionTest = await testSupabaseConnection()
      
      if (connectionTest.connected) {
        addTestResult({ 
          name: 'Basic Connection', 
          status: 'success', 
          message: 'Successfully connected to Supabase',
          details: connectionTest.config
        })
      } else {
        addTestResult({ 
          name: 'Basic Connection', 
          status: 'error', 
          message: connectionTest.error || 'Connection failed',
          details: connectionTest.config
        })
        setOverallStatus('error')
        setIsRunning(false)
        return
      }

      // Test 2: Menu Items Service
      addTestResult({ name: 'Menu Items', status: 'pending', message: 'Testing menu items service...' })
      try {
        const menuItems = await menuItemsService.getAll()
        addTestResult({ 
          name: 'Menu Items', 
          status: 'success', 
          message: `Found ${menuItems.length} menu items`,
          details: menuItems.slice(0, 3)
        })
      } catch (error) {
        addTestResult({ 
          name: 'Menu Items', 
          status: 'error', 
          message: `Menu items test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        })
      }

      // Test 3: Database Tables Structure
      addTestResult({ name: 'Database Tables', status: 'pending', message: 'Checking database structure...' })
      try {
        const { supabase } = await import('@/lib/supabase')
        if (!supabase) throw new Error('Supabase client not available')
        
        const tables = ['profiles', 'menu_items', 'orders', 'order_items', 'reservations', 'social_media_links']
        const tableResults = []
        
        for (const table of tables) {
          try {
            const { data, error } = await supabase.from(table).select('*').limit(1)
            if (error) throw error
            tableResults.push({ table, status: 'exists', count: data?.length || 0 })
          } catch (error) {
            tableResults.push({ table, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
          }
        }
        
        const successfulTables = tableResults.filter(t => t.status === 'exists').length
        addTestResult({ 
          name: 'Database Tables', 
          status: successfulTables === tables.length ? 'success' : 'warning', 
          message: `${successfulTables}/${tables.length} tables accessible`,
          details: tableResults
        })
      } catch (error) {
        addTestResult({ 
          name: 'Database Tables', 
          status: 'error', 
          message: `Database structure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        })
      }

      // Test 4: Environment Variables
      addTestResult({ name: 'Environment Variables', status: 'pending', message: 'Checking environment setup...' })
      const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
      
      const missingVars = Object.entries(envVars).filter(([_, exists]) => !exists).map(([name]) => name)
      
      addTestResult({ 
        name: 'Environment Variables', 
        status: missingVars.length === 0 ? 'success' : 'warning', 
        message: missingVars.length === 0 ? 'All environment variables set' : `Missing: ${missingVars.join(', ')}`,
        details: envVars
      })

      // Test 5: Sample Data Insertion (if possible)
      addTestResult({ name: 'Data Operations', status: 'pending', message: 'Testing data operations...' })
      try {
        const { supabase } = await import('@/lib/supabase')
        if (!supabase) throw new Error('Supabase client not available')
        
        // Test read operation
        const { data: testRead, error: readError } = await supabase
          .from('menu_items')
          .select('id, name, price')
          .limit(1)
        
        if (readError) throw readError
        
        addTestResult({ 
          name: 'Data Operations', 
          status: 'success', 
          message: 'Read operations working correctly',
          details: { sampleData: testRead }
        })
      } catch (error) {
        addTestResult({ 
          name: 'Data Operations', 
          status: 'error', 
          message: `Data operations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        })
      }

      // Determine overall status
      const errorCount = testResults.filter(r => r.status === 'error').length
      const warningCount = testResults.filter(r => r.status === 'warning').length
      
      if (errorCount > 0) {
        setOverallStatus('error')
      } else if (warningCount > 0) {
        setOverallStatus('warning')
      } else {
        setOverallStatus('success')
      }

    } catch (error) {
      addTestResult({ 
        name: 'Test Suite', 
        status: 'error', 
        message: `Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      })
      setOverallStatus('error')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      case 'error': return <XCircle className="text-red-500" size={20} />
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />
      case 'pending': return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50'
      case 'error': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-yellow-500 bg-yellow-50'
      case 'pending': return 'border-blue-500 bg-blue-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Comprehensive System Test</h1>
          <p className="text-gray-400 mb-6">
            Testing all Supabase connections, database operations, and system functionality
          </p>
          
          <Button 
            onClick={runComprehensiveTests} 
            disabled={isRunning}
            className="bg-gold text-black hover:bg-gold/90"
          >
            {isRunning ? 'Running Tests...' : 'Run Full System Test'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(overallStatus)}
                  Overall Status: {overallStatus.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(result.status)}
                        <h3 className="font-semibold text-gray-900">{result.name}</h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600">Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="text-blue-500" size={24} />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Test database connectivity and table structure
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/test-supabase', '_blank')}
                className="w-full"
              >
                Test Database
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MenuIcon className="text-green-500" size={24} />
                Menu System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Test menu items, categories, and availability
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/menu', '_blank')}
                className="w-full"
              >
                Test Menu
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="text-purple-500" size={24} />
                Cart & Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Test cart functionality and order processing
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/cart', '_blank')}
                className="w-full"
              >
                Test Cart
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-orange-500" size={24} />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Test user authentication and profiles
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/signin', '_blank')}
                className="w-full"
              >
                Test Auth
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
