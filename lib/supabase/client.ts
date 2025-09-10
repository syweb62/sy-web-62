import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as any).__PUBLIC_ENV?.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://pjoelkxkcwtzmbyswfhu.supabase.co"

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && (window as any).__PUBLIC_ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Missing Supabase configuration")
  }

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 2, // Further reduced for production stability
      },
      heartbeatIntervalMs: 45000, // Increased for better production stability
      reconnectAfterMs: (tries: number) => Math.min(tries * 2000, 30000), // More conservative reconnection
      timeout: 30000, // Increased timeout for production
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "supabase-auth-token",
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-web",
        apikey: supabaseAnonKey,
      },
    },
    db: {
      schema: "public",
    },
  })

  return supabaseClient
}
