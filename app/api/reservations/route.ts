import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { name, email, phone, date, time, guests, specialRequests, user_id } = body

    console.log("[v0] Received reservation request:", { name, email, phone, date, time, guests, user_id })

    if (!name || !phone || !date || !time || !guests) {
      return NextResponse.json({ error: "Missing required fields: name, phone, date, time, guests" }, { status: 400 })
    }

    // Validate guest count
    const guestCount = Number.parseInt(guests)
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
      return NextResponse.json({ error: "Guest count must be between 1 and 20" }, { status: 400 })
    }

    // Validate date (must be today or future)
    const reservationDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (reservationDate < today) {
      return NextResponse.json({ error: "Reservation date cannot be in the past" }, { status: 400 })
    }

    const reservationData = {
      name: name.trim(),
      phone: phone.trim(),
      date,
      time,
      people_count: guestCount,
      user_id: user_id || null,
      status: "pending",
      table: "TBD",
      notes: specialRequests || "",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to insert reservation:", reservationData)
    if (email) console.log("[v0] Email provided (not stored):", email)

    const { data, error } = await supabase.from("reservations").insert([reservationData]).select().single()

    if (error) {
      console.error("[v0] Supabase reservation insert error:", error)
      return NextResponse.json(
        {
          error: "Failed to create reservation. Please try again.",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Reservation created successfully:", data)

    return NextResponse.json(
      {
        success: true,
        message: "Reservation created successfully",
        reservation: {
          id: data.reservation_id,
          name: data.name,
          phone: data.phone,
          date: data.date,
          time: data.time,
          guests: data.people_count,
          status: data.status,
          table: data.table,
          notes: data.notes,
          created_at: data.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Reservation API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    console.log("[v0] Fetching reservations, user_id:", userId)

    let query = supabase.from("reservations").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Supabase reservation fetch error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch reservations",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Reservations fetched successfully:", data?.length || 0, "records")

    return NextResponse.json({
      success: true,
      reservations: data || [],
    })
  } catch (error) {
    console.error("[v0] Reservation GET API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { reservationId, status, table, notes } = await request.json()

    if (!reservationId) {
      return NextResponse.json({ error: "Reservation ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating reservation:", { reservationId, status, table, notes })

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (table) updateData.table = table
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("reservation_id", reservationId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Reservation update error:", error)
      return NextResponse.json(
        {
          error: "Failed to update reservation",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Reservation updated successfully:", data)

    return NextResponse.json({
      success: true,
      message: "Reservation updated successfully",
      reservation: data,
    })
  } catch (error) {
    console.error("[v0] Reservation PATCH API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
