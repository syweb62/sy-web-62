"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, ShoppingBag, Users, TrendingUp, Calendar, Clock } from "lucide-react"

// Mock data - in a real app, this would come from your backend
const dashboardData = {
  revenue: {
    today: 2847.5,
    thisMonth: 45230.8,
    growth: 12.5,
  },
  orders: {
    today: 23,
    pending: 5,
    completed: 18,
    total: 1247,
  },
  customers: {
    total: 892,
    new: 12,
    returning: 78,
  },
  reservations: {
    today: 15,
    upcoming: 32,
  },
}

const recentOrders = [
  {
    id: "ORD-12345",
    customer: "John Doe",
    items: ["Sushi Platter", "Miso Soup"],
    total: 34.99,
    status: "preparing",
    time: "10 mins ago",
  },
  {
    id: "ORD-12346",
    customer: "Sarah Johnson",
    items: ["Teriyaki Salmon", "Green Tea"],
    total: 28.5,
    status: "ready",
    time: "15 mins ago",
  },
  {
    id: "ORD-12347",
    customer: "Mike Chen",
    items: ["Ramen Bowl", "Gyoza"],
    total: 24.99,
    status: "delivered",
    time: "25 mins ago",
  },
]

const upcomingReservations = [
  {
    id: "RES-001",
    customer: "Emily Davis",
    time: "7:30 PM",
    guests: 4,
    table: "Table 12",
  },
  {
    id: "RES-002",
    customer: "Robert Wilson",
    time: "8:00 PM",
    guests: 2,
    table: "Table 5",
  },
  {
    id: "RES-003",
    customer: "Lisa Anderson",
    time: "8:30 PM",
    guests: 6,
    table: "Table 8",
  },
]

export default function Dashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-yellow-900/50 text-yellow-300"
      case "ready":
        return "bg-green-900/50 text-green-300"
      case "delivered":
        return "bg-blue-900/50 text-blue-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening at Sushi Yaki today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
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
            <div className="text-2xl font-bold text-white">${dashboardData.revenue.today.toFixed(2)}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <TrendingUp size={12} className="mr-1" />+{dashboardData.revenue.growth}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Orders Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardData.orders.today}</div>
            <div className="text-xs text-gray-400 mt-1">
              {dashboardData.orders.pending} pending • {dashboardData.orders.completed} completed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardData.customers.total}</div>
            <div className="text-xs text-gray-400 mt-1">{dashboardData.customers.new} new this week</div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Reservations Today</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboardData.reservations.today}</div>
            <div className="text-xs text-gray-400 mt-1">{dashboardData.reservations.upcoming} upcoming this week</div>
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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{order.id}</span>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-400">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.items.join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold">${order.total}</p>
                    <p className="text-xs text-gray-400">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
              {upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{reservation.customer}</span>
                      <Badge variant="outline" className="text-xs">
                        {reservation.guests} guests
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{reservation.table}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold">{reservation.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <ShoppingBag size={20} />
              <span>New Order</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar size={20} />
              <span>Add Reservation</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users size={20} />
              <span>Add Customer</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 size={20} />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
