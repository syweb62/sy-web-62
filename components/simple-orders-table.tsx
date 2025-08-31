"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

console.log("[v0] Simple Orders Table component loaded")

export default function SimpleOrdersTable() {
  console.log("[v0] ========== SIMPLE ORDERS TABLE COMPONENT ==========")

  const [orders, setOrders] = useState([])
  const supabase = createClient()

  const fetchOrders = async () => {
    console.log("[v0] Fetching orders...")
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      console.log("[v0] Orders fetched:", data.length)
      setOrders(data)
    } else {
      console.error("[v0] Error fetching orders:", error)
    }
  }

  const updateOrder = async (orderId: string, status: string) => {
    console.log("[v0] ========== UPDATING ORDER ==========")
    console.log("[v0] Order ID:", orderId, "Status:", status)

    try {
      const resp = await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      })

      const result = await resp.json()
      console.log("[v0] Update result:", result)

      if (result.success) {
        console.log("[v0] ✅ Order updated successfully!")
        alert("🔔 Order updated!")
        fetchOrders() // Refresh the list
      } else {
        console.error("[v0] ❌ Update failed:", result.error)
        alert("❌ Update failed: " + result.error)
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      alert("❌ Update error: " + error)
    }
  }

  useEffect(() => {
    console.log("[v0] ========== SIMPLE ORDERS TABLE MOUNTED ==========")
    console.log("[v0] Mount time:", new Date().toISOString())

    fetchOrders()

    // Set up real-time subscription
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[v0] ========== REALTIME CHANGE DETECTED ==========")
        console.log("[v0] Payload:", payload)
        fetchOrders()
        alert("🔔 Order updated via real-time!")
      })
      .subscribe((status) => {
        console.log("[v0] ========== REALTIME SUBSCRIPTION STATUS ==========")
        console.log("[v0] Status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [])

  console.log("[v0] Rendering table with", orders.length, "orders")

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-4 text-white">Simple Orders Dashboard</h1>
        <button
          onClick={() => {
            console.log("[v0] ========== TEST BUTTON CLICKED ==========")
            console.log("[v0] Orders count:", orders.length)
            alert("✅ Simple table working! Orders: " + orders.length)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          TEST SIMPLE TABLE ({orders.length})
        </button>
        <button onClick={fetchOrders} className="px-4 py-2 bg-green-600 text-white rounded">
          REFRESH
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 bg-gray-900 text-white">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-700 p-2">ID</th>
              <th className="border border-gray-700 p-2">Short ID</th>
              <th className="border border-gray-700 p-2">Status</th>
              <th className="border border-gray-700 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-t border-gray-700">
                <td className="border border-gray-700 p-2 text-xs">{order.id}</td>
                <td className="border border-gray-700 p-2 font-mono">{order.short_order_id}</td>
                <td className="border border-gray-700 p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.status === "confirmed"
                        ? "bg-green-600"
                        : order.status === "cancelled"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="border border-gray-700 p-2">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateOrder(order.id, "confirmed")}
                        className="px-2 py-1 bg-green-500 text-white rounded mr-2 text-xs"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateOrder(order.id, "cancelled")}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status !== "pending" && <span className="text-gray-400 text-xs">No actions</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-400">No orders found. Create some test orders to see them here.</div>
      )}
    </div>
  )
}
