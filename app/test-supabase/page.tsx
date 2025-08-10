"use client"

import { useCallback, useState } from "react"
import { getSupabaseBrowserClient, testSupabaseConnection, getCurrentUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type OrderRow = {
  id: string
  status: string
  total_amount: number
  created_at: string
}

export default function TestSupabasePage() {
  const [connMsg, setConnMsg] = useState<string>("")
  const [authMsg, setAuthMsg] = useState<string>("")
  const [orderMsg, setOrderMsg] = useState<string>("")
  const [myOrders, setMyOrders] = useState<OrderRow[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckConnection = useCallback(async () => {
    setConnMsg("চেক করা হচ্ছে...")
    const res = await testSupabaseConnection()
    setConnMsg(res.ok ? `✅ ${res.message}` : `⚠️ ${res.message}`)
  }, [])

  const handleShowAuth = useCallback(async () => {
    setAuthMsg("লোড হচ্ছে...")
    const { user, error } = await getCurrentUser()
    if (error) {
      setAuthMsg(`⚠️ ${error.message}`)
    } else if (user) {
      setAuthMsg(`✅ সাইন-ইন আছেন: ${user.email || user.id}`)
    } else {
      setAuthMsg("ℹ️ আপনি সাইন-ইন করেননি (Guest)")
    }
  }, [])

  const handleCreateGuestOrder = useCallback(async () => {
    setIsLoading(true)
    setOrderMsg("গেস্ট অর্ডার তৈরি করা হচ্ছে...")
    try {
      const supabase = getSupabaseBrowserClient()

      // 1) অর্ডার তৈরি
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          // guest checkout — user_id null
          user_id: null,
          status: "pending",
          payment_method: "cash",
          total_amount: 12.5,
        })
        .select("id")
        .single()

      if (orderErr || !order) {
        setOrderMsg(`⚠️ অর্ডার তৈরি ব্যর্থ: ${orderErr?.message || "unknown"}`)
        setIsLoading(false)
        return
      }

      // 2) অর্ডার আইটেম যোগ
      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: order.id,
        quantity: 1,
        price_at_purchase: 12.5,
        item_name: "Test Roll",
        item_description: "স্বল্প-পরীক্ষার জন্য আইটেম",
        item_image: "/test-roll.png",
        menu_item_id: null, // nullable — FK কনফ্লিক্ট এড়াতে
      })

      if (itemErr) {
        setOrderMsg(`⚠️ অর্ডার আইটেম ব্যর্থ: ${itemErr.message}`)
        setIsLoading(false)
        return
      }

      setOrderMsg(`✅ গেস্ট অর্ডার তৈরি হয়েছে (ID: ${order.id})`)
    } catch (e: any) {
      setOrderMsg(`⚠️ ত্রুটি: ${e?.message || String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFetchMyOrders = useCallback(async () => {
    setIsLoading(true)
    setOrderMsg("আপনার অর্ডারগুলো আনা হচ্ছে...")
    setMyOrders(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { user } = await getCurrentUser()
      if (!user) {
        setOrderMsg("ℹ️ সাইন-ইন না থাকলে অর্ডার দেখা যাবে না।")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total_amount,created_at")
        .order("created_at", { ascending: false })

      if (error) {
        setOrderMsg(`⚠️ RLS/কোয়েরি ত্রুটি: ${error.message}`)
        setIsLoading(false)
        return
      }

      setMyOrders((data as OrderRow[]) || [])
      setOrderMsg(`✅ মোট ${data?.length || 0}টি অর্ডার পাওয়া গেছে`)
    } catch (e: any) {
      setOrderMsg(`⚠️ ত্রুটি: ${e?.message || String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4">Supabase টেস্ট ও হেলথ-চেক</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>কানেকশন টেস্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleCheckConnection} disabled={isLoading}>
              কানেকশন চেক করুন
            </Button>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {connMsg}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>অথেনটিকেশন স্টেটাস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleShowAuth} disabled={isLoading}>
              বর্তমান ইউজার দেখুন
            </Button>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {authMsg}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>অর্ডার টেস্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleCreateGuestOrder} disabled={isLoading}>
                গেস্ট অর্ডার তৈরি করুন
              </Button>
              <Button onClick={handleFetchMyOrders} disabled={isLoading}>
                আমার অর্ডারগুলো দেখুন
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {orderMsg}
            </p>

            {myOrders && (
              <div className="mt-2 space-y-2">
                {myOrders.length === 0 ? (
                  <p className="text-sm">কোনো অর্ডার পাওয়া যায়নি।</p>
                ) : (
                  <ul className="space-y-2">
                    {myOrders.map((o) => (
                      <li key={o.id} className="rounded border p-2">
                        <div className="flex justify-between">
                          <span className="font-medium">#{o.id}</span>
                          <span className="text-xs">{new Date(o.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          স্ট্যাটাস: {o.status} • মোট: ${o.total_amount}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>টেস্ট ইমেজ</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src="/test-roll.png"
              alt="টেস্ট সুশি রোল"
              className="h-24 w-24 rounded object-cover ring-1 ring-slate-200"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
