"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, ShoppingBag, Users, TrendingUp, Calendar, Clock, Bell, Plus, Eye } from "lucide-react"
import Link from "next/link"

const safeFormatBangladeshiTaka = (amount: number): string => {
  try {
    if (typeof amount !== "number" || isNaN(amount)) return "৳0"
    return `৳${amount.toLocaleString("en-BD")}`
  } catch (error) {
    console.warn("[v0] Error formatting currency:", error)
    return `৳${amount || 0}`
  }
}

const safeGetBangladeshTime = (): string => {
  try {
    return new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.warn("[v0] Error getting Bangladesh time:", error)
    return new Date().toLocaleString()
  }
}

interface DashboardStats {
  revenue: {
    today: number
    thisMonth: number
    growth: number
  }
  orders: {
    today: number
    pending: number
    completed: number
    total: number
  }
  customers: {
    total: number
    new: number
  }
  reservations: {
    today: number
    upcoming: number
  }
}

interface Order {
  id: string
  short_order_id?: string
  customer_name: string
  total_price: number
  status: string
  created_at: string
  order_items: Array<{
    item_name: string
    quantity: number
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: { today: 0, thisMonth: 0, growth: 0 },
    orders: { today: 0, pending: 0, completed: 0, total: 0 },
    customers: { total: 0, new: 0 },
    reservations: { today: 0, upcoming: 0 },
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      console.log("[v0] Fetching dashboard data...")

      const ordersResponse = await fetch("/api/orders")
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()

        let orders: Order[] = []
        if (Array.isArray(ordersData)) {
          orders = ordersData
        } else if (ordersData && typeof ordersData === "object") {
          if (Array.isArray(ordersData.data)) {
            orders = ordersData.data
          } else if (Array.isArray(ordersData.orders)) {
            orders = ordersData.orders
          } else {
            console.warn("[v0] Orders data structure unexpected:", ordersData)
            orders = []
          }
        } else {
          console.warn("[v0] Orders data is not valid:", ordersData)
          orders = []
        }

        console.log("[v0] Dashboard orders data:", orders.length, "orders")

        const safeOrders = orders.filter((order) => {
          return order && typeof order === "object" && order.id && typeof order.total_price !== "undefined"
        })

        setRecentOrders(safeOrders.slice(0, 5))

        const today = new Date().toDateString()
        const todayOrders = safeOrders.filter((order: Order) => {
          try {
            return order.created_at && new Date(order.created_at).toDateString() === today
          } catch {
            return false
          }
        })

        const pendingOrders = safeOrders.filter(
          (order: Order) => order.status === "pending" || order.status === "confirmed",
        )

        const completedOrders = safeOrders.filter((order: Order) => order.status === "delivered")

        const todayRevenue = todayOrders.reduce((sum: number, order: Order) => {
          const price = Number.parseFloat(String(order.total_price)) || 0
          return sum + (isNaN(price) ? 0 : price)
        }, 0)

        const totalRevenue = safeOrders.reduce((sum: number, order: Order) => {
          const price = Number.parseFloat(String(order.total_price)) || 0
          return sum + (isNaN(price) ? 0 : price)
        }, 0)

        const uniqueCustomers = new Set(
          safeOrders
            .filter((order) => order.customer_name && typeof order.customer_name === "string")
            .map((order: Order) => order.customer_name),
        )

        setStats({
          revenue: {
            today: todayRevenue,
            thisMonth: totalRevenue,
            growth: 12.5,
          },
          orders: {
            today: todayOrders.length,
            pending: pendingOrders.length,
            completed: completedOrders.length,
            total: safeOrders.length,
          },
          customers: {
            total: uniqueCustomers.size,
            new: 5,
          },
          reservations: {
            today: 0,
            upcoming: 0,
          },
        })
      } else {
        const errorMsg = `Failed to fetch orders: ${ordersResponse.status}`
        console.error("[v0]", errorMsg)
        setError(errorMsg)
        setRecentOrders([])
      }
    } catch (error) {
      const errorMsg = `Error fetching dashboard data: ${error instanceof Error ? error.message : String(error)}`
      console.error("[v0]", errorMsg)
      setError(errorMsg)
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "preparing":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      case "delivered":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-900">
        <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
        <Button onClick={fetchDashboardData} variant="outline" className="bg-transparent border-red-200 text-red-600">
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-200">
              <Bell size={16} />
              <span className="text-sm">{notifications.length} notifications</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
            <Clock size={16} />
            <span>{safeGetBangladeshTime()}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{safeFormatBangladeshiTaka(stats.revenue.today)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp size={12} className="mr-1" />+{stats.revenue.growth}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Orders Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.orders.today}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.orders.pending} pending • {stats.orders.completed} completed
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.customers.total}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.customers.new} new this week</div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reservations Today</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.reservations.today}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.reservations.upcoming} upcoming this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                Recent Orders
              </div>
              <Link href="/dashboard/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                >
                  <Eye size={16} className="mr-1" />
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 font-mono text-sm">
                          {order.short_order_id || order.id.slice(0, 8)}
                        </span>
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0
                          ? order.order_items
                              .filter((item) => item && item.item_name)
                              .map((item) => `${item.quantity || 1}x ${item.item_name}`)
                              .join(", ")
                          : "No items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{safeFormatBangladeshiTaka(order.total_price)}</p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          try {
                            return new Date(order.created_at).toLocaleTimeString("en-US", {
                              timeZone: "Asia/Dhaka",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          } catch (error) {
                            return "Invalid time"
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/orders">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                >
                  <ShoppingBag size={20} className="text-purple-600" />
                  <span className="text-sm">Manage Orders</span>
                </Button>
              </Link>
              <Link href="/dashboard/reservations">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                >
                  <Calendar size={20} className="text-purple-600" />
                  <span className="text-sm">Reservations</span>
                </Button>
              </Link>
              <Link href="/dashboard/menu/new">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                >
                  <Plus size={20} className="text-purple-600" />
                  <span className="text-sm">Add Menu Item</span>
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                >
                  <BarChart3 size={20} className="text-purple-600" />
                  <span className="text-sm">View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
