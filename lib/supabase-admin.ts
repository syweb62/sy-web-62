import { createClient } from "@supabase/supabase-js"

type AdminClient = ReturnType<typeof createClient>

// Server-only admin client for privileged operations.
// Uses SUPABASE_SERVICE_ROLE_KEY which must NEVER be exposed to the client.
let adminClient: AdminClient | null = null

export function getSupabaseAdminClient(): AdminClient {
  if (adminClient) return adminClient

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client is not configured. Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
