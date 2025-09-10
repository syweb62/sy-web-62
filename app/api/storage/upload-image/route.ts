import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API: Starting request processing")

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for service role client
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

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

    let uploadResult
    try {
      console.log("[v0] Upload API: Starting Supabase upload operation")
      uploadResult = await supabaseAdmin.storage.from("menu-images").upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
      console.log("[v0] Upload API: Supabase upload completed")
    } catch (uploadError) {
      console.log("[v0] Upload API: Supabase upload failed with exception")
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 })
    }

    const { data, error } = uploadResult

    if (error) {
      console.log("[v0] Upload API: Supabase error details:")
      console.log("[v0] Upload API: Error message:", error.message)
      console.log("[v0] Upload API: Error name:", error.name)
      console.log("[v0] Upload API: Error statusCode:", error.statusCode)
      return NextResponse.json(
        {
          error: "Storage upload error",
          details: error.message || "Unknown storage error",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Upload API: Upload successful, data:", data)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("menu-images").getPublicUrl(fileName)

    console.log("[v0] Upload successful:", urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error: any) {
    console.log("[v0] Upload API: Caught unexpected error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
