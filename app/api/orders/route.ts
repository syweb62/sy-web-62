import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    // If orderId is provided, validate the order exists
    if (orderId) {
      console.log("[v0] API GET: Validating order existence:", orderId)

      let orderExists = false

      // Try UUID format first
      if (orderId.length === 36 && orderId.includes("-")) {
        const { data, error } = await supabase.from("orders").select("order_id").eq("order_id", orderId).limit(1)

        if (!error && data && data.length > 0) {
          orderExists = true
        }
      }

      // Try short_order_id if UUID failed
      if (!orderExists) {
        const { data, error } = await supabase
          .from("orders")
          .select("short_order_id")
          .eq("short_order_id", orderId)
          .limit(1)

        if (!error && data && data.length > 0) {
          orderExists = true
        }
      }

      if (!orderExists) {
        console.log("[v0] API GET: Order validation failed - order not found:", orderId)
        return NextResponse.json({ error: "Order not found", orderId }, { status: 404 })
      }

      console.log("[v0] API GET: Order validation successful:", orderId)
      return NextResponse.json({ success: true, orderId, exists: true })
    }

    const status = searchParams.get("status")
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
        updated_at,
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

    if (error) {
      console.error("[v0] API GET: Database error:", error)
      throw error
    }

    console.log("[v0] API GET: Successfully fetched", orders?.length || 0, "orders")

    const formattedOrders =
      orders?.map((order) => ({
        id: order.order_id || order.short_order_id,
        order_id: order.order_id || order.short_order_id,
        short_order_id: order.short_order_id,
        customer_name: order.customer_name || "Guest",
        phone: order.phone || "N/A",
        address: order.address || "No address provided",
        total_price: order.total_price,
        subtotal: order.subtotal,
        vat: order.vat,
        delivery_charge: order.delivery_charge,
        discount: order.discount,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        special_instructions: order.message,
        payment_method: order.payment_method || "cash",
        order_items:
          order.order_items?.map((item: any) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          })) || [],
        // Additional fields for compatibility
        items:
          order.order_items?.map((item: any) => ({
            id: `${order.order_id}-${item.item_name}`,
            menu_item_id: `${order.order_id}-${item.item_name}`,
            item_name: item.item_name,
            item_description: item.item_name,
            item_image: "/sushi-thumbnail.png",
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          })) || [],
      })) || []

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("[v0] API GET: Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { orderId, status } = await request.json()

    console.log("[v0] API PATCH: Updating order status:", { orderId, status })

    if (!orderId || !status) {
      console.error("[v0] API PATCH: Missing required fields")
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    let updatedOrder = null

    // Try updating by order_id first (UUID format)
    if (orderId.length === 36 && orderId.includes("-")) {
      console.log("[v0] API PATCH: Attempting UUID update")
      const { data, error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select()

      if (!error && data && data.length > 0) {
        updatedOrder = data[0]
        console.log("[v0] API PATCH: UUID update successful")
      } else {
        console.log("[v0] API PATCH: UUID update failed or no records found:", error?.message || "No matching records")
      }
    }

    // If UUID failed or orderId is not UUID format, try short_order_id
    if (!updatedOrder) {
      console.log("[v0] API PATCH: Attempting short_order_id update")
      const { data, error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("short_order_id", orderId)
        .select()

      if (error) {
        console.error("[v0] API PATCH: short_order_id update failed:", error)
        throw new Error(`Failed to update order: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.error("[v0] API PATCH: No order found with ID:", orderId)
        return NextResponse.json({ error: "Order not found", orderId }, { status: 404 })
      }

      updatedOrder = data[0]
      console.log("[v0] API PATCH: short_order_id update successful")
    }

    if (!updatedOrder) {
      console.error("[v0] API PATCH: No order found with ID:", orderId)
      return NextResponse.json({ error: "Order not found", orderId }, { status: 404 })
    }

    console.log("[v0] API PATCH: Order status updated successfully:", updatedOrder)

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      newStatus: status,
      updatedOrder,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] API PATCH: Update failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order status",
        details: error instanceof Error ? error.message : "Unknown error",
        orderId: null,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
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
