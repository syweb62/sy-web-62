import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupMalformedImageUrls() {
  console.log("[v0] Starting cleanup of malformed image URLs...")

  try {
    // Get all menu items with image URLs
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("menu_id, name, image_url")
      .not("image_url", "is", null)

    if (error) {
      console.error("[v0] Error fetching menu items:", error)
      return
    }

    console.log(`[v0] Found ${menuItems?.length || 0} menu items with image URLs`)

    let cleanedCount = 0

    for (const item of menuItems || []) {
      const imageUrl = item.image_url

      // Check if URL is malformed (doesn't contain proper supabase domain)
      if (imageUrl && !imageUrl.includes("supabase.co/storage/v1/object/public/")) {
        console.log(`[v0] Cleaning malformed URL for ${item.name}: ${imageUrl}`)

        // Set image_url to null for malformed URLs
        const { error: updateError } = await supabase
          .from("menu_items")
          .update({ image_url: null })
          .eq("menu_id", item.menu_id)

        if (updateError) {
          console.error(`[v0] Error updating ${item.name}:`, updateError)
        } else {
          cleanedCount++
          console.log(`[v0] Cleaned URL for ${item.name}`)
        }
      }
    }

    console.log(`[v0] Cleanup completed. Cleaned ${cleanedCount} malformed URLs.`)
  } catch (error) {
    console.error("[v0] Cleanup script error:", error)
  }
}

// Run the cleanup
cleanupMalformedImageUrls()
