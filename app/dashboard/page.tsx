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
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-200 text-sm font-medium">
              <Bell size={16} />
              <span>{notifications.length} notifications</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <Clock size={16} />
            <span className="font-medium">{safeGetBangladeshTime()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Today's Revenue
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{safeFormatBangladeshiTaka(stats.revenue.today)}</div>
            <div className="flex items-center text-sm text-green-600 font-medium">
              <TrendingUp size={14} className="mr-1" />+{stats.revenue.growth}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Orders Today</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.orders.today}</div>
            <div className="text-sm text-gray-500">
              <span className="text-orange-600 font-medium">{stats.orders.pending} pending</span> •
              <span className="text-green-600 font-medium ml-1">{stats.orders.completed} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Total Customers
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.customers.total}</div>
            <div className="text-sm text-gray-500">
              <span className="text-blue-600 font-medium">{stats.customers.new} new</span> this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Reservations Today
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.reservations.today}</div>
            <div className="text-sm text-gray-500">
              <span className="text-purple-600 font-medium">{stats.reservations.upcoming} upcoming</span> this week
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders - Takes 2 columns on xl screens */}
        <Card className="xl:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ShoppingBag size={20} className="text-purple-600" />
                </div>
                Recent Orders
              </CardTitle>
              <Link href="/dashboard/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent font-medium"
                >
                  <Eye size={16} className="mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border">
                          {order.short_order_id || order.id.slice(0, 8)}
                        </span>
                        <Badge className={`${getStatusColor(order.status)} text-xs font-medium border`}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-base font-semibold text-gray-900 mb-1">{order.customer_name}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0
                          ? order.order_items
                              .filter((item) => item && item.item_name)
                              .map((item) => `${item.quantity || 1}x ${item.item_name}`)
                              .join(", ")
                          : "No items"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-purple-600">
                        {safeFormatBangladeshiTaka(order.total_price)}
                      </p>
                      <p className="text-sm text-gray-500">
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
                <div className="text-center py-12 text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingBag size={32} className="opacity-30" />
                  </div>
                  <p className="text-lg font-medium">No recent orders</p>
                  <p className="text-sm">Orders will appear here once customers start placing them.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Plus size={20} className="text-purple-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/dashboard/orders">
                <Button
                  variant="outline"
                  className="h-16 w-full flex items-center gap-4 justify-start hover:bg-purple-50 hover:border-purple-200 bg-transparent border-gray-200 text-left p-4"
                >
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ShoppingBag size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Manage Orders</div>
                    <div className="text-sm text-gray-500">View and update order status</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/reservations">
                <Button
                  variant="outline"
                  className="h-16 w-full flex items-center gap-4 justify-start hover:bg-purple-50 hover:border-purple-200 bg-transparent border-gray-200 text-left p-4"
                >
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Reservations</div>
                    <div className="text-sm text-gray-500">Manage table bookings</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/menu/new">
                <Button
                  variant="outline"
                  className="h-16 w-full flex items-center gap-4 justify-start hover:bg-purple-50 hover:border-purple-200 bg-transparent border-gray-200 text-left p-4"
                >
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Plus size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Add Menu Item</div>
                    <div className="text-sm text-gray-500">Create new menu items</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                <Button
                  variant="outline"
                  className="h-16 w-full flex items-center gap-4 justify-start hover:bg-purple-50 hover:border-purple-200 bg-transparent border-gray-200 text-left p-4"
                >
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">View Analytics</div>
                    <div className="text-sm text-gray-500">Sales and performance data</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
