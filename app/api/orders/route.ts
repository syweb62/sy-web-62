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
        id: order.order_id || order.short_order_id,
        order_id: order.order_id || order.short_order_id,
        short_order_id: order.short_order_id,
        customer_name: order.customer_name || "Guest",
        phone: order.phone || "N/A",
        address: order.address || "No address provided",
        total_price: order.total_price,
        status: order.status,
        created_at: order.created_at,
        special_instructions: order.message,
        order_items:
          order.order_items?.map((item: any) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          })) || [],
        payment_method: order.payment_method || "cash",
        message: order.message,
        customer: order.customer_name || "Guest",
        email: order.phone || "N/A",
        items:
          order.order_items?.map((item: any) => ({
            name: item.item_name,
            quantity: item.quantity,
            price: item.price_at_purchase,
          })) || [],
        order_type: "delivery",
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

    console.log("[v0] API: Updating order status:", { orderId, status })

    if (!orderId || !status) {
      console.error("[v0] API: Missing orderId or status")
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    let updateResult

    // Try updating by order_id first (UUID)
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()

    if (orderError && orderError.message.includes("invalid input syntax for type uuid")) {
      console.log("[v0] API: UUID failed, trying short_order_id")
      // If orderId is not a valid UUID, try updating by short_order_id
      const { data: shortOrderData, error: shortIdError } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("short_order_id", orderId)
        .select()

      if (shortIdError) {
        console.error("[v0] API: Both UUID and short_order_id failed:", shortIdError)
        throw shortIdError
      }
      updateResult = shortOrderData
    } else if (orderError) {
      console.error("[v0] API: Order update failed:", orderError)
      throw orderError
    } else {
      updateResult = orderData
    }

    console.log("[v0] API: Order status updated successfully:", updateResult)

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      newStatus: status,
      updatedOrder: updateResult?.[0] || null,
    })
  } catch (error) {
    console.error("[v0] API: Order update error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        orderId: request.body ? JSON.parse(await request.text()).orderId : null,
      },
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
