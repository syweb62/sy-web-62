"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOrdersTable } from "@/components/dashboard/enhanced-orders-table"
import { Search, RefreshCw, Filter, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting")
  const { user } = useAuth()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from("orders")
        .select(`
          order_id,
          short_order_id,
          customer_name,
          phone,
          address,
          payment_method,
          total_price,
          status,
          created_at,
          updated_at,
          order_items (
            item_name,
            quantity,
            price_at_purchase
          )
        `)
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (searchTerm) {
        query = query.or(
          `customer_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,short_order_id.ilike.%${searchTerm}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching orders:", error)
        setConnectionStatus("disconnected")
        throw error
      }

      setOrders(data || [])
      setConnectionStatus("connected")
      console.log("[v0] Orders fetched successfully:", data?.length || 0)
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      setConnectionStatus("disconnected")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time order change detected:", payload)
        setConnectionStatus("connected")
        fetchOrders()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        console.log("[v0] Real-time order items change detected:", payload)
        fetchOrders()
      })
      .subscribe((status) => {
        console.log("[v0] Real-time subscription status:", status)
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected")
        }
      })

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    console.log(`[v0] Status update requested: ${orderId} -> ${newStatus}`)

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.order_id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order,
      ),
    )
  }

  const getUserRole = (): "admin" | "manager" => {
    return user?.role === "admin" ? "admin" : "manager"
  }

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    }
    return stats
  }

  const stats = getOrderStats()

  return (
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-400 uppercase tracking-wide font-medium">Preparing</p>
                <p className="text-2xl font-bold text-orange-400">{stats.preparing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-400 uppercase tracking-wide font-medium">Ready</p>
                <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wide font-medium">Completed</p>
                <p className="text-2xl font-bold text-purple-400">{stats.completed}</p>
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
                  <SelectItem value="preparing" className="text-white">
                    Preparing Orders
                  </SelectItem>
                  <SelectItem value="ready" className="text-white">
                    Ready Orders
                  </SelectItem>
                  <SelectItem value="completed" className="text-white">
                    Completed Orders
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
        orders={orders}
        loading={loading}
        onRefresh={fetchOrders}
        onStatusUpdate={handleStatusUpdate}
        userRole={getUserRole()}
      />
    </div>
  )
}
