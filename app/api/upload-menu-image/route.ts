import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API: Starting image upload with service role")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file || !fileName) {
      console.log("[v0] Upload API: Missing file or fileName")
      return NextResponse.json({ error: "Missing file or fileName" }, { status: 400 })
    }

    console.log("[v0] Upload API: Processing file:", fileName, "Size:", file.size, "Type:", file.type)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("[v0] Upload API: Buffer created, size:", buffer.length)

    // Upload to Supabase storage using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage.from("menu-images").upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.log("[v0] Upload API: Supabase upload error:", error.message)
      return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 })
    }

    console.log("[v0] Upload API: Upload successful:", data.path)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("menu-images").getPublicUrl(data.path)

    console.log("[v0] Upload API: Public URL generated:", urlData.publicUrl)

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    })
  } catch (error) {
    console.log("[v0] Upload API: Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
