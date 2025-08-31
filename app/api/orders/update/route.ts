import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

console.log("[v0] Orders update API route loaded")

export async function POST(request: NextRequest) {
  console.log("[v0] ========== API UPDATE REQUEST RECEIVED ==========")
  console.log("[v0] Request time:", new Date().toISOString())

  try {
    const { orderId, status } = await request.json()
    console.log("[v0] API Update requested:", { orderId, status })

    const supabase = createClient()

    const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select().single()

    if (error) {
      console.error("[v0] API Update failed:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] API Update successful:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API Update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
