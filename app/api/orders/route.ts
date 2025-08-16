import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let query = supabase
      .from("orders")
      .select(`
        order_id,
        customer_name,
        phone,
        address,
        total_price,
        subtotal,
        vat,
        delivery_charge,
        discount,
        status,
        payment_method,
        message,
        created_at,
        order_items (
          item_name,
          quantity,
          price_at_purchase
        )
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,order_id.ilike.%${search}%`)
    }

    const { data: orders, error } = await query

    if (error) throw error

    const formattedOrders =
      orders?.map((order) => {
        const createdAt = new Date(order.created_at)
        const bangladeshTime = new Intl.DateTimeFormat("en-BD", {
          timeZone: "Asia/Dhaka",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).formatToParts(createdAt)

        const date = `${bangladeshTime.find((p) => p.type === "day")?.value}/${bangladeshTime.find((p) => p.type === "month")?.value}/${bangladeshTime.find((p) => p.type === "year")?.value}`
        const time = `${bangladeshTime.find((p) => p.type === "hour")?.value}:${bangladeshTime.find((p) => p.type === "minute")?.value} ${bangladeshTime.find((p) => p.type === "dayPeriod")?.value}`

        return {
          id: order.order_id,
          customer: order.customer_name || "Guest",
          email: order.phone || "N/A",
          items:
            order.order_items?.map((item: any) => ({
              name: item.item_name,
              quantity: item.quantity,
              price: item.price_at_purchase,
            })) || [],
          total_price: order.total_price,
          status: order.status,
          formatted_date: date,
          formatted_time: time,
          bangladesh_timestamp: order.created_at,
          order_type: "delivery", // Default for now
          payment_method: order.payment_method || "cash",
          address: order.address,
          phone: order.phone,
          message: order.message,
        }
      }) || []

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const { error } = await supabase.from("orders").update({ status }).eq("order_id", orderId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Order status updated successfully" })
  } catch (error) {
    console.error("Order update API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const orderData = await request.json()

    console.log("[v0] Received order data:", orderData)

    const orderInsertData = {
      customer_name: orderData.customer_name,
      phone: orderData.phone,
      address: orderData.address,
      total_price: orderData.total_price,
      subtotal: orderData.subtotal || orderData.total_price,
      vat: orderData.vat || 0,
      delivery_charge: orderData.delivery_charge || 0,
      discount: orderData.discount || 0,
      status: orderData.status || "pending",
      payment_method: orderData.payment_method || "cash",
      message: orderData.message || "",
    }

    console.log("[v0] Inserting order with data:", orderInsertData)

    const { data: order, error: orderError } = await supabase.from("orders").insert([orderInsertData]).select().single()

    if (orderError) {
      console.error("[v0] Order insertion error:", orderError)
      throw orderError
    }

    console.log("[v0] Order created successfully:", order)

    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.order_id,
        menu_item_id: item.menu_item_id || null,
        item_name: item.name,
        item_description: item.description || "",
        item_image: item.image || "",
        item_price: item.price,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }))

      console.log("[v0] Inserting order items:", orderItems)

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("[v0] Order items insertion error:", itemsError)
        throw itemsError
      }

      console.log("[v0] Order items created successfully")
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Order creation API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
