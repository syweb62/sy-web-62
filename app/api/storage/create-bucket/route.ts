import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Creating menu-images storage bucket...")

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      console.log("[v0] Error listing buckets:", listError)
      return NextResponse.json({ error: "Failed to check existing buckets" }, { status: 500 })
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "menu-images")

    if (bucketExists) {
      console.log("[v0] Bucket menu-images already exists")
      return NextResponse.json({ success: true, message: "Bucket already exists" })
    }

    // Create the bucket
    const { data, error } = await supabaseAdmin.storage.createBucket("menu-images", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 5242880, // 5MB
    })

    if (error) {
      console.log("[v0] Error creating bucket:", error)
      return NextResponse.json({ error: "Failed to create storage bucket" }, { status: 500 })
    }

    console.log("[v0] Successfully created menu-images bucket")
    return NextResponse.json({ success: true, message: "Bucket created successfully" })
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
