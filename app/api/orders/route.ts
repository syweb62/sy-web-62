import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  console.log("[v0] ========== API GET: Request received ==========")
  console.log("[v0] API GET: Time:", new Date().toISOString())
  console.log("[v0] API GET: URL:", request.url)

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const orderId = searchParams.get("orderId") // Added orderId parameter for validation

    console.log("[v0] API GET: Query params:", { status, search, orderId })

    if (orderId) {
      console.log("[v0] API GET: Single order lookup for:", orderId)
      const { data: order, error } = await supabase.rpc("get_order_by_identifier", { identifier: orderId }).single()

      if (error || !order) {
        console.log("[v0] API GET: Order not found:", orderId, error)
        return NextResponse.json({ error: "Order not found", orderId }, { status: 404 })
      }

      console.log("[v0] API GET: Single order found:", order.short_order_id)
      return NextResponse.json({ order, exists: true })
    }

    console.log("[v0] API GET: Fetching all orders from database...")
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
      console.log("[v0] API GET: Filtering by status:", status)
      query = query.eq("status", status)
    }

    if (search) {
      console.log("[v0] API GET: Filtering by search term:", search)
      query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,short_order_id.ilike.%${search}%`)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("[v0] API GET: Database error:", error)
      throw error
    }

    console.log("[v0] API GET: Successfully fetched", orders?.length || 0, "orders")
    if (orders && orders.length > 0) {
      console.log("[v0] API GET: Sample order:", {
        short_order_id: orders[0].short_order_id,
        status: orders[0].status,
        customer_name: orders[0].customer_name,
      })
    }

    const formattedOrders =
      orders?.map((order) => ({
        id: order.order_id, // Use real UUID for database operations
        order_id: order.order_id, // Keep the real UUID for database operations
        short_order_id: order.short_order_id, // Keep short_order_id for display
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
            id: `${order.short_order_id}-${item.item_name}`,
            menu_item_id: `${order.short_order_id}-${item.item_name}`,
            item_name: item.item_name,
            item_description: item.item_name,
            item_image: "/sushi-thumbnail.png",
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
          })) || [],
      })) || []

    console.log("[v0] API GET: Returning formatted orders:", formattedOrders.length)
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
  console.log("[v0] ========== API PATCH: Request received ==========")
  console.log("[v0] API PATCH: Time:", new Date().toISOString())

  try {
    const supabase = createClient()
    const { orderId, status } = await request.json()

    console.log("[v0] API PATCH: Received request:", { orderId, status, orderIdType: typeof orderId })

    if (!orderId || !status) {
      console.error("[v0] API PATCH: Missing required fields")
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    console.log("[v0] API PATCH: Attempting to find order with identifier:", orderId)

    // First try the universal function
    console.log("[v0] API PATCH: Trying universal function...")
    let { data, error } = await supabase.rpc("update_order_status_by_identifier", {
      identifier: orderId,
      new_status: status,
    })

    console.log("[v0] API PATCH: Universal function result:", { data, error })

    if (error || !data || data.length === 0) {
      console.log("[v0] API PATCH: Universal function failed, trying direct lookup")

      // Fallback: Try direct database lookup
      let order = null

      // Try UUID first
      console.log("[v0] API PATCH: Trying UUID lookup...")
      const { data: uuidOrder } = await supabase.from("orders").select("*").eq("order_id", orderId).single()

      if (uuidOrder) {
        order = uuidOrder
        console.log("[v0] API PATCH: Found order by UUID:", uuidOrder.short_order_id)
      } else {
        // Try short_order_id
        console.log("[v0] API PATCH: Trying short_order_id lookup...")
        const { data: shortOrder } = await supabase.from("orders").select("*").eq("short_order_id", orderId).single()

        if (shortOrder) {
          order = shortOrder
          console.log("[v0] API PATCH: Found order by short_order_id:", shortOrder.short_order_id)
        }
      }

      if (!order) {
        console.error("[v0] API PATCH: Order not found with any method:", orderId)
        return NextResponse.json({ error: `Order ${orderId} not found in database`, orderId }, { status: 404 })
      }

      // Update using the real UUID
      console.log("[v0] API PATCH: Updating order with UUID:", order.order_id)
      const { data: updateData, error: updateError } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("order_id", order.order_id)
        .select()

      if (updateError) {
        console.error("[v0] API PATCH: Direct update failed:", updateError)
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
      }

      console.log("[v0] API PATCH: Direct update successful:", updateData)
      data = updateData
    }

    console.log("[v0] API PATCH: Update successful, returning response")

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      newStatus: status,
      updatedOrder: data[0],
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

// Combined POST method for creating and updating orders
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const requestData = await request.json()

    if (requestData.orderId && requestData.status) {
      // Update order status
      console.log("[v0] API POST: Updating order:", { orderId: requestData.orderId, status: requestData.status })

      const { error } = await supabase
        .from("orders")
        .update({ status: requestData.status, updated_at: new Date().toISOString() })
        .eq("short_order_id", requestData.orderId)

      if (error) {
        console.error("❌ Order update failed:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      console.log("✅ Order updated:", requestData.orderId, requestData.status)
      return NextResponse.json({ success: true })
    } else {
      // Create new order
      const orderData = requestData
      const shortOrderId = Math.floor(10000 + Math.random() * 90000).toString()

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            short_order_id: shortOrderId,
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
    }
  } catch (error) {
    console.error("Order creation/update API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
