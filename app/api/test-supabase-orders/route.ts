import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log("Testing Supabase connection...")

    // Test 2: Check orders table structure
    const { data: ordersData, error: ordersError } = await supabase.from("orders").select("*").limit(5)

    console.log("Orders query result:", { ordersData, ordersError })

    // Test 3: Check order_items table
    const { data: orderItemsData, error: orderItemsError } = await supabase.from("order_items").select("*").limit(5)

    console.log("Order items query result:", { orderItemsData, orderItemsError })

    // Test 4: Check profiles table
    const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("*").limit(5)

    console.log("Profiles query result:", { profilesData, profilesError })

    // Test 5: Try the full join query
    const { data: joinData, error: joinError } = await supabase
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
          menu_item_id
        ),
        profiles (
          full_name,
          email
        )
      `)
      .limit(3)

    console.log("Join query result:", { joinData, joinError })

    return NextResponse.json({
      success: true,
      tests: {
        ordersTable: {
          count: ordersData?.length || 0,
          data: ordersData,
          error: ordersError?.message,
        },
        orderItemsTable: {
          count: orderItemsData?.length || 0,
          data: orderItemsData,
          error: orderItemsError?.message,
        },
        profilesTable: {
          count: profilesData?.length || 0,
          data: profilesData,
          error: profilesError?.message,
        },
        joinQuery: {
          count: joinData?.length || 0,
          data: joinData,
          error: joinError?.message,
        },
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
      },
    })
  } catch (error) {
    console.error("Supabase test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
