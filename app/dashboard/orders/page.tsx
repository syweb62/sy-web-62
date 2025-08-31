"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOrdersTable } from "@/components/dashboard/enhanced-orders-table"
import SimpleOrdersTable from "@/components/simple-orders-table"
import { Search, RefreshCw, Filter, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

console.log("[v0] ========== DASHBOARD ORDERS PAGE LOADING ==========")
console.log("[v0] Page load time:", new Date().toISOString())
console.log("[v0] Window location:", typeof window !== "undefined" ? window.location.href : "SSR")

function SimplifiedOrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch orders
  const fetchOrders = async () => {
    console.log("[v0] 📦 Fetching orders...")
    const { data, error } = await supabase.from("orders").select("*").order("id", { ascending: false })
    if (!error) {
      setOrders(data || [])
      console.log("[v0] ✅ Orders fetched:", data?.length || 0)
    } else {
      console.error("[v0] ❌ Error fetching orders:", error)
    }
    setLoading(false)
  }

  // Update order status
  const updateOrder = async (id: string, status: string) => {
    try {
      console.log("[v0] 🔄 Updating order:", { id, status })

      const res = await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed")
      }

      console.log("[v0] ✅ Order updated successfully")
      toast.success(`✅ Order ${status} successfully!`)
      fetchOrders() // refresh immediately
    } catch (err) {
      console.error("[v0] ❌ Update order failed:", err)
      toast.error("Failed to update order")
    }
  }

  // Realtime listener
  useEffect(() => {
    console.log("[v0] 🚀 Setting up simplified dashboard...")
    fetchOrders()

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] 🔔 Realtime event received:", payload)
        fetchOrders()
        toast.info(`Order ${payload.new?.id} status changed to ${payload.new?.status}`)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return <div className="p-6 text-white">Loading orders...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4 text-white">📦 Orders Dashboard (Simplified)</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between border border-gray-700 p-4 rounded-xl shadow-sm bg-gray-800"
          >
            <div>
              <p className="font-medium text-white">Order #{order.id}</p>
              <p className="text-sm text-gray-400">Status: {order.status}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updateOrder(order.id, "confirmed")} className="bg-green-500 hover:bg-green-600">
                Confirm
              </Button>
              <Button onClick={() => updateOrder(order.id, "canceled")} className="bg-red-500 hover:bg-red-600">
                Cancel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  console.log("[v0] ========== DASHBOARD ORDERS PAGE COMPONENT FUNCTION ==========")
  console.log("[v0] Component render time:", new Date().toISOString())

  const { orders, loading, connectionStatus, refetch: fetchOrders } = useRealtimeOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [useSimpleTable, setUseSimpleTable] = useState(false)
  const [useSimplifiedDashboard, setUseSimplifiedDashboard] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    console.log("[v0] ========== DASHBOARD PAGE MOUNTED ==========")
    console.log("[v0] Orders count:", orders.length)
    console.log("[v0] Loading:", loading)
    console.log("[v0] Connection status:", connectionStatus)
    console.log("[v0] User:", user?.email || "No user")
    if (orders.length > 0) {
      console.log("[v0] Sample order:", orders[0])
    }
    console.log("✅ Dashboard Orders Page Loaded")
  }, [orders, loading, connectionStatus, user])

  if (useSimplifiedDashboard) {
    return <SimplifiedOrdersDashboard />
  }

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
    console.log(`[v0] Dashboard: Status update requested: ${orderId} -> ${newStatus}`)
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

  console.log("[v0] About to render EnhancedOrdersTable with:")
  console.log("[v0] - filteredOrders:", filteredOrders.length)
  console.log("[v0] - loading:", loading)
  console.log("[v0] - fetchOrders function:", typeof fetchOrders)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="space-y-8 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => {
              console.log("[v0] ========== DASHBOARD TEST BUTTON CLICKED ==========")
              console.log("[v0] Current time:", new Date().toISOString())
              console.log("[v0] Orders available:", orders.length)
              alert("✅ Dashboard page is working! Orders: " + orders.length)
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            TEST DASHBOARD ({orders.length} orders)
          </Button>

          <Button
            onClick={async () => {
              console.log("[v0] ========== API TEST BUTTON CLICKED ==========")
              try {
                const response = await fetch("/api/orders")
                const data = await response.json()
                console.log("[v0] API test response:", data)
                alert("✅ API working! Orders: " + (data.orders?.length || 0))
              } catch (error) {
                console.log("[v0] API test error:", error)
                alert("❌ API error: " + error)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            TEST API
          </Button>

          <Button onClick={() => setUseSimpleTable(!useSimpleTable)} className="bg-orange-600 hover:bg-orange-700">
            {useSimpleTable ? "Use Enhanced Table" : "Use Simple Table"}
          </Button>

          <Button
            onClick={() => setUseSimplifiedDashboard(!useSimplifiedDashboard)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Use Simplified Dashboard
          </Button>
        </div>

        {useSimpleTable ? (
          <SimpleOrdersTable />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white">Orders Management</h1>
                <p className="text-gray-400 text-lg">Monitor and manage all customer orders in real-time</p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("[v0] ========== REFRESH BUTTON CLICKED ==========")
                    fetchOrders()
                  }}
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
            {console.log("[v0] ========== RENDERING ENHANCED ORDERS TABLE ==========")}
            <EnhancedOrdersTable
              orders={filteredOrders}
              loading={loading}
              onRefresh={fetchOrders}
              onStatusUpdate={handleStatusUpdate}
              userRole={getUserRole()}
            />
            {console.log("[v0] ========== ENHANCED ORDERS TABLE RENDERED ==========")}
          </>
        )}
      </div>
    </div>
  )
}
