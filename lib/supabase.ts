import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

// Server-visible env (build/runtime on server)
const SERVER_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVER_PUBLIC_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
}

// Read browser-injected env if available (window.__PUBLIC_ENV)
// Safe on server (returns empty object)
function getBrowserEnv(): PublicEnv {
  if (typeof window === "undefined") return {}
  const w = window as unknown as { __PUBLIC_ENV?: PublicEnv }
  return w.__PUBLIC_ENV || {}
}

let browserSingleton: SupabaseClient | null = null

function resolvePublicCreds() {
  const be = getBrowserEnv()
  const url = SERVER_PUBLIC_URL || be.NEXT_PUBLIC_SUPABASE_URL || ""
  const anon = SERVER_PUBLIC_ANON || be.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return { url, anon }
}

function createSupabaseClientInternal(): SupabaseClient {
  const { url, anon } = resolvePublicCreds()
  if (!url || !anon) {
    // Lazy client: আমরা import টাইমে ক্র্যাশ না করে প্রথম ব্যবহারেই স্পষ্ট বার্তা দিই
    throw new Error(
      "Supabase public env missing. Expecting NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
}

/**
 * ব্রাউজারে Supabase ক্লায়েন্ট (সিঙ্গেলটন)
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserSingleton) {
    browserSingleton = createSupabaseClientInternal()
  }
  return browserSingleton
}

/**
 * Lazy proxy: import করার সাথে সাথে ক্লায়েন্ট বানায় না,
 * প্রথমবার প্রপার্টি/মেথডে অ্যাক্সেসের সময় ক্লায়েন্ট তৈরি করে।
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSupabaseBrowserClient()
    // @ts-ignore dynamic access
    const value = client[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
}) as SupabaseClient

// Server-side admin client (RLS bypass). Only created on the server.
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(
        SERVER_PUBLIC_URL || "",
        (process.env.SUPABASE_SERVICE_ROLE_KEY || SERVER_PUBLIC_ANON || "") as string,
        { auth: { autoRefreshToken: false, persistSession: false } },
      )
    : null

// ---- Types ----
export interface Profile {
  id: string
  email: string
  full_name?: string
  name?: string
  avatar_url?: string
  phone?: string
  address?: string
  role?: "user" | "admin"
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  order_id: string
  user_id?: string | null
  customer_name?: string
  phone?: string
  address?: string
  payment_method?: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total_price: number
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  message?: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  quantity: number
  price_at_purchase: number
  created_at: string
  item_name?: string | null
  item_description?: string | null
  item_image?: string | null
}

export interface Reservation {
  reservation_id: string
  user_id?: string | null
  name: string
  phone: string
  date: string
  time: string
  people_count: number
  created_at: string
}

export interface SocialMediaLink {
  id: string
  platform_name: string
  link: string
  button_type?: string
  display_order?: number
  created_at: string
}

// ---- Helpers ----

/**
 * নিরপেক্ষ হেলথ-চেক: profiles নয়, menu_items টেবিলে সিম্পল সিলেক্ট
 * (RLS recursion এড়াতে)
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getSupabaseBrowserClient()
    const { error } = await client.from("menu_items").select("id").limit(1)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}

/**
 * কারেন্ট ইউজার বের করার হেল্পার (named export হিসাবে)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.auth.getUser()
    if (error) return null
    return data.user ?? null
  } catch {
    return null
  }
}

// ---- Services ----
export const menuItemsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("category", { ascending: true })
    if (error) throw error
    return data as MenuItem[]
  },
  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("category", category)
      .eq("is_available", true)
      .order("name", { ascending: true })
    if (error) throw error
    return data as MenuItem[]
  },
  async getById(id: string) {
    const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).single()
    if (error) throw error
    return data as MenuItem
  },
}

export const ordersService = {
  async create(order: Omit<Order, "order_id" | "created_at">) {
    const { data, error } = await supabase.from("orders").insert(order).select().single()
    if (error) throw error
    return data as Order
  },
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as Order[]
  },
  async updateStatus(orderId: string, status: Order["status"]) {
    const { data, error } = await supabase.from("orders").update({ status }).eq("order_id", orderId).select().single()
    if (error) throw error
    return data as Order
  },
}

export const reservationsService = {
  async create(reservation: Omit<Reservation, "reservation_id" | "created_at">) {
    const { data, error } = await supabase.from("reservations").insert(reservation).select().single()
    if (error) throw error
    return data as Reservation
  },
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
    if (error) throw error
    return data as Reservation[]
  },
}

export const socialMediaService = {
  async getAll() {
    const { data, error } = await supabase
      .from("social_media_links")
      .select("*")
      .order("display_order", { ascending: true })
    if (error) throw error
    return data as SocialMediaLink[]
  },
}

export const profileService = {
  async getById(userId: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    if (error) throw error
    return data as Profile
  },
  async update(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },
  async create(profile: Omit<Profile, "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ ...profile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },
}
