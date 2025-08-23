"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOrdersTable } from "@/components/dashboard/enhanced-orders-table"
import { DashboardHeader } from "@/components/dashboard-header"
import { Search, RefreshCw, Filter, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"

export default function OrdersPage() {
  const { orders, loading, connectionStatus, refetch: fetchOrders } = useRealtimeOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { user } = useAuth()

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesSearch =
      searchTerm === "" ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm) ||
      order.short_order_id?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    console.log(`[v0] Status update requested: ${orderId} -> ${newStatus}`)
    // Real-time updates will handle the state changes automatically
  }

  const getUserRole = (): "admin" | "manager" => {
    return user?.role === "admin" ? "admin" : "manager"
  }

  const getOrderStats = () => {
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    }
    return stats
  }

  const stats = getOrderStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <DashboardHeader connectionStatus={connectionStatus} />

      <div className="space-y-8 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Orders Management</h1>
            <p className="text-gray-400 text-lg">Monitor and manage all customer orders in real-time</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500 animate-pulse"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  connectionStatus === "connected"
                    ? "text-green-400"
                    : connectionStatus === "connecting"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {connectionStatus === "connected"
                  ? "Real-time Active"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Connection Lost"}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={fetchOrders}
              disabled={loading}
              className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900/40 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wide font-medium">Pending</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 uppercase tracking-wide font-medium">Confirmed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400 uppercase tracking-wide font-medium">Cancelled</p>
                  <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/40 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search by order ID, customer name, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-12"
                  />
                </div>
              </div>

              <div className="lg:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all" className="text-white">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="pending" className="text-white">
                      Pending Orders
                    </SelectItem>
                    <SelectItem value="confirmed" className="text-white">
                      Confirmed Orders
                    </SelectItem>
                    <SelectItem value="cancelled" className="text-white">
                      Cancelled Orders
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Orders Table */}
        <EnhancedOrdersTable
          orders={filteredOrders}
          loading={loading}
          onRefresh={fetchOrders}
          onStatusUpdate={handleStatusUpdate}
          userRole={getUserRole()}
        />
      </div>
    </div>
  )
}
