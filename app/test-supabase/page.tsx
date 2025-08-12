"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type OrderRow = {
  order_id: string
  status: string
  total_price: number
  created_at: string
}

export default function TestSupabasePage() {
  const [connMsg, setConnMsg] = useState<string>("")
  const [authMsg, setAuthMsg] = useState<string>("")
  const [orderMsg, setOrderMsg] = useState<string>("")
  const [myOrders, setMyOrders] = useState<OrderRow[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckConnection = useCallback(async () => {
    setConnMsg("Checking connection...")
    try {
      const response = await fetch("/api/test-supabase-orders")
      const data = await response.json()

      if (response.ok && data.success) {
        setConnMsg(`✅ Connection successful - Found ${data.tests.ordersTable.count} orders`)
      } else {
        setConnMsg(`⚠️ Connection failed: ${data.error || "Unknown error"}`)
      }
    } catch (error: any) {
      setConnMsg(`⚠️ Connection failed: ${error.message}`)
    }
  }, [])

  const handleShowAuth = useCallback(async () => {
    setAuthMsg("Loading...")
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()

      if (response.ok && data.user) {
        setAuthMsg(`✅ Signed in as: ${data.user.email || data.user.id}`)
      } else {
        setAuthMsg("ℹ️ Not signed in (Guest)")
      }
    } catch (error: any) {
      setAuthMsg(`⚠️ ${error.message}`)
    }
  }, [])

  const handleCreateGuestOrder = useCallback(async () => {
    setIsLoading(true)
    setOrderMsg("Creating guest order...")
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: "Test Guest",
          phone: "123-456-7890",
          status: "pending",
          payment_method: "cash",
          total_price: 12.5,
          subtotal: 12.5,
          vat: 0,
          delivery_charge: 0,
          items: [
            {
              name: "Test Roll",
              quantity: 1,
              price: 12.5,
              description: "Test item for connection verification",
              image: "/sushi-roll.png",
            },
          ],
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOrderMsg(`✅ Guest order created successfully (ID: ${data.order_id})`)
      } else {
        setOrderMsg(`⚠️ Order creation failed: ${data.error || "Unknown error"}`)
      }
    } catch (e: any) {
      setOrderMsg(`⚠️ Error: ${e?.message || String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFetchMyOrders = useCallback(async () => {
    setIsLoading(true)
    setOrderMsg("Fetching orders...")
    setMyOrders(null)
    try {
      console.log("Fetching orders from /api/orders...")
      const response = await fetch("/api/orders", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Non-JSON response:", responseText)
        throw new Error(`Expected JSON, got ${contentType}. Response: ${responseText.slice(0, 200)}`)
      }

      const text = await response.text()
      console.log("Response text length:", text.length)
      console.log("Response preview:", text.slice(0, 200))

      if (!text.trim()) {
        throw new Error("Empty response received from server")
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        console.error("Raw response:", text)
        throw new Error(`Invalid JSON response: ${parseError}`)
      }

      console.log("Parsed data:", data)

      if (data.orders && Array.isArray(data.orders)) {
        const orders = data.orders.slice(0, 10).map((order: any) => ({
          order_id: order.order_id || order.id,
          status: order.status,
          total_price: order.total_price,
          created_at: order.created_at,
        }))

        setMyOrders(orders)
        setOrderMsg(`✅ Found ${orders.length} orders (Total: ${data.metadata?.total_orders || orders.length})`)
      } else if (data.error) {
        setOrderMsg(`⚠️ API Error: ${data.error}`)
      } else {
        console.error("Unexpected data structure:", data)
        setOrderMsg(`⚠️ Unexpected response format: ${JSON.stringify(data).slice(0, 100)}`)
      }
    } catch (e: any) {
      console.error("Fetch orders error:", e)
      setOrderMsg(`⚠️ Error: ${e?.message || String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4">Supabase Connection Test</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleCheckConnection} disabled={isLoading}>
              Test Connection
            </Button>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {connMsg}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleShowAuth} disabled={isLoading}>
              Check Current User
            </Button>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {authMsg}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Database Operations Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleCreateGuestOrder} disabled={isLoading}>
                Create Test Order
              </Button>
              <Button onClick={handleFetchMyOrders} disabled={isLoading}>
                Fetch Recent Orders
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {orderMsg}
            </p>

            {myOrders && (
              <div className="mt-2 space-y-2">
                {myOrders.length === 0 ? (
                  <p className="text-sm">No orders found.</p>
                ) : (
                  <ul className="space-y-2">
                    {myOrders.map((o) => (
                      <li key={o.order_id} className="rounded border p-2">
                        <div className="flex justify-between">
                          <span className="font-medium">#{o.order_id.slice(0, 8)}...</span>
                          <span className="text-xs">{new Date(o.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          Status: {o.status} • Total: ${o.total_price}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
