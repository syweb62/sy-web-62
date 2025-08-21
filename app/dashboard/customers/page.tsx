"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, UserCheck, UserX, Phone, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Customer {
  id: string
  email: string
  full_name: string
  phone: string
  address: string
  role: string
  created_at: string
  avatar_url: string
  last_order_date?: string
  total_orders?: number
  total_spent?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      console.log("[v0] Fetching customers from database...")
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          phone,
          address,
          role,
          created_at,
          avatar_url
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching profiles:", error)
        throw error
      }

      console.log("[v0] Fetched profiles:", profiles?.length || 0)

      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from("orders")
              .select("total_price, created_at")
              .eq("user_id", profile.id)
              .order("created_at", { ascending: false })

            if (ordersError) {
              console.warn("[v0] Error fetching orders for customer:", profile.id, ordersError)
            }

            const totalOrders = orders?.length || 0
            const totalSpent = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0
            const lastOrderDate = orders?.[0]?.created_at

            return {
              ...profile,
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrderDate,
            }
          } catch (customerError) {
            console.warn("[v0] Error processing customer stats:", profile.id, customerError)
            return {
              ...profile,
              total_orders: 0,
              total_spent: 0,
              last_order_date: null,
            }
          }
        }),
      )

      console.log("[v0] Processed customers with stats:", customersWithStats.length)
      setCustomers(customersWithStats)
    } catch (error) {
      console.error("[v0] Error in fetchCustomers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (customer: Customer) => {
    const daysSinceLastOrder = customer.last_order_date
      ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    if (!customer.last_order_date) return "bg-gray-900/50 text-gray-300"
    if (daysSinceLastOrder! <= 7) return "bg-green-900/50 text-green-300"
    if (daysSinceLastOrder! <= 30) return "bg-yellow-900/50 text-yellow-300"
    return "bg-red-900/50 text-red-300"
  }

  const getStatusText = (customer: Customer) => {
    const daysSinceLastOrder = customer.last_order_date
      ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    if (!customer.last_order_date) return "New"
    if (daysSinceLastOrder! <= 7) return "Active"
    if (daysSinceLastOrder! <= 30) return "Recent"
    return "Inactive"
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="h-screen w-full space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Customer Management</h1>
          <p className="text-gray-400 mt-1">Manage customer accounts and view their activity</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="text-gold" size={20} />
              <div>
                <p className="text-sm text-gray-400">Total Customers</p>
                <p className="text-xl font-bold text-white">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-400" size={20} />
              <div>
                <p className="text-sm text-gray-400">Active Customers</p>
                <p className="text-xl font-bold text-white">
                  {customers.filter((c) => getStatusText(c) === "Active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserX className="text-red-400" size={20} />
              <div>
                <p className="text-sm text-gray-400">Inactive Customers</p>
                <p className="text-xl font-bold text-white">
                  {customers.filter((c) => getStatusText(c) === "Inactive").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-400" size={20} />
              <div>
                <p className="text-sm text-gray-400">New This Month</p>
                <p className="text-xl font-bold text-white">
                  {customers.filter((c) => new Date(c.created_at).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/30 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Contact</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Orders</TableHead>
                  <TableHead className="text-gray-400">Total Spent</TableHead>
                  <TableHead className="text-gray-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="border-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
                            {customer.avatar_url ? (
                              <img
                                src={customer.avatar_url || "/placeholder.svg"}
                                alt={customer.full_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users size={16} className="text-gold" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{customer.full_name || "N/A"}</p>
                            <p className="text-gray-400 text-sm">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={12} className="text-gray-400" />
                              <span className="text-gray-300">{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin size={12} className="text-gray-400" />
                              <span className="text-gray-300 truncate max-w-32">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(customer)}>{getStatusText(customer)}</Badge>
                      </TableCell>
                      <TableCell className="text-white">{customer.total_orders || 0}</TableCell>
                      <TableCell className="text-gold font-medium">
                        ৳{customer.total_spent?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(customer.created_at).toLocaleDateString()}
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
