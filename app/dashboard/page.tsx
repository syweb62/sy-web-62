"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Clock,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"
import { useNotifications } from "@/context/notification-context"

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

const getStatusColor = (status: string) => {
  const statusColors = {
    pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    confirmed: "bg-blue-900/50 text-blue-300 border-blue-700",
    preparing: "bg-orange-900/50 text-orange-300 border-orange-700",
    ready: "bg-green-900/50 text-green-300 border-green-700",
    delivered: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    cancelled: "bg-red-900/50 text-red-300 border-red-700",
  }
  return statusColors[status as keyof typeof statusColors] || "bg-gray-900/50 text-gray-300 border-gray-700"
}

interface DashboardStats {
  revenue: {
    today: number
    thisMonth: number
    growth: number
    trend: "up" | "down" | "neutral"
  }
  orders: {
    today: number
    pending: number
    completed: number
    total: number
    cancelled: number
    growth: number
  }
  customers: {
    total: number
    new: number
    returning: number
  }
  reservations: {
    today: number
    upcoming: number
    confirmed: number
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

interface Reservation {
  reservation_id: string
  name: string
  phone: string
  date: string
  time: string
  people_count: number
  status: string
  table: string
  notes: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const { orders: allOrders, loading: ordersLoading } = useRealtimeOrders()
  const { notifications, unreadCount } = useNotifications()

  const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
  const [reservationStats, setReservationStats] = useState({
    today: 0,
    upcoming: 0,
    confirmed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dashboardStats = useMemo(() => {
    if (ordersLoading || !allOrders.length) {
      return {
        revenue: { today: 0, thisMonth: 0, growth: 0, trend: "neutral" as const },
        orders: { today: 0, pending: 0, completed: 0, total: 0, cancelled: 0, growth: 0 },
        customers: { total: 0, new: 0, returning: 0 },
      }
    }

    const safeOrders = allOrders.filter((order) => {
      return order && typeof order === "object" && order.id && typeof order.total_price !== "undefined"
    })

    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

    const ordersByDate = safeOrders.reduce(
      (acc, order: Order) => {
        try {
          const orderDate = new Date(order.created_at).toDateString()
          if (orderDate === today) acc.today.push(order)
          if (orderDate === yesterday) acc.yesterday.push(order)

          // Group by status
          if (order.status === "pending" || order.status === "confirmed") acc.pending.push(order)
          else if (order.status === "delivered") acc.completed.push(order)
          else if (order.status === "cancelled") acc.cancelled.push(order)
        } catch {
          // Skip invalid dates
        }
        return acc
      },
      {
        today: [] as Order[],
        yesterday: [] as Order[],
        pending: [] as Order[],
        completed: [] as Order[],
        cancelled: [] as Order[],
      },
    )

    const todayRevenue = ordersByDate.today.reduce((sum, order) => {
      const price = Number.parseFloat(String(order.total_price)) || 0
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    const yesterdayRevenue = ordersByDate.yesterday.reduce((sum, order) => {
      const price = Number.parseFloat(String(order.total_price)) || 0
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    const totalRevenue = safeOrders.reduce((sum, order) => {
      const price = Number.parseFloat(String(order.total_price)) || 0
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
    const orderGrowth =
      ordersByDate.yesterday.length > 0
        ? ((ordersByDate.today.length - ordersByDate.yesterday.length) / ordersByDate.yesterday.length) * 100
        : 0

    const uniqueCustomers = new Set(
      safeOrders
        .filter((order) => order.customer_name && typeof order.customer_name === "string")
        .map((order: Order) => order.customer_name),
    )

    return {
      revenue: {
        today: todayRevenue,
        thisMonth: totalRevenue,
        growth: revenueGrowth,
        trend: revenueGrowth > 0 ? ("up" as const) : revenueGrowth < 0 ? ("down" as const) : ("neutral" as const),
      },
      orders: {
        today: ordersByDate.today.length,
        pending: ordersByDate.pending.length,
        completed: ordersByDate.completed.length,
        total: safeOrders.length,
        cancelled: ordersByDate.cancelled.length,
        growth: orderGrowth,
      },
      customers: {
        total: uniqueCustomers.size,
        new: Math.floor(uniqueCustomers.size * 0.3),
        returning: Math.floor(uniqueCustomers.size * 0.7),
      },
    }
  }, [allOrders, ordersLoading])

  const recentOrders = useMemo(() => {
    if (!allOrders.length) return []
    return allOrders
      .filter((order) => order && typeof order === "object" && order.id && typeof order.total_price !== "undefined")
      .slice(0, 5)
  }, [allOrders])

  const fetchReservations = useCallback(async () => {
    try {
      const reservationsResponse = await fetch("/api/reservations")
      let reservations: Reservation[] = []

      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        if (reservationsData.success && Array.isArray(reservationsData.reservations)) {
          reservations = reservationsData.reservations
        }
      }

      const today = new Date().toISOString().split("T")[0]
      const todayDate = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(todayDate.getDate() + 7)

      const reservationStats = reservations.reduce(
        (acc, reservation) => {
          try {
            if (reservation.date === today) {
              acc.todayReservations.push(reservation)
              acc.today++
            }

            const reservationDate = new Date(reservation.date)
            if (reservationDate >= todayDate && reservationDate <= weekFromNow) {
              acc.upcoming++
            }

            if (reservation.status === "confirmed") {
              acc.confirmed++
            }
          } catch {
            // Skip invalid dates
          }
          return acc
        },
        {
          todayReservations: [] as Reservation[],
          today: 0,
          upcoming: 0,
          confirmed: 0,
        },
      )

      setTodayReservations(reservationStats.todayReservations.slice(0, 5))
      setReservationStats({
        today: reservationStats.today,
        upcoming: reservationStats.upcoming,
        confirmed: reservationStats.confirmed,
      })
    } catch (error) {
      console.error("[v0] Error fetching reservations:", error)
    }
  }, [])

  useEffect(() => {
    if (!ordersLoading) {
      fetchReservations()
      setLoading(false)
    }
  }, [ordersLoading, fetchReservations])

  const currentTime = useMemo(() => safeGetBangladeshTime(), [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-white">
        <p className="text-red-400 mb-4">Error loading dashboard: {error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-gold text-gold hover:bg-gold hover:text-black"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400 text-lg">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex items-center gap-6">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-red-900/20 text-red-300 px-4 py-2 rounded-full border border-red-800">
              <Bell size={18} />
              <span className="text-sm font-medium">{unreadCount} notifications</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
            <Clock size={16} />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700 hover:border-gold/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Today's Revenue</CardTitle>
            <div className="p-2 bg-gold/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {safeFormatBangladeshiTaka(dashboardStats.revenue.today)}
            </div>
            <div
              className={`flex items-center text-sm ${dashboardStats.revenue.trend === "up" ? "text-green-400" : dashboardStats.revenue.trend === "down" ? "text-red-400" : "text-gray-400"}`}
            >
              {dashboardStats.revenue.trend === "up" ? (
                <ArrowUpRight size={16} className="mr-1" />
              ) : dashboardStats.revenue.trend === "down" ? (
                <ArrowDownRight size={16} className="mr-1" />
              ) : (
                <Activity size={16} className="mr-1" />
              )}
              {Math.abs(dashboardStats.revenue.growth).toFixed(1)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700 hover:border-gold/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Orders Today</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{dashboardStats.orders.today}</div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-yellow-400">{dashboardStats.orders.pending} pending</span>
              <span className="text-green-400">{dashboardStats.orders.completed} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700 hover:border-gold/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Customers</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="h-5 w-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{dashboardStats.customers.total}</div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-blue-400">{dashboardStats.customers.new} new</span>
              <span className="text-gray-400">{dashboardStats.customers.returning} returning</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700 hover:border-gold/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Reservations</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{reservationStats.today}</div>
            <div className="text-xs text-amber-400">{reservationStats.upcoming} upcoming this week</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingBag size={20} className="text-blue-400" />
              </div>
              Recent Orders
              <Badge variant="secondary" className="ml-auto">
                {recentOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors ${index !== recentOrders.length - 1 ? "border-b border-gray-800" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-medium text-gold">
                          #{order.short_order_id || order.id.slice(0, 8)}
                        </span>
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>{order.status}</Badge>
                      </div>
                      <p className="text-sm font-medium text-white">{order.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0
                          ? order.order_items
                              .filter((item) => item && item.item_name)
                              .map((item) => `${item.quantity || 1}x ${item.item_name}`)
                              .join(", ")
                          : "No items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold text-lg">{safeFormatBangladeshiTaka(order.total_price)}</p>
                      <p className="text-xs text-gray-400">
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
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No recent orders</p>
                  <p className="text-sm">Orders will appear here when customers place them</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800">
              <Button
                variant="outline"
                className="w-full bg-transparent border-gold text-gold hover:bg-gold hover:text-black transition-all duration-300"
                onClick={() => router.push("/dashboard/orders")}
              >
                View All Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Reservations */}
        <Card className="bg-gradient-to-br from-black/40 to-black/20 border-gray-700">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar size={20} className="text-purple-400" />
              </div>
              Today's Reservations
              <Badge variant="secondary" className="ml-auto">
                {todayReservations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {todayReservations.length > 0 ? (
                todayReservations.map((reservation, index) => (
                  <div
                    key={reservation.reservation_id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors ${index !== todayReservations.length - 1 ? "border-b border-gray-800" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-white">{reservation.name}</span>
                        <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{reservation.phone}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {reservation.people_count} guests • Table {reservation.table}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold text-lg">{reservation.time}</p>
                      <p className="text-xs text-gray-400">{reservation.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No reservations today</p>
                  <p className="text-sm">Reservations will appear here when customers book tables</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800">
              <Button
                variant="outline"
                className="w-full bg-transparent border-gold text-gold hover:bg-gold hover:text-black transition-all duration-300"
                onClick={() => router.push("/dashboard/reservations")}
              >
                View All Reservations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
