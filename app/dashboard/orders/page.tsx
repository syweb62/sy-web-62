"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TimeBD } from "@/components/TimeBD"

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
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
        fetchOrders() // Refresh the list
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update order",
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
                  placeholder="Search orders by ID, customer, or email..."
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
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Orders ({orders.length}) {loading && <span className="text-sm text-gray-400">- Loading...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Order ID</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Items</TableHead>
                  <TableHead className="text-gray-400">Total</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Payment</TableHead>
                  <TableHead className="text-gray-400">Date & Time (BD)</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="border-gray-800">
                      <TableCell className="font-medium text-white">
                        {(order as any).short_order_id || order.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{order.customer}</p>
                          <p className="text-gray-400 text-sm">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-300">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-gold font-medium">
                        ৳{order.total_price?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(order.order_type)}>{order.order_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(order.payment_method)}>
                          {order.payment_method === "bkash"
                            ? "bKash"
                            : order.payment_method === "cash"
                              ? "Cash"
                              : order.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TimeBD iso={order.created_at} className="text-gray-300" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye size={14} />
                          </Button>
                          <Select onValueChange={(value) => updateOrderStatus(order.id, value)}>
                            <SelectTrigger className="w-20 h-8">
                              <Edit size={14} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
