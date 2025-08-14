import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pjoelkxkcwtzmbyswfhu.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2Vsa3hrY3d0em1ieXN3Zmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTMwMTksImV4cCI6MjA3MDEyOTAxOX0.xY2bVHrv_gl4iEHY79f_PC1OJxjHbHWYoqiSkrpi5n8"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables")
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Timezone": "Asia/Dhaka",
    },
  },
})

// Client-side supabase client (browser)
export function getSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "X-Client-Timezone": "Asia/Dhaka",
      },
    },
  })
}

// Convert UTC timestamp to Bangladesh time
export function convertToBangladeshTime(utcTimestamp: string | Date): Date {
  const date = typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }))
}

// Format timestamp for Bangladesh locale
export function formatBangladeshTime(timestamp: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }

  return date.toLocaleString("en-BD", { ...defaultOptions, ...options })
}

// Get current Bangladesh time
export function getBangladeshTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }))
}

// Format date for Bangladesh display
export function formatBangladeshDate(timestamp: string | Date): string {
  return formatBangladeshTime(timestamp, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format time for Bangladesh display
export function formatBangladeshTimeOnly(timestamp: string | Date): string {
  return formatBangladeshTime(timestamp, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

// Create order with items
export async function createOrderWithItems(orderData: any, orderItems: any[]) {
  try {
    // Create order first
    const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

    if (orderError) {
      throw orderError
    }

    // Create order items if any
    if (orderItems && orderItems.length > 0) {
      const itemsWithOrderId = orderItems.map((item) => ({
        ...item,
        order_id: order.order_id,
      }))

      const { data: items, error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId).select()

      if (itemsError) {
        console.warn("Error creating order items:", itemsError)
        // Continue anyway - order was created successfully
      }

      return { order, items }
    }

    return { order, items: [] }
  } catch (error) {
    console.error("Error creating order with items:", error)
    throw error
  }
}

// Test supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("menu_items").select("id").limit(1)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return { status: "disconnected", error: error.message }
    }

    // Test timezone functionality
    const bangladeshTime = getBangladeshTime()
    const formattedTime = formatBangladeshTime(bangladeshTime)

    console.log("Supabase connection test successful")
    console.log("Bangladesh time:", formattedTime)

    return {
      status: "connected",
      data,
      timezone: {
        current: formattedTime,
        zone: "Asia/Dhaka",
      },
    }
  } catch (error) {
    console.error("Supabase connection test error:", error)
    return { status: "disconnected", error: String(error) }
  }
}

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

export default supabase
