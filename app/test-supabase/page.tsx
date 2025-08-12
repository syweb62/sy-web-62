"use client"

import { useCallback, useState } from "react"
import { getSupabaseBrowserClient, testSupabaseConnection, getCurrentUser } from "@/lib/supabase"
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
      const res = await testSupabaseConnection()
      setConnMsg(res.status === "connected" ? `✅ Connection successful` : `⚠️ ${res.error}`)
    } catch (error: any) {
      setConnMsg(`⚠️ Connection failed: ${error.message}`)
    }
  }, [])

  const handleShowAuth = useCallback(async () => {
    setAuthMsg("Loading...")
    try {
      const user = await getCurrentUser()
      if (user) {
        setAuthMsg(`✅ Signed in as: ${user.email || user.id}`)
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
      const supabase = getSupabaseBrowserClient()

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: null,
          customer_name: "Test Guest",
          phone: "123-456-7890",
          status: "pending",
          payment_method: "cash",
          total_price: 12.5,
          subtotal: 12.5,
          vat: 0,
          delivery_charge: 0,
        })
        .select("order_id")
        .single()

      if (orderErr || !order) {
        setOrderMsg(`⚠️ Order creation failed: ${orderErr?.message || "unknown"}`)
        setIsLoading(false)
        return
      }

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: order.order_id,
        quantity: 1,
        price_at_purchase: 12.5,
        item_name: "Test Roll",
        item_description: "Test item for connection verification",
        item_image: "/sushi-roll.png",
        menu_item_id: null,
      })

      if (itemErr) {
        setOrderMsg(`⚠️ Order item failed: ${itemErr.message}`)
        setIsLoading(false)
        return
      }

      setOrderMsg(`✅ Guest order created successfully (ID: ${order.order_id})`)
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
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("orders")
        .select("order_id,status,total_price,created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        setOrderMsg(`⚠️ Query error: ${error.message}`)
        setIsLoading(false)
        return
      }

      setMyOrders((data as OrderRow[]) || [])
      setOrderMsg(`✅ Found ${data?.length || 0} orders`)
    } catch (e: any) {
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
