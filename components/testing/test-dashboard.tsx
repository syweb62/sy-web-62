"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  ChromeIcon as Firefox,
  AppleIcon as Safari,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react"
import { testingUtils, type TestResult } from "@/lib/testing-utils"

interface TestDashboardProps {
  isVisible?: boolean
}

export function TestDashboard({ isVisible = false }: TestDashboardProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null)

  useEffect(() => {
    // Load existing results
    setTestResults(testingUtils.getTestResults())
  }, [])

  const runTests = async () => {
    setIsRunning(true)
    try {
      const result = await testingUtils.runTestSuite()
      setCurrentTest(result)
      setTestResults(testingUtils.getTestResults())
    } catch (error) {
      console.error("Test execution failed:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const exportResults = () => {
    const data = testingUtils.exportResults()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sushi-yaki-test-results-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    testingUtils.clearResults()
    setTestResults([])
    setCurrentTest(null)
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "tablet":
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case "chrome":
        return <Chrome className="w-4 h-4" />
      case "firefox":
        return <Firefox className="w-4 h-4" />
      case "safari":
        return <Safari className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "major":
        return "bg-orange-500"
      case "minor":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "layout":
        return "bg-blue-500"
      case "performance":
        return "bg-purple-500"
      case "functionality":
        return "bg-green-500"
      case "accessibility":
        return "bg-indigo-500"
      case "compatibility":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] overflow-auto">
      <div className="container mx-auto p-4 min-h-screen">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Sushi Yaki - Testing Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={runTests} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    "Run Tests"
                  )}
                </Button>
                <Button onClick={exportResults} variant="outline" disabled={testResults.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={clearResults} variant="outline" disabled={testResults.length === 0}>
                  Clear Results
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="current">Current Test</TabsTrigger>
                <TabsTrigger value="history">Test History</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{testResults.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {testResults.length > 0
                          ? Math.round(
                              (testResults.filter((r) => r.status === "pass").length / testResults.length) * 100,
                            )
                          : 0}
                        %
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {testResults.reduce(
                          (acc, result) => acc + result.issues.filter((issue) => issue.severity === "critical").length,
                          0,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Device & Browser Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Device Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(testResults.map((r) => r.device.type))).map((type) => (
                            <Badge key={type} variant="outline" className="flex items-center gap-1">
                              {getDeviceIcon(type)}
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Browsers</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(testResults.map((r) => r.device.browser))).map((browser) => (
                            <Badge key={browser} variant="outline" className="flex items-center gap-1">
                              {getBrowserIcon(browser)}
                              {browser}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="current" className="space-y-4">
                {currentTest ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(currentTest.status)}
                          Current Test Result
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Device</div>
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(currentTest.device.type)}
                              {currentTest.device.type}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Browser</div>
                            <div className="flex items-center gap-1">
                              {getBrowserIcon(currentTest.device.browser)}
                              {currentTest.device.browser} {currentTest.device.version}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">OS</div>
                            <div>{currentTest.device.os}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Resolution</div>
                            <div>
                              {currentTest.device.screenWidth}x{currentTest.device.screenHeight}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Load Time</div>
                              <div>{Math.round(currentTest.performance.loadTime)}ms</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">First Contentful Paint</div>
                              <div>{Math.round(currentTest.performance.firstContentfulPaint)}ms</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Time to Interactive</div>
                              <div>{Math.round(currentTest.performance.timeToInteractive)}ms</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Issues Found</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-red-50">
                              Critical: {currentTest.issues.filter((i) => i.severity === "critical").length}
                            </Badge>
                            <Badge variant="outline" className="bg-orange-50">
                              Major: {currentTest.issues.filter((i) => i.severity === "major").length}
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50">
                              Minor: {currentTest.issues.filter((i) => i.severity === "minor").length}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        No test results yet. Run a test to see results here.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <Card key={result.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(result.status)}
                            <div>
                              <div className="font-medium">{new Date(result.timestamp).toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">
                                {result.device.browser} on {result.device.os} ({result.device.type})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.issues.length} issues</Badge>
                            <Badge variant="outline">{Math.round(result.performance.loadTime)}ms load</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {testResults.length === 0 && (
                    <Card>
                      <CardContent className="flex items-center justify-center h-32">
                        <div className="text-center text-muted-foreground">
                          No test history available. Run some tests to see history here.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                <div className="space-y-4">
                  {testResults
                    .flatMap((result) =>
                      result.issues.map((issue) => ({ ...issue, testId: result.id, timestamp: result.timestamp })),
                    )
                    .map((issue, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                                <Badge variant="outline" className={getCategoryColor(issue.category)}>
                                  {issue.category}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(issue.timestamp).toLocaleString()}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium">{issue.description}</h4>
                              {issue.element && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Element: <code className="bg-gray-100 px-1 rounded">{issue.element}</code>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-green-600">Expected:</div>
                                <div>{issue.expectedBehavior}</div>
                              </div>
                              <div>
                                <div className="font-medium text-red-600">Actual:</div>
                                <div>{issue.actualBehavior}</div>
                              </div>
                            </div>

                            <div>
                              <div className="font-medium text-sm mb-1">Reproduction Steps:</div>
                              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                                {issue.reproductionSteps.map((step, stepIndex) => (
                                  <li key={stepIndex}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {testResults.every((result) => result.issues.length === 0) && (
                    <Card>
                      <CardContent className="flex items-center justify-center h-32">
                        <div className="text-center text-muted-foreground">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          No issues found! Great job!
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
