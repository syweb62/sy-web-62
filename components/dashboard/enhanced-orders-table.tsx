"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Eye,
  Printer,
  Search,
  RefreshCw,
  Download,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Clock,
  User,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Order {
  order_id: string
  short_order_id: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  total_price: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  created_at: string
  order_items: Array<{
    item_name: string
    quantity: number
    price_at_purchase: number
  }>
}

interface EnhancedOrdersTableProps {
  orders?: Order[]
  loading?: boolean
  onRefresh?: () => void
  onStatusUpdate?: (orderId: string, status: string) => void
}

interface FilterState {
  search: string
  status: string
  dateRange: string
  paymentMethod: string
}

export function EnhancedOrdersTable({
  orders: propOrders,
  loading: propLoading,
  onRefresh,
  onStatusUpdate,
}: EnhancedOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    dateRange: "today",
    paymentMethod: "all",
  })
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sortBy, setSortBy] = useState<"created_at" | "total_price" | "status">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase.from("orders").select(`
          order_id,
          short_order_id,
          customer_name,
          phone,
          address,
          payment_method,
          total_price,
          status,
          created_at,
          order_items (
            item_name,
            quantity,
            price_at_purchase
          )
        `)

      if (filters.dateRange === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte("created_at", today.toISOString())
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte("created_at", weekAgo.toISOString())
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status)
      }

      if (filters.paymentMethod !== "all") {
        query = query.eq("payment_method", filters.paymentMethod)
      }

      query = query.order(sortBy, { ascending: sortOrder === "asc" })

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      if (typeof window !== "undefined") {
        const errorMsg = error instanceof Error ? error.message : "Failed to fetch orders"
        alert(`Error loading orders: ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.short_order_id.toLowerCase().includes(searchLower) ||
          order.customer_name.toLowerCase().includes(searchLower) ||
          order.phone.includes(filters.search) ||
          order.address.toLowerCase().includes(searchLower) ||
          order.order_items.some((item) => item.item_name.toLowerCase().includes(searchLower)),
      )
    }

    return filtered
  }, [orders, filters.search])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  useEffect(() => {
    if (!propOrders) {
      fetchOrders()
    } else {
      setOrders(propOrders)
      setLoading(propLoading || false)
    }
  }, [propOrders, propLoading, fetchOrders])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev }
        let hasOverdueOrders = false

        orders.forEach((order) => {
          if (order.status === "preparing" || order.status === "ready") {
            const created = new Date(order.created_at)
            const now = new Date()
            const twentyMinutes = 20 * 60 * 1000
            const elapsed = now.getTime() - created.getTime()
            const remaining = twentyMinutes - elapsed
            newTimers[order.order_id] = remaining

            if (remaining <= 0 && prev[order.order_id] > 0 && soundEnabled) {
              hasOverdueOrders = true
            }
          } else {
            delete newTimers[order.order_id]
          }
        })

        if (hasOverdueOrders && typeof window !== "undefined") {
          try {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
            )
            audio.play().catch(() => {})
          } catch (e) {}
        }

        return newTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [orders, soundEnabled])

  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel("enhanced-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] Real-time order change detected:", payload)

        if (payload.eventType === "INSERT" && soundEnabled) {
          try {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
            )
            audio.play().catch(() => {})
          } catch (e) {}
        }

        if (!propOrders) {
          fetchOrders()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [propOrders, fetchOrders, soundEnabled])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log("[v0] Updating order status:", orderId, "to", newStatus)

      setOrders((prev) =>
        prev.map((order) => (order.order_id === orderId ? { ...order, status: newStatus as any } : order)),
      )

      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("order_id", orderId)

      if (error) {
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? { ...order, status: orders.find((o) => o.order_id === orderId)?.status || (newStatus as any) }
              : order,
          ),
        )
        throw error
      }

      if (newStatus === "completed") {
        setTimers((prev) => {
          const newTimers = { ...prev }
          delete newTimers[orderId]
          return newTimers
        })
      }

      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus)
      }

      console.log("[v0] Order status updated successfully")
    } catch (error) {
      console.error("[v0] Error updating order status:", error)
      alert("Failed to update order status. Please try again.")
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) return

    try {
      const supabase = createClient()
      const orderIds = Array.from(selectedOrders)

      const { error } = await supabase.from("orders").update({ status: newStatus }).in("order_id", orderIds)

      if (error) throw error

      setOrders((prev) =>
        prev.map((order) => (selectedOrders.has(order.order_id) ? { ...order, status: newStatus as any } : order)),
      )

      setSelectedOrders(new Set())
      alert(`Successfully updated ${orderIds.length} orders to ${newStatus}`)
    } catch (error) {
      console.error("[v0] Error updating bulk orders:", error)
      alert("Failed to update orders. Please try again.")
    }
  }

  const handleExportOrders = () => {
    const csvContent = [
      ["Order ID", "Customer", "Phone", "Address", "Items", "Total", "Status", "Date", "Payment Method"],
      ...filteredOrders.map((order) => [
        order.short_order_id,
        order.customer_name,
        order.phone,
        order.address,
        order.order_items.map((item) => `${item.item_name} x${item.quantity}`).join("; "),
        order.total_price.toString(),
        order.status,
        new Date(order.created_at).toLocaleDateString(),
        order.payment_method,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "r":
            e.preventDefault()
            fetchOrders()
            break
          case "e":
            e.preventDefault()
            handleExportOrders()
            break
          case "a":
            e.preventDefault()
            if (selectedOrders.size === filteredOrders.length) {
              setSelectedOrders(new Set())
            } else {
              setSelectedOrders(new Set(filteredOrders.map((o) => o.order_id)))
            }
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [fetchOrders, selectedOrders, filteredOrders])

  const formatTimer = (orderId: string) => {
    const remaining = timers[orderId] || 0

    if (remaining <= 0) {
      const overdue = Math.abs(remaining)
      const minutes = Math.floor(overdue / 60000)
      const seconds = Math.floor((overdue % 60000) / 1000)
      return {
        display: `-${minutes}:${seconds.toString().padStart(2, "0")}`,
        color: "text-red-400",
      }
    }

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return {
      display: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      color: remaining < 300000 ? "text-yellow-400" : "text-green-400",
    }
  }

  const handlePrint = (order: Order) => {
    const printContent = `
SUSHI YAKI RESTAURANT
=====================
Order ID: ${order.short_order_id}
Date: ${new Date(order.created_at).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}

Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}
Payment: ${order.payment_method}

ITEMS:
${order.order_items
  .map((item) => `${item.item_name} x${item.quantity} - BDT ${(item.price_at_purchase * item.quantity).toFixed(0)}`)
  .join("\n")}

=====================
TOTAL: BDT ${order.total_price.toFixed(0)}
=====================
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order ${order.order_id}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleViewOrder = (order: Order) => {
    window.open(`/dashboard/orders/${order.order_id}`, "_blank")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Preparing</Badge>
      case "ready":
        return <Badge className="bg-pink-500 text-white hover:bg-pink-600">Ready</Badge>
      case "completed":
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Completed</Badge>
      case "pending":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Pending</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{status}</Badge>
    }
  }

  const getStatusDropdown = (order: Order) => {
    const statusColor =
      {
        preparing: "bg-orange-500 text-white",
        ready: "bg-pink-500 text-white",
        completed: "bg-gray-500 text-white",
        pending: "bg-blue-500 text-white",
      }[order.status] || "bg-gray-500 text-white"

    return (
      <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.order_id, value)}>
        <SelectTrigger className={`w-32 ${statusColor} border-none`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          <SelectItem value="pending" className="text-white hover:bg-blue-500">
            🔵 Pending
          </SelectItem>
          <SelectItem value="preparing" className="text-white hover:bg-orange-500">
            🟠 Preparing
          </SelectItem>
          <SelectItem value="ready" className="text-white hover:bg-pink-500">
            🟣 Ready
          </SelectItem>
          <SelectItem value="completed" className="text-white hover:bg-gray-500">
            ✅ Completed
          </SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Package className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Orders Management</h2>
              <p className="text-gray-400 text-sm">{filteredOrders.length} orders found</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchOrders()}
              className="bg-gray-700/50 hover:bg-gray-600 text-white border border-gray-600 transition-all duration-200"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExportOrders}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all duration-200"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`${soundEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-gray-700/50 text-gray-400 border-gray-600"} hover:opacity-80 transition-all duration-200`}
              size="sm"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders, customers, items..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl"
            />
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedOrders.size > 0 && (
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-amber-300 font-medium">{selectedOrders.size} orders selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("preparing")}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-lg"
                >
                  Mark Preparing
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("ready")}
                  className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-lg"
                >
                  Mark Ready
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("completed")}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg"
                >
                  Mark Completed
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                  className="bg-gray-700/50 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Package className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Orders Management</h2>
              <p className="text-gray-400 text-sm">{filteredOrders.length} orders found</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchOrders()}
              className="bg-gray-700/50 hover:bg-gray-600 text-white border border-gray-600 transition-all duration-200"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExportOrders}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all duration-200"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`${soundEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-gray-700/50 text-gray-400 border-gray-600"} hover:opacity-80 transition-all duration-200`}
              size="sm"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders, customers, items..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl"
            />
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedOrders.size > 0 && (
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-amber-300 font-medium">{selectedOrders.size} orders selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("preparing")}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-lg"
                >
                  Mark Preparing
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("ready")}
                  className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-lg"
                >
                  Mark Ready
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("completed")}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg"
                >
                  Mark Completed
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                  className="bg-gray-700/50 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {paginatedOrders.map((order) => {
          const timer = formatTimer(order.order_id)
          const isSelected = selectedOrders.has(order.order_id)

          return (
            <div
              key={order.order_id}
              className={`relative bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 ${
                isSelected
                  ? "border-amber-500/50 bg-gradient-to-r from-amber-500/5 to-amber-600/5 shadow-lg shadow-amber-500/10"
                  : "border-gray-700/50 hover:border-gray-600/50"
              }`}
            >
              {(order.status === "preparing" || order.status === "ready") && (
                <div
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-mono font-bold ${
                    timer.color === "text-red-400"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : timer.color === "text-yellow-400"
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-300 border border-green-500/30"
                  }`}
                >
                  <Clock className="inline h-3 w-3 mr-1" />
                  {timer.display}
                </div>
              )}

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-2 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSelected = new Set(selectedOrders)
                        if (isSelected) {
                          newSelected.delete(order.order_id)
                        } else {
                          newSelected.add(order.order_id)
                        }
                        setSelectedOrders(newSelected)
                      }}
                      className="p-1 h-auto text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4 text-amber-400" /> : <Square className="h-4 w-4" />}
                    </Button>
                    <div>
                      <div className="font-mono text-lg font-bold text-white">{order.short_order_id}</div>
                      <div className="text-xs text-gray-400">Order ID</div>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-400" />
                        <span className="font-medium text-white">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>📱 {order.phone}</div>
                        <div>💳 {order.payment_method}</div>
                        <div className="truncate" title={order.address}>
                          📍 {order.address}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-gray-300">Items</span>
                    </div>
                    <div className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-300 bg-gray-800/50 px-2 py-1 rounded-lg">
                          {item.item_name} <span className="text-amber-400 font-medium">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-gray-300">Total</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      ৳{order.total_price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="text-sm font-medium text-gray-300 mb-2">Status</div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-gray-300">Date & Time</span>
                    </div>
                    <div className="text-sm text-white">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                        title="View Order Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(order)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                        title="Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2">{getStatusDropdown(order)}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="text-white font-medium">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{" "}
              of <span className="text-white font-medium">{filteredOrders.length}</span> orders
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-700/50 hover:bg-gray-600 text-white border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                size="sm"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Page</span>
                <span className="text-sm font-medium text-white bg-amber-500/20 px-2 py-1 rounded-lg">
                  {currentPage}
                </span>
                <span className="text-sm text-gray-400">of {totalPages}</span>
              </div>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-700/50 hover:bg-gray-600 text-white border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 border border-gray-700/50 text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Orders Found</h3>
          <p className="text-gray-400 mb-4">
            {filters.search || filters.status !== "all" || filters.dateRange !== "all"
              ? "Try adjusting your filters to see more results"
              : "Orders will appear here once customers start placing them"}
          </p>
          {(filters.search || filters.status !== "all" || filters.dateRange !== "all") && (
            <Button
              onClick={() => setFilters({ search: "", status: "all", dateRange: "today", paymentMethod: "all" })}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      <div className="text-center">
        <div className="inline-flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50 text-xs text-gray-400">
          <span>⌘R Refresh</span>
          <span>⌘E Export</span>
          <span>⌘A Select All</span>
        </div>
      </div>
    </div>
  )
}
