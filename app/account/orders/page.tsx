"use client"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search, Filter, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LoadingSpinner from "@/components/loading-spinner"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { InvoiceButton } from "@/components/invoice-button"
import { useOrderHistory, type OrderHistoryItem } from "@/hooks/use-order-history"
import { useCart } from "@/hooks/use-cart"
import { TimeBD } from "@/components/TimeBD"
import { useAuth } from "@/hooks/use-auth"

function money(n?: number) {
  const v = typeof n === "number" && isFinite(n) ? n : 0
  return v.toFixed(2)
}
function parseDate(value?: string) {
  if (!value) return undefined
  const d = new Date(value)
  if (isNaN(d.getTime())) return undefined
  return d
}

export default function OrdersPage() {
  const router = useRouter()
  const cart = useCart()
  const { user, loading: authLoading } = useAuth()
  const { orders, loading, error, refetch } = useOrderHistory()

  // Filters
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")

  const filtered: OrderHistoryItem[] = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []
    console.log("[v0] Filtering orders, total count:", list.length)
    const fromDate = parseDate(from)
    const toDate = parseDate(to)
    return list.filter((o) => {
      if (status !== "all" && o.status !== status) return false

      const created = new Date(o.created_at)
      if (fromDate && created < fromDate) return false
      if (toDate) {
        const toEnd = new Date(toDate)
        toEnd.setHours(23, 59, 59, 999)
        if (created > toEnd) return false
      }

      if (q.trim()) {
        const term = q.toLowerCase()
        const idMatch = o.order_id.toLowerCase().includes(term)
        const shortIdMatch = o.short_order_id?.toLowerCase().includes(term)
        const nameMatch = o.customer_name?.toLowerCase().includes(term)
        const itemMatch = (Array.isArray(o.items) ? o.items : []).some((it) =>
          it.product_name?.toLowerCase().includes(term),
        )
        if (!idMatch && !shortIdMatch && !nameMatch && !itemMatch) return false
      }
      return true
    })
  }, [orders, q, status, from, to])

  // Pagination (simple, client-side)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleReorder = (order: OrderHistoryItem) => {
    const items = Array.isArray(order.items) ? order.items : []
    if (!items.length) return
    if (cart && typeof cart.addItem === "function") {
      for (const it of items) {
        cart.addItem({
          id: it.id || `${order.order_id}-${Math.random().toString(36).slice(2)}`,
          name: it.product_name || "Item", // Updated field name
          price: typeof it.price === "number" ? it.price : 0, // Updated field name
          quantity: typeof it.quantity === "number" ? it.quantity : 1,
          image: "/sushi-thumbnail.png", // Default image since item_image doesn't exist
          notes: "", // Notes field doesn't exist in current schema
        })
      }
      try {
        router.push("/cart")
      } catch {}
    } else {
      console.warn("Cart addItem is not available; reorder is a no-op.")
      alert("Reorder is not available in this preview.")
    }
  }

  useEffect(() => {
    const handleOrderStatusChange = (event: CustomEvent) => {
      console.log("[v0] Order status changed event received:", event.detail)
      console.log("[v0] Event type:", event.type)
      console.log("[v0] Current window location:", window.location.href)

      // Refresh order history when status changes
      refetch()
    }

    console.log("[v0] Setting up orderStatusChanged event listener")
    window.addEventListener("orderStatusChanged", handleOrderStatusChange as EventListener)

    const handleOrderUpdated = (event: CustomEvent) => {
      console.log("[v0] Order updated event received:", event.detail)
      refetch()
    }

    window.addEventListener("orderUpdated", handleOrderUpdated as EventListener)

    return () => {
      console.log("[v0] Cleaning up event listeners")
      window.removeEventListener("orderStatusChanged", handleOrderStatusChange as EventListener)
      window.removeEventListener("orderUpdated", handleOrderUpdated as EventListener)
    }
  }, [refetch])

  if (authLoading || loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-darkBg text-white">
        <LoadingSpinner size="lg" text="Loading your orders..." />
      </main>
    )
  }

  if (!user && (!orders || orders.length === 0)) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 bg-darkBg text-white">
        <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/15 p-5 text-center">
          <p className="text-yellow-300 font-medium">Please sign in to view your order history.</p>
          <Button onClick={() => router.push("/auth/signin")} className="mt-4 bg-gold text-black hover:bg-gold/90">
            Sign In
          </Button>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 bg-darkBg text-white">
        <div className="rounded-lg border border-red-800/50 bg-red-900/15 p-5">
          <p className="text-red-300 font-medium">Could not load order history.</p>
          <p className="text-red-200/80 text-sm mt-1">{error}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4 border-red-500 text-red-300">
            Retry
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-darkBg text-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-gold">Order History</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            {user ? `Your personal order history • ${user.email}` : "Recent order history"}
          </p>
        </div>

        {/* Filters - simplified minimal UI */}
        <div className="rounded-xl bg-black/20 border border-white/10 p-3 md:p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search ID, customer, or item"
                  className="pl-9 bg-transparent border-white/10 focus:border-white/20"
                  aria-label="Search orders"
                />
              </div>
            </div>
            <div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-transparent border-white/10 focus:border-white/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setPage(1)
                }}
                className="bg-transparent border-white/10 focus:border-white/20"
                aria-label="From date"
              />
            </div>
            <div>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value)
                  setPage(1)
                }}
                className="bg-transparent border-white/10 focus:border-white/20"
                aria-label="To date"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Filter className="h-3.5 w-3.5" />
            <span>
              Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            {Boolean(q || status !== "all" || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQ("")
                  setStatus("all")
                  setFrom("")
                  setTo("")
                  setPage(1)
                }}
                className="ml-auto h-7 px-2 text-gray-300 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {pageData.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
            <p className="text-gray-300">No orders found.</p>
            <Button onClick={() => router.push("/menu")} className="mt-4 bg-gold text-black hover:bg-gold/90">
              Browse Menu
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {pageData.map((o) => {
              const items = Array.isArray(o.items) ? o.items : []
              return (
                <li key={o.order_id} className="rounded-xl border border-white/10 bg-black/20 p-4 md:p-5">
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status as any} />
                      <div className="leading-tight">
                        <p className="font-medium">
                          <span className="text-gray-400">ID:</span>{" "}
                          <span className="font-mono text-gold">
                            {o.short_order_id || o.order_id.slice(-8).toUpperCase()}
                          </span>
                        </p>
                        <TimeBD iso={o.created_at} className="text-xs text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleReorder(o)} className="h-8">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Reorder
                      </Button>
                      <InvoiceButton order={o} />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3 divide-y divide-white/5">
                    {items.map((it, idx) => {
                      const qty = typeof it.quantity === "number" ? it.quantity : 1
                      const unit = typeof it.price === "number" ? it.price : 0 // Updated field name
                      const line = unit * qty
                      const name = it.product_name || "Item" // Updated field name
                      const img = "/sushi-thumbnail.png" // Default image

                      return (
                        <div key={it.id ?? `item-${idx}`} className="py-2.5 flex items-start gap-3">
                          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-900 border border-white/10 shrink-0">
                            <Image
                              src={img || "/placeholder.svg?height=48&width=48&query=sushi%20item"}
                              alt={name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium truncate">{name}</p>
                              <p className="font-medium shrink-0 text-white">
                                {"৳"}
                                {money(line)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              Qty {qty} • {"৳"}
                              {money(unit)} each
                            </p>
                            {unit === 0 && <p className="text-xs text-red-400 mt-1">⚠️ Price data missing</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal</span>
                      <span>
                        {"৳"}
                        {money(items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount</span>
                      <span className="text-green-400">
                        {o.discount && o.discount > 0 ? "-" : ""}৳{money(o.discount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">VAT</span>
                      <span>
                        {"৳"}
                        {money(o.vat || 0)} {/* Use actual VAT from database */}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Delivery</span>
                      <span>{o.delivery_charge === 0 ? "FREE" : `৳${money(o.delivery_charge)}`}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-yellow-400">
                        {"৳"}
                        {money(o.total_amount)}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Pagination – compact */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 text-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8"
            >
              Prev
            </Button>
            <p className="text-gray-400">
              Page {page} of {totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
