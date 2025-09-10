import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname.includes("supabase.co") &&
      urlObj.pathname.includes("/storage/v1/object/public/") &&
      !url.includes(".lic") && // Exclude malformed domains like pjoelkxkcwtzmb.lic
      url.length > 50 && // Ensure URL is not truncated
      urlObj.protocol === "https:"
    ) // Ensure secure protocol
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API: Starting image upload with service role")

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file || !fileName) {
      console.log("[v0] Upload API: Missing file or fileName")
      return NextResponse.json({ error: "Missing file or fileName" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      console.log("[v0] Upload API: Invalid file type:", file.type)
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      console.log("[v0] Upload API: File too large:", file.size)
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    console.log("[v0] Upload API: Processing file:", fileName, "Size:", file.size, "Type:", file.type)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("[v0] Upload API: Buffer created, size:", buffer.length)

    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "menu-images")

    if (!bucketExists) {
      console.log("[v0] Upload API: Creating menu-images bucket")
      const { error: createError } = await supabaseAdmin.storage.createBucket("menu-images", {
        public: true,
        allowedMimeTypes: allowedTypes,
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        console.log("[v0] Upload API: Failed to create bucket:", createError.message)
        return NextResponse.json({ error: "Failed to create storage bucket" }, { status: 500 })
      }
    }

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

    const { data: urlData } = supabaseAdmin.storage.from("menu-images").getPublicUrl(data.path)
    const publicUrl = urlData.publicUrl

    console.log("[v0] Upload API: Generated URL:", publicUrl)

    let finalUrl = publicUrl

    if (!isValidSupabaseUrl(publicUrl)) {
      console.log("[v0] Upload API: Invalid URL generated, creating fallback")
      finalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${data.path}`
      console.log("[v0] Upload API: Fallback URL:", finalUrl)

      // Validate fallback URL too
      if (!isValidSupabaseUrl(finalUrl)) {
        console.log("[v0] Upload API: Fallback URL also invalid, trying direct construction")
        // Try direct URL construction as last resort
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl && supabaseUrl.includes("supabase.co")) {
          finalUrl = `${supabaseUrl}/storage/v1/object/public/menu-images/${data.path}`

          if (!isValidSupabaseUrl(finalUrl)) {
            console.log("[v0] Upload API: All URL generation methods failed")
            return NextResponse.json({ error: "Failed to generate valid image URL" }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: "Invalid Supabase configuration" }, { status: 500 })
        }
      }
    }

    console.log("[v0] Upload API: Final valid URL:", finalUrl)

    return NextResponse.json({
      success: true,
      path: data.path,
      url: finalUrl,
    })
  } catch (error: any) {
    console.log("[v0] Upload API: Unexpected error:", error?.message || "Unknown error")
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
