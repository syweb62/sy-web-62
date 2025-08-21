"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Users, TrendingUp, Calendar, Clock, Bell } from "lucide-react"
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

  const [stats, setStats] = useState<DashboardStats>({
    revenue: { today: 0, thisMonth: 0, growth: 0 },
    orders: { today: 0, pending: 0, completed: 0, total: 0 },
    customers: { total: 0, new: 0 },
    reservations: { today: 0, upcoming: 0 },
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ordersLoading && allOrders.length >= 0) {
      updateDashboardStats(allOrders)
      fetchReservations()
    }
  }, [allOrders, ordersLoading])

  const updateDashboardStats = (orders: Order[]) => {
    try {
      setError(null)
      console.log("[v0] Updating dashboard stats with real-time data...")

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

      setStats((prev) => ({
        ...prev,
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
      }))

      setLoading(false)
    } catch (error) {
      const errorMsg = `Error updating dashboard stats: ${error instanceof Error ? error.message : String(error)}`
      console.error("[v0]", errorMsg)
      setError(errorMsg)
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const reservationsResponse = await fetch("/api/reservations")

      let reservations: Reservation[] = []
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        if (reservationsData.success && Array.isArray(reservationsData.reservations)) {
          reservations = reservationsData.reservations
        }
      }

      const todayReservationsFiltered = reservations.filter((reservation) => {
        try {
          return reservation.date === new Date().toISOString().split("T")[0]
        } catch {
          return false
        }
      })

      const upcomingReservations = reservations.filter((reservation) => {
        try {
          const reservationDate = new Date(reservation.date)
          const today = new Date()
          const weekFromNow = new Date()
          weekFromNow.setDate(today.getDate() + 7)
          return reservationDate >= today && reservationDate <= weekFromNow
        } catch {
          return false
        }
      })

      setTodayReservations(todayReservationsFiltered.slice(0, 5))

      setStats((prev) => ({
        ...prev,
        reservations: {
          today: todayReservationsFiltered.length,
          upcoming: upcomingReservations.length,
        },
      }))
    } catch (error) {
      console.error("[v0] Error fetching reservations:", error)
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

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-white">
        <p className="text-red-400 mb-4">Error loading dashboard: {error}</p>
        <Button onClick={() => updateDashboardStats(allOrders)} variant="outline">
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
          <h1 className="text-3xl font-serif font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-red-900/20 text-red-300 px-3 py-1 rounded-full">
              <Bell size={16} />
              <span className="text-sm">{unreadCount} notifications</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={16} />
            <span>{safeGetBangladeshTime()}</span>
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
            <div className="text-2xl font-bold text-white">{safeFormatBangladeshiTaka(stats.revenue.today)}</div>
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
                        {order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0
                          ? order.order_items
                              .filter((item) => item && item.item_name)
                              .map((item) => `${item.quantity || 1}x ${item.item_name}`)
                              .join(", ")
                          : "No items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold">{safeFormatBangladeshiTaka(order.total_price)}</p>
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
                <div className="text-center py-8 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 bg-transparent"
              onClick={() => router.push("/dashboard/orders")}
            >
              View All Orders
            </Button>
          </CardContent>
        </Card>

        {/* Today's Reservations */}
        <Card className="bg-black/30 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar size={20} />
              Today's Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayReservations.length > 0 ? (
                todayReservations.map((reservation) => (
                  <div
                    key={reservation.reservation_id}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{reservation.name}</span>
                        <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{reservation.phone}</p>
                      <p className="text-xs text-gray-500">
                        {reservation.people_count} guests • Table {reservation.table}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold">{reservation.time}</p>
                      <p className="text-xs text-gray-400">{reservation.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No reservations today</p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 bg-transparent"
              onClick={() => router.push("/dashboard/reservations")}
            >
              View All Reservations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
