import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  console.log("[v0] ========== Menu API GET: Request received ==========")
  console.log("[v0] Menu API GET: Time:", new Date().toISOString())

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const available = searchParams.get("available")
    const search = searchParams.get("search")

    console.log("[v0] Menu API GET: Query params:", { category, available, search })

    let query = supabase.from("menu_items").select("*").order("created_at", { ascending: false })

    // Filter by category if provided
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Filter by availability if provided
    if (available === "true") {
      query = query.eq("available", true)
    } else if (available === "false") {
      query = query.eq("available", false)
    }

    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: menuItems, error } = await query

    if (error) {
      console.error("[v0] Menu API GET: Database error:", error)
      throw error
    }

    console.log("[v0] Menu API GET: Successfully fetched", menuItems?.length || 0, "menu items")

    return NextResponse.json({
      success: true,
      menuItems: menuItems || [],
      count: menuItems?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Menu API GET: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch menu items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("[v0] ========== Menu API POST: Request received ==========")

  try {
    const supabase = createClient()
    const menuItemData = await request.json()

    console.log("[v0] Menu API POST: Creating menu item:", menuItemData.name)

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert([
        {
          name: menuItemData.name,
          description: menuItemData.description,
          price: menuItemData.price,
          category: menuItemData.category,
          available: menuItemData.available ?? true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Menu API POST: Database error:", error)
      throw error
    }

    console.log("[v0] Menu API POST: Successfully created menu item:", menuItem.menu_id)

    return NextResponse.json({
      success: true,
      menuItem,
      message: "Menu item created successfully",
    })
  } catch (error) {
    console.error("[v0] Menu API POST: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create menu item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  console.log("[v0] ========== Menu API PATCH: Request received ==========")

  try {
    const supabase = createClient()
    const { menu_id, ...updateData } = await request.json() // Changed from id to menu_id

    if (!menu_id) {
      // Changed from id to menu_id
      return NextResponse.json(
        {
          success: false,
          error: "Menu item ID is required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Menu API PATCH: Updating menu item:", menu_id) // Changed from id to menu_id

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("menu_id", menu_id) // Changed from id to menu_id
      .select()
      .single()

    if (error) {
      console.error("[v0] Menu API PATCH: Database error:", error)
      throw error
    }

    console.log("[v0] Menu API PATCH: Successfully updated menu item:", menuItem.menu_id) // Changed from id to menu_id

    return NextResponse.json({
      success: true,
      menuItem,
      message: "Menu item updated successfully",
    })
  } catch (error) {
    console.error("[v0] Menu API PATCH: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update menu item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[v0] ========== Menu API DELETE: Request received ==========")

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const menu_id = searchParams.get("menu_id") // Changed from id to menu_id

    if (!menu_id) {
      // Changed from id to menu_id
      return NextResponse.json(
        {
          success: false,
          error: "Menu item ID is required",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Menu API DELETE: Deleting menu item:", menu_id) // Changed from id to menu_id

    const { error } = await supabase.from("menu_items").delete().eq("menu_id", menu_id) // Changed from id to menu_id

    if (error) {
      console.error("[v0] Menu API DELETE: Database error:", error)
      throw error
    }

    console.log("[v0] Menu API DELETE: Successfully deleted menu item:", menu_id) // Changed from id to menu_id

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Menu API DELETE: Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete menu item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
