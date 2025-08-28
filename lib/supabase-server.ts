import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pjoelkxkcwtzmbyswfhu.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2Vsa3hrY3d0em1ieXN3Zmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTMwMTksImV4cCI6MjA3MDEyOTAxOX0.xY2bVHrv_gl4iEHY79f_PC1OJxjHbHWYoqiSkrpi5n8"

// Server-side supabase client
export function getSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    global: {
      headers: {
        "X-Client-Timezone": "Asia/Dhaka",
      },
    },
  })
}

// Added alias export for consistency with API routes
export const createSupabaseServerClient = getSupabaseClient

export const createClient = getSupabaseClient
