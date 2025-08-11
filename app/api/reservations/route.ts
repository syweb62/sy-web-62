import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, date, time, guests, specialRequests, user_id } = body

    // Validate required fields
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
      user_id: user_id || null, // Allow null for guest reservations
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("reservations").insert([reservationData]).select().single()

    if (error) {
      console.error("Supabase reservation insert error:", error)
      return NextResponse.json({ error: "Failed to create reservation. Please try again." }, { status: 500 })
    }

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
          created_at: data.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Reservation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    let query = supabase.from("reservations").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Supabase reservation fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reservations: data || [],
    })
  } catch (error) {
    console.error("Reservation GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
