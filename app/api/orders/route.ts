import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          item_name,
          item_price,
          price_at_purchase,
          item_image,
          menu_item_id,
          menu_items (
            name,
            image_url
          )
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false }) // Order by creation date, newest first

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`order_id.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    const formattedOrders =
      orders?.map((order) => {
        const createdAt = new Date(order.created_at)
        // Proper Bangladesh timezone conversion (UTC+6)
        const bangladeshTime = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000)

        return {
          id: order.order_id,
          order_id: order.order_id,
          customer_name: order.customer_name,
          phone: order.phone,
          address: order.address,
          message: order.message,
          status: order.status,
          payment_method: order.payment_method,
          subtotal: order.subtotal,
          vat: order.vat,
          discount: order.discount,
          delivery_charge: order.delivery_charge,
          total_price: order.total_price,
          created_at: order.created_at,
          // Enhanced Bangladesh time formatting
          formatted_date: bangladeshTime.toLocaleDateString("en-BD", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Asia/Dhaka",
          }),
          formatted_time: bangladeshTime.toLocaleTimeString("en-BD", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Dhaka",
          }),
          bangladesh_timestamp: bangladeshTime.toISOString(),
          // Additional Dhaka timezone info
          dhaka_date_time: bangladeshTime.toLocaleString("en-BD", {
            timeZone: "Asia/Dhaka",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
          items:
            order.order_items?.map((item) => ({
              name: item.item_name || item.menu_items?.name || "Unknown Item",
              quantity: item.quantity,
              price: item.price_at_purchase || item.item_price,
              image: item.item_image || item.menu_items?.image_url,
            })) || [],
          customer: order.profiles?.full_name || order.customer_name || "Guest",
          email: order.profiles?.email || "",
          order_type: "dine-in",
        }
      }) || []

    return NextResponse.json({
      orders: formattedOrders,
      metadata: {
        total_orders: formattedOrders.length,
        server_time: new Date().toISOString(),
        dhaka_time: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" }),
        timezone_offset: "+06:00",
      },
    })
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: data[0],
      updated_at_dhaka: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" }),
    })
  } catch (error) {
    console.error("Error in order update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
