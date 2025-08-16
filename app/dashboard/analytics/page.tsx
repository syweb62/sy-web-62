"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Calendar, Download, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface AnalyticsData {
  revenue: {
    total: number
    growth: number
    daily: Array<{ date: string; amount: number }>
    monthly: Array<{ month: string; amount: number }>
  }
  orders: {
    total: number
    growth: number
    byStatus: Array<{ status: string; count: number }>
    daily: Array<{ date: string; count: number }>
  }
  customers: {
    total: number
    new: number
    returning: number
    growth: number
  }
  topItems: Array<{ name: string; orders: number; revenue: number }>
  performance: {
    avgOrderValue: number
    conversionRate: number
    customerLifetimeValue: number
  }
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#D4AF37",
  },
  orders: {
    label: "Orders",
    color: "#3B82F6",
  },
  customers: {
    label: "Customers",
    color: "#10B981",
  },
}

const COLORS = ["#D4AF37", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
      startDate.setDate(endDate.getDate() - days)

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          order_id,
          total_price,
          status,
          created_at,
          user_id,
          order_items (
            item_name,
            quantity,
            price_at_purchase
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (ordersError) throw ordersError

      // Fetch customers data
      const { data: customers, error: customersError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", startDate.toISOString())

      if (customersError) throw customersError

      // Process data
      const processedData = processAnalyticsData(orders || [], customers || [], days)
      setData(processedData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const processAnalyticsData = (orders: any[], customers: any[], days: number): AnalyticsData => {
    // Revenue calculations
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    const previousPeriodOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      return orderDate < cutoffDate
    })
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Daily revenue
    const dailyRevenue = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toISOString().split("T")[0]
      const dayOrders = orders.filter((order) => order.created_at.startsWith(dateStr))
      const amount = dayOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      return { date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), amount }
    })

    // Orders by status
    const ordersByStatus = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const statusData = Object.entries(ordersByStatus).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }))

    // Daily orders
    const dailyOrders = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toISOString().split("T")[0]
      const count = orders.filter((order) => order.created_at.startsWith(dateStr)).length
      return { date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count }
    })

    // Top items
    const itemCounts = orders
      .flatMap((order) => order.order_items || [])
      .reduce(
        (acc, item) => {
          const name = item.item_name
          if (!acc[name]) {
            acc[name] = { orders: 0, revenue: 0 }
          }
          acc[name].orders += item.quantity
          acc[name].revenue += item.price_at_purchase * item.quantity
          return acc
        },
        {} as Record<string, { orders: number; revenue: number }>,
      )

    const topItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Customer metrics
    const totalCustomers = customers.length
    const newCustomers = customers.filter((customer) => {
      const customerDate = new Date(customer.created_at)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      return customerDate >= cutoffDate
    }).length

    const returningCustomers = orders.filter((order) => order.user_id).length - newCustomers
    const customerGrowth = totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0

    // Performance metrics
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    const conversionRate = totalCustomers > 0 ? (orders.length / totalCustomers) * 100 : 0
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

    return {
      revenue: {
        total: totalRevenue,
        growth: revenueGrowth,
        daily: dailyRevenue,
        monthly: [], // Could be implemented for longer periods
      },
      orders: {
        total: orders.length,
        growth: 0, // Could be calculated similar to revenue
        byStatus: statusData,
        daily: dailyOrders,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomers,
        growth: customerGrowth,
      },
      topItems,
      performance: {
        avgOrderValue,
        conversionRate,
        customerLifetimeValue,
      },
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalyticsData()
  }

  const exportData = () => {
    if (!data) return

    const exportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      data,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sushi-yaki-analytics-${dateRange}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Analytics & Reports</h1>
          <p className="text-gray-400 mt-1">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportData} className="bg-gold text-black hover:bg-gold/80">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">৳{data.revenue.total.toFixed(2)}</div>
            <div
              className={`flex items-center text-xs mt-1 ${data.revenue.growth >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {data.revenue.growth >= 0 ? (
                <TrendingUp size={12} className="mr-1" />
              ) : (
                <TrendingDown size={12} className="mr-1" />
              )}
              {Math.abs(data.revenue.growth).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.orders.total}</div>
            <div className="text-xs text-gray-400 mt-1">
              Avg: ৳{data.performance.avgOrderValue.toFixed(2)} per order
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Customers</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.customers.total}</div>
            <div className="text-xs text-green-400 mt-1">
              <TrendingUp size={12} className="mr-1 inline" />
              {data.customers.new} new customers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.performance.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">CLV: ৳{data.performance.customerLifetimeValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <LineChart data={data.revenue.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Daily Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <BarChart data={data.orders.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <PieChart>
                    <Pie
                      data={data.orders.byStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data.orders.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-gray-400">{item.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold">৳{item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Customer Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Customers</span>
                  <span className="text-white font-medium">{data.customers.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">New Customers</span>
                  <span className="text-green-400 font-medium">{data.customers.new}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Returning Customers</span>
                  <span className="text-blue-400 font-medium">{data.customers.returning}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Growth Rate</span>
                  <span className="text-gold font-medium">{data.customers.growth.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Order Value</span>
                  <span className="text-gold font-medium">৳{data.performance.avgOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Conversion Rate</span>
                  <span className="text-green-400 font-medium">{data.performance.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Customer LTV</span>
                  <span className="text-blue-400 font-medium">
                    ৳{data.performance.customerLifetimeValue.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Revenue per Customer</span>
                  <span className="text-gold font-medium">
                    ৳{data.customers.total > 0 ? (data.revenue.total / data.customers.total).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Orders per Customer</span>
                  <span className="text-blue-400 font-medium">
                    {data.customers.total > 0 ? (data.orders.total / data.customers.total).toFixed(1) : "0.0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Repeat Customer Rate</span>
                  <span className="text-green-400 font-medium">
                    {data.customers.total > 0
                      ? ((data.customers.returning / data.customers.total) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
