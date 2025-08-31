import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

console.log("[v0] Orders update API route loaded")

export async function POST(request: NextRequest) {
  console.log("[v0] ========== API UPDATE REQUEST RECEIVED ==========")
  console.log("[v0] Request time:", new Date().toISOString())

  try {
    const { id, status } = await request.json()
    console.log("[v0] API Update requested:", { id, status })

    if (!id || !status) {
      console.error("[v0] ❌ Invalid payload:", { id, status })
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select()

    if (error) {
      console.error("[v0] ❌ Supabase update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] ✅ Order updated:", data[0])
    return NextResponse.json({ success: true, order: data[0] })
  } catch (err) {
    console.error("[v0] ❌ Handler exception:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
