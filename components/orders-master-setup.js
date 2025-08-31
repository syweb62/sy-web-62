"use client"

import React from "react"

/**
 * orders-master-setup.js
 *
 * Provides a complete solution:
 * - Supabase client connection
 * - SQL migration guidance
 * - API route for updating orders
 * - OrdersTable dashboard component
 * - Notification sound setup
 * - Dashboard page integration example
 */

// ——————————————————
// 1. Supabase Client Setup
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// Log to verify connection
console.log("[v0-dev check] Supabase initialized")

// ——————————————————
// 2. SQL Migration (Run once in Supabase SQL Editor):
/**
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_order_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
-- Generate short_order_id automatically
create or replace function set_short_order_id() returns trigger language plpgsql as $$
begin
  if new.short_order_id is null or new.short_order_id = '' then
    new.short_order_id := substr(md5(new.id::text), 1, 6);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_set_short_order_id on public.orders;
create trigger trg_set_short_order_id before insert on public.orders
for each row execute function set_short_order_id();
-- Enable RLS & Real-time broadcast
alter table public.orders enable row level security;
create policy "select_all" on public.orders for select to authenticated using (true);
alter publication supabase_realtime add table public.orders;
**/

console.log("[v0-dev check] Ensure SQL migration ran")

// ——————————————————
// 3. API Route Handler (pages/api/orders/update.js)
export async function updateOrderAPI(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const { orderId, status } = req.body
  console.log("[API] Update requested:", orderId, status)

  const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select().single()

  if (error) {
    console.error("[API] Update failed:", error)
    return res.status(500).json({ success: false, error: error.message })
  }

  return res.status(200).json({ success: true, data })
}

// ——————————————————
// 4. React Component: OrdersTable (Dashboard UI)
export default function OrdersTable() {
  const [orders, setOrders] = React.useState([])

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
    if (!error && data) setOrders(data)
  }

  const updateOrder = async (orderId, status) => {
    console.log("[UI] Updating:", orderId, status)
    const resp = await fetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    })
    const result = await resp.json()
    if (result.success) playNotification()
  }

  const playNotification = () => {
    const audio = new Audio("/notify.mp3")
    audio.play().catch((err) => console.warn("Audio play failed:", err))
    alert("🔔 Order updated!")
  }

  React.useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("[Realtime] Change:", payload)
        fetchOrders()
        playNotification()
      })
      .subscribe((status) => console.log("[Realtime] Status:", status))

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Orders Dashboard</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>ID</th>
            <th>Short ID</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td>{o.id}</td>
              <td>{o.short_order_id}</td>
              <td>{o.status}</td>
              <td>
                <button
                  onClick={() => updateOrder(o.id, "confirmed")}
                  className="px-2 py-1 bg-green-500 text-white rounded mr-2"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateOrder(o.id, "cancelled")}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ——————————————————
// 5. How to embed this into Dashboard Page (app/dashboard/orders/page.js)
/**
import OrdersTable from "@/orders-master-setup";
export default function DashboardOrdersPage() {
  return <OrdersTable />;
}
**/

console.log("[v0-dev check] OrdersTable ready for integration")

// ——————————————————
// 6. Notification Sound
// Place a file named "notify.mp3" inside the /public folder of your project

console.log("[v0-dev check] Place notify.mp3 in public/")
