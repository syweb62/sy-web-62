import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 15000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000),
      timeout: 10000,
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
  })
}
