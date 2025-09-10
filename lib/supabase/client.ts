import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 5, // Reduced for production stability
        },
        heartbeatIntervalMs: 30000, // Increased for production
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000), // More conservative reconnection
        timeout: 20000, // Increased timeout for production
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
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      },
      db: {
        schema: "public",
      },
    },
  )

  return supabaseClient
}
