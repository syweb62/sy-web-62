"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, ShoppingBag, Users, TrendingUp, Calendar, Clock, Bell } from "lucide-react"
import { useNotificationSystem } from "@/hooks/use-notification-system"
import { formatBangladeshiTaka, getBangladeshTime } from "@/lib/bangladesh-utils"

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
  const { notifications } = useNotificationSystem()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const ordersResponse = await fetch("/api/orders")
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = Array.isArray(ordersData) ? ordersData : []
        console.log("[v0] Dashboard orders data:", orders.length, "orders")

        setRecentOrders(orders.slice(0, 5)) // Show latest 5 orders

        const today = new Date().toDateString()
        const todayOrders = orders.filter((order: Order) => new Date(order.created_at).toDateString() === today)

        const pendingOrders = orders.filter(
          (order: Order) => order.status === "pending" || order.status === "confirmed",
        )

        const completedOrders = orders.filter((order: Order) => order.status === "delivered")

        const todayRevenue = todayOrders.reduce((sum: number, order: Order) => sum + (order.total_price || 0), 0)

        setStats({
          revenue: {
            today: todayRevenue,
            thisMonth: orders.reduce((sum: number, order: Order) => sum + (order.total_price || 0), 0),
            growth: 12.5, // This would be calculated based on historical data
          },
          orders: {
            today: todayOrders.length,
            pending: pendingOrders.length,
            completed: completedOrders.length,
            total: orders.length,
          },
          customers: {
            total: new Set(orders.filter((order) => order.customer_name).map((order: Order) => order.customer_name))
              .size,
            new: 5, // This would come from user registration data
          },
          reservations: {
            today: 0, // This would come from reservations API
            upcoming: 0,
          },
        })
      } else {
        console.error("[v0] Failed to fetch orders:", ordersResponse.status)
        setRecentOrders([])
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/50 text-yellow-300"
      case "confirmed":
        return "bg-blue-900/50 text-blue-300"
      case "preparing":
        return "bg-orange-900/50 text-orange-300"
      case "ready":
        return "bg-green-900/50 text-green-300"
      case "delivered":
        return "bg-gray-900/50 text-gray-300"
      case "cancelled":
        return "bg-red-900/50 text-red-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 bg-red-900/20 text-red-300 px-3 py-1 rounded-full">
              <Bell size={16} />
              <span className="text-sm">{notifications.length} notifications</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={16} />
            <span>{getBangladeshTime()}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBangladeshiTaka(stats.revenue.today)}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <TrendingUp size={12} className="mr-1" />+{stats.revenue.growth}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Orders Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.orders.today}</div>
            <div className="text-xs text-gray-400 mt-1">
              {stats.orders.pending} pending • {stats.orders.completed} completed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.customers.total}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.customers.new} new this week</div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Reservations Today</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.reservations.today}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.reservations.upcoming} upcoming this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-black/30 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingBag size={20} />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white font-mono">
                          {order.short_order_id || order.id.slice(0, 8)}
                        </span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {Array.isArray(order.order_items)
                          ? order.order_items.map((item) => `${item.quantity}x ${item.item_name}`).join(", ")
                          : "No items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold">{formatBangladeshiTaka(order.total_price)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString("en-US", {
                          timeZone: "Asia/Dhaka",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View All Orders
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Reservations */}
        <Card className="bg-black/30 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar size={20} />
              Today's Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Fetch real reservations data from API */}
              {/* Placeholder for upcoming reservations data */}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View All Reservations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <ShoppingBag size={20} />
              <span>New Order</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Calendar size={20} />
              <span>Add Reservation</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Users size={20} />
              <span>Add Customer</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <BarChart3 size={20} />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
