import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        order_id,
        user_id,
        total_price,
        status,
        created_at,
        order_items (
          id,
          item_name,
          quantity,
          price_at_purchase
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0,
      metadata: {
        timestamp: new Date().toISOString(),
        timezone: "Asia/Dhaka",
      },
    })
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    const body = await request.json()

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: body.user_id || null,
        total_price: body.total_price || 25.99,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Order creation error:", error)
      return NextResponse.json({ error: "Failed to create order", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Test order created successfully",
    })
  } catch (error) {
    console.error("Order creation API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
