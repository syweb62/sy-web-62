import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API: Starting request processing")

    // Use service role key for admin operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Upload API: Parsing FormData")
    const formData = await request.formData()

    console.log("[v0] Upload API: Extracting file and fileName")
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    console.log("[v0] Upload API: File type:", typeof file, "File name:", fileName)
    console.log("[v0] Upload API: File instanceof File:", file instanceof File)
    console.log("[v0] Upload API: File size:", file?.size, "File type:", file?.type)

    if (!file || !fileName) {
      console.log("[v0] Upload API: Missing file or fileName")
      return NextResponse.json({ error: "File and fileName are required" }, { status: 400 })
    }

    console.log("[v0] Uploading image via server:", fileName)

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(fileBuffer)

    console.log("[v0] Upload API: Buffer created, size:", buffer.length)

    // Upload to storage using service role
    const { data, error } = await supabaseAdmin.storage.from("menu-images").upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      const errorMessage = error.message || error.error || "Upload failed"
      console.log("[v0] Upload error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("menu-images").getPublicUrl(fileName)

    console.log("[v0] Upload successful:", urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error: any) {
    console.log("[v0] Upload API: Unexpected error type:", typeof error)
    console.log("[v0] Upload API: Unexpected error constructor:", error?.constructor?.name)
    const errorMessage = error?.message || error?.error || String(error) || "Internal server error"
    console.log("[v0] Unexpected error:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
