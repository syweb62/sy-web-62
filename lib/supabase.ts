"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Read public env (required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: SupabaseClient | null = null

function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error(
      "Supabase URL/Anon key missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * ব্রাউজারে Supabase ক্লায়েন্ট সিঙ্গেলটন
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// Optional named export to preserve existing imports
export const supabase = getSupabaseBrowserClient()

// Server-side client for admin operations (service role bypasses RLS)
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(supabaseUrl || "", process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "", {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

// Types
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
  user_id?: string
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

/**
 * নিরপেক্ষ হেলথ-চেক: profiles নয়, menu_items এ HEAD select
 * লক্ষ্য: RLS recursion এ না পড়া।
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = getSupabaseBrowserClient()
    // menu_items টেবিলটি v7 স্কিমা অনুযায়ী পাবলিক রিডেবল/নন-RLS রাখা হয়েছে।
    const { error, status } = await supabase.from("menu_items").select("id", { head: true, count: "exact" })

    if (error) {
      return { ok: false, message: `Connection OK but query error: ${error.message}` }
    }

    return { ok: true, message: `Connected (status ${status})` }
  } catch (err: any) {
    return { ok: false, message: `Connection failed: ${err?.message || String(err)}` }
  }
}

/**
 * হালকা হেল্পার: কারেন্ট ইউজার রিটার্ন
 */
export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    return { user: null, error }
  }
  return { user: data.user, error: null }
}

// Services
export const menuItemsService = {
  async getAll() {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("category", { ascending: true })
    if (error) throw error
    return data as MenuItem[]
  },
  async getByCategory(category: string) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("category", category)
      .eq("is_available", true)
      .order("name", { ascending: true })
    if (error) throw error
    return data as MenuItem[]
  },
  async getById(id: string) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.from("menu_items").select("*").eq("id", id).single()
    if (error) throw error
    return data as MenuItem
  },
}

export const ordersService = {
  async create(order: Omit<Order, "order_id" | "created_at">) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.from("orders").insert(order).select().single()
    if (error) throw error
    return data as Order
  },
  async getByUserId(userId: string) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as Order[]
  },
  async updateStatus(orderId: string, status: Order["status"]) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.from("orders").update({ status }).eq("order_id", orderId).select().single()
    if (error) throw error
    return data as Order
  },
}

export const reservationsService = {
  async create(reservation: Omit<Reservation, "reservation_id" | "created_at">) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.from("reservations").insert(reservation).select().single()
    if (error) throw error
    return data as Reservation
  },
  async getByUserId(userId: string) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
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
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("social_media_links")
      .select("*")
      .order("display_order", { ascending: true })
    if (error) throw error
    return data as SocialMediaLink[]
  },
}

export const profileService = {
  async getById(userId: string) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single()
    if (error) throw error
    return data as Profile
  },
  async update(userId: string, updates: Partial<Profile>) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },
  async create(profile: Omit<Profile, "created_at" | "updated_at">) {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from("profiles")
      .insert({
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },
}
