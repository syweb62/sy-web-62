"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedOrdersTable } from "@/components/dashboard/enhanced-orders-table"
import { Search, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  short_order_id?: string
  customer: string
  email: string
  items: Array<{ name: string; quantity: number; price: number }>
  total_price: number
  status: string
  created_at: string // Using raw UTC timestamp instead of formatted fields
  order_type: string
  payment_method: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch orders",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log("[v0] Updating order status from orders page:", { orderId, newStatus })

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()
      console.log("[v0] Orders page status update response:", result)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
        await fetchOrders()
      } else {
        throw new Error(result.error || "Failed to update order")
      }
    } catch (error) {
      console.error("[v0] Error updating order from orders page:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, typeFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-900/50 text-gray-300"
      case "preparing":
        return "bg-yellow-900/50 text-yellow-300"
      case "ready":
        return "bg-green-900/50 text-green-300"
      case "delivered":
        return "bg-blue-900/50 text-blue-300"
      case "cancelled":
        return "bg-red-900/50 text-red-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dine-in":
        return "bg-purple-900/50 text-purple-300"
      case "takeout":
        return "bg-orange-900/50 text-orange-300"
      case "delivery":
        return "bg-blue-900/50 text-blue-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "bkash":
        return "bg-pink-900/50 text-pink-300"
      case "cash":
        return "bg-green-900/50 text-green-300"
      case "pickup":
        return "bg-orange-900/50 text-orange-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Orders Management</h1>
          <p className="text-gray-400 mt-1">Manage and track all customer orders (Bangladesh Time)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders} disabled={loading} className="bg-gray-800/50 border-gray-700">
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-gold text-black hover:bg-gold/80">
            <Plus size={16} className="mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-black/30 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search orders by ID, customer, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dine-in">Dine In</SelectItem>
                <SelectItem value="takeout">Takeout</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <EnhancedOrdersTable
        orders={orders}
        loading={loading}
        onRefresh={fetchOrders}
        onStatusUpdate={updateOrderStatus}
      />
    </div>
  )
}
