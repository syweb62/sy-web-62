"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Trash2, Plus } from "lucide-react"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-12345",
    customer: "John Doe",
    email: "john@example.com",
    items: ["Sushi Platter", "Miso Soup"],
    total: 34.99,
    status: "preparing",
    date: "2024-01-15",
    time: "12:30 PM",
    type: "dine-in",
    paymentMethod: "cash",
  },
  {
    id: "ORD-12346",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    items: ["Teriyaki Salmon", "Green Tea"],
    total: 28.5,
    status: "ready",
    date: "2024-01-15",
    time: "1:15 PM",
    type: "takeout",
    paymentMethod: "bkash",
  },
  {
    id: "ORD-12347",
    customer: "Mike Chen",
    email: "mike@example.com",
    items: ["Ramen Bowl", "Gyoza"],
    total: 24.99,
    status: "delivered",
    date: "2024-01-15",
    time: "11:45 AM",
    type: "delivery",
    paymentMethod: "cash",
  },
  {
    id: "ORD-12348",
    customer: "Emily Davis",
    email: "emily@example.com",
    items: ["Sashimi Set", "Sake"],
    total: 45.99,
    status: "pending",
    date: "2024-01-15",
    time: "2:00 PM",
    type: "dine-in",
    paymentMethod: "pickup",
  },
]

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

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

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesType = typeFilter === "all" || order.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Orders Management</h1>
          <p className="text-gray-400 mt-1">Manage and track all customer orders</p>
        </div>
        <Button className="bg-gold text-black hover:bg-gold/80">
          <Plus size={16} className="mr-2" />
          New Order
        </Button>
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
          <CardTitle className="text-white">Orders ({filteredOrders.length})</CardTitle>
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
                  <TableHead className="text-gray-400">Date & Time</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-gray-800">
                    <TableCell className="font-medium text-white">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{order.customer}</p>
                        <p className="text-gray-400 text-sm">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-300">{order.items.join(", ")}</div>
                    </TableCell>
                    <TableCell className="text-gold font-medium">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(order.type)}>{order.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentMethodColor(order.paymentMethod)}>
                        {order.paymentMethod === "bkash" ? "bKash" : order.paymentMethod === "cash" ? "Cash" : "Pickup"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-300">
                        <p>{order.date}</p>
                        <p className="text-sm text-gray-400">{order.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 bg-transparent">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
