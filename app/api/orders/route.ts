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
        short_order_id,
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
      orders?.map((order) => ({
        id: order.order_id,
        short_order_id: order.short_order_id, // Added short_order_id to response
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
        created_at: order.created_at, // Raw UTC timestamp for client-side conversion
        order_type: "delivery",
        payment_method: order.payment_method || "cash",
        address: order.address,
        phone: order.phone,
        message: order.message,
      })) || []

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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
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
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.order_id,
        menu_item_id: item.menu_item_id,
        item_name: item.name,
        item_description: item.description,
        item_image: item.image,
        item_price: item.price,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError
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
