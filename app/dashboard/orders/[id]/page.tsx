"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Phone, MapPin, CreditCard, MessageSquare, Clock, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { TimeBD } from "@/components/TimeBD"

interface OrderDetails {
  order_id: string
  short_order_id: string
  customer_name: string
  phone: string
  address: string
  total_price: number
  subtotal: number
  vat: number
  delivery_charge: number
  discount: number
  status: string
  payment_method: string
  message: string
  created_at: string
  order_items: Array<{
    item_name: string
    item_description: string
    item_image: string
    item_price: number
    quantity: number
    price_at_purchase: number
  }>
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails(params.id as string)
    }
  }, [params.id])

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("order_id", orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
      router.push("/dashboard/orders")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.order_id, status: newStatus }),
      })

      if (response.ok) {
        setOrder({ ...order, status: newStatus })
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      } else {
        throw new Error("Failed to update order")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Order not found</p>
        <Link href="/dashboard/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-white">Order Details</h1>
          <p className="text-gray-400 mt-1">Order #{order.short_order_id || order.order_id}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
          <Select onValueChange={updateOrderStatus} disabled={updating}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700">
              <SelectValue placeholder="Update Status" />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{item.item_name}</h3>
                    <p className="text-sm text-gray-400">{item.item_description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-300">Qty: {item.quantity}</span>
                      <span className="text-sm text-gold">Tk{item.price_at_purchase}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold">Tk{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Customer Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User size={20} />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-white font-medium">{order.customer_name || "Guest"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <p className="text-gray-300">{order.phone}</p>
              </div>
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-1" />
                  <p className="text-gray-300">{order.address}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <TimeBD iso={order.created_at} className="text-gray-300" />
              </div>
            </CardContent>
          </Card>

          {/* Payment & Order Summary */}
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard size={20} />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">Tk{order.subtotal.toFixed(2)}</span>
              </div>
              {order.vat > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">VAT:</span>
                  <span className="text-white">Tk{order.vat.toFixed(2)}</span>
                </div>
              )}
              {order.delivery_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery:</span>
                  <span className="text-white">Tk{order.delivery_charge.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount:</span>
                  <span className="text-green-400">-Tk{order.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="bg-gray-700" />
              <div className="flex justify-between text-lg font-medium">
                <span className="text-white">Total:</span>
                <span className="text-gold">Tk{order.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Method:</span>
                <Badge className="bg-green-900/50 text-green-300">
                  {order.payment_method === "bkash" ? "bKash" : order.payment_method}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {order.message && (
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare size={20} />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{order.message}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
