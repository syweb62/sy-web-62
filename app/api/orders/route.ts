import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("[v0] ========== API GET: Request received ==========")
  console.log("[v0] API GET: Time:", new Date().toISOString())
  console.log("[v0] API GET: URL:", request.url)

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const orderId = searchParams.get("orderId")
    const userEmail = searchParams.get("user_email")

    console.log("[v0] API GET: Query params:", { status, search, orderId, userEmail })

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

    console.log("[v0] API GET: Fetching orders from database...")
    let query = supabase
      .from("orders")
      .select(`
        order_id,
        short_order_id,
        customer_name,
        phone_number,
        address,
        total_amount,
        subtotal,
        vat,
        delivery_charge,
        discount,
        status,
        payment_method,
        created_at,
        order_items (
          product_name,
          quantity,
          price
        )
      `)
      .order("created_at", { ascending: false })

    if (userEmail) {
      console.log("[v0] API GET: Filtering orders for user:", userEmail)

      // Get user profile to find phone number
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("email", userEmail)
        .single()

      if (profile?.phone) {
        // Filter by phone number if available
        query = query.eq("phone_number", profile.phone)
        console.log("[v0] API GET: Filtering by phone:", profile.phone)
      } else {
        // Fallback: filter by customer name patterns
        const searchTerms = [userEmail]
        if (profile?.full_name) {
          searchTerms.push(profile.full_name)
        }

        const orConditions = searchTerms.map((term) => `customer_name.ilike.%${term}%`).join(",")
        query = query.or(orConditions)
        console.log("[v0] API GET: Filtering by name/email patterns:", searchTerms)
      }
    } else {
      console.log("[v0] API GET: Admin access - showing all orders")
    }

    if (status && status !== "all") {
      console.log("[v0] API GET: Filtering by status:", status)
      query = query.eq("status", status)
    }

    if (search) {
      console.log("[v0] API GET: Filtering by search term:", search)
      query = query.or(`customer_name.ilike.%${search}%,phone_number.ilike.%${search}%,order_id.ilike.%${search}%`)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("[v0] API GET: Database error:", error)
      throw error
    }

    console.log("[v0] API GET: Successfully fetched", orders?.length || 0, "orders")
    if (orders && orders.length > 0) {
      console.log("[v0] API GET: Sample order:", {
        order_id: orders[0].order_id,
        status: orders[0].status,
        customer_name: orders[0].customer_name,
      })
    }

    const formattedOrders =
      orders?.map((order) => ({
        id: order.order_id,
        order_id: order.order_id,
        short_order_id: order.short_order_id || order.order_id.slice(-8).toUpperCase(),
        customer_name: order.customer_name || "Guest",
        phone: order.phone_number || "N/A",
        address: order.address || "No address provided",
        total_price: order.total_amount,
        subtotal: order.subtotal || 0,
        vat: order.vat || 0,
        delivery_charge: order.delivery_charge || 0,
        discount: order.discount || 0,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.created_at,
        special_instructions: "",
        payment_method: order.payment_method || "cash",
        order_items:
          order.order_items?.map((item: any) => ({
            item_name: item.product_name,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            price_at_purchase: item.price,
            special_instructions: "",
          })) || [],
        items:
          order.order_items?.map((item: any) => ({
            id: `${order.order_id}-${item.product_name}`,
            menu_item_id: `${order.order_id}-${item.product_name}`,
            item_name: item.product_name,
            item_description: item.product_name,
            item_image: "/sushi-thumbnail.png",
            quantity: item.quantity,
            price_at_purchase: item.price,
            special_instructions: "",
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

    console.log("[v0] API PATCH: Attempting to update order:", orderId)

    const { data: updateData, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("order_id", orderId)
      .select()

    if (updateError) {
      console.error("[v0] API PATCH: Update failed:", updateError)
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
    }

    if (!updateData || updateData.length === 0) {
      console.error("[v0] API PATCH: Order not found:", orderId)
      return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 })
    }

    console.log("[v0] API PATCH: Update successful:", updateData)

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      newStatus: status,
      updatedOrder: updateData[0],
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
          phone_number: orderData.phone_number,
          address: orderData.address,
          total_amount: orderData.total_amount,
          subtotal: orderData.subtotal,
          vat: orderData.vat,
          delivery_charge: orderData.delivery_charge,
          discount: orderData.discount || 0,
          status: orderData.status || "pending",
          payment_method: orderData.payment_method || "cash",
          user_id: orderData.user_id || null,
          short_order_id: orderData.short_order_id || null,
        },
      ])
      .select("*, short_order_id")
      .single()

    if (orderError) throw orderError

    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.order_id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
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
