import { getSupabaseClient } from "@/lib/supabase"

// Using getSupabaseClient() instead of createClient for server-side operations
const supabase = getSupabaseClient()
