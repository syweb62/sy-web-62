import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "supabase-auth-token",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-web",
      },
    },
  })
}
