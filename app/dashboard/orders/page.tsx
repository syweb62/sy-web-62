"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOrdersTable } from "@/components/dashboard/enhanced-orders-table"
import { Search, RefreshCw } from "lucide-react"
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

        // Refresh orders on any change
        fetchOrders()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        console.log("[v0] Real-time order items change detected:", payload)

        // Refresh orders when items change
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

    // Optimistically update local state
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.order_id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order,
      ),
    )
  }

  const getUserRole = (): "admin" | "manager" => {
    return user?.role === "admin" ? "admin" : "manager"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders Management</h1>
          <p className="text-gray-400 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
            ></div>
            <span
              className={
                connectionStatus === "connected"
                  ? "text-green-400"
                  : connectionStatus === "connecting"
                    ? "text-yellow-400"
                    : "text-red-400"
              }
            >
              {connectionStatus === "connected"
                ? "Real-time Connected"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search orders by ID, customer, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-white">
                  All Statuses
                </SelectItem>
                <SelectItem value="pending" className="text-white">
                  Pending
                </SelectItem>
                <SelectItem value="preparing" className="text-white">
                  Preparing
                </SelectItem>
                <SelectItem value="ready" className="text-white">
                  Ready
                </SelectItem>
                <SelectItem value="completed" className="text-white">
                  Completed
                </SelectItem>
                <SelectItem value="cancelled" className="text-white">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
