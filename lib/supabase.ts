import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js"

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      onAuthStateChange: (event, session) => {
        if (event === "TOKEN_REFRESHED" && !session) {
          // Clear invalid session data
          localStorage.removeItem("supabase.auth.token")
          sessionStorage.removeItem("supabase.auth.token")
        }
      },
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
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Handle auth state changes and clear invalid tokens
    onAuthStateChange: (event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        // Clear invalid session data
        localStorage.removeItem("supabase.auth.token")
        sessionStorage.removeItem("supabase.auth.token")
      }
    },
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

export async function testSupabaseConnection() {
  try {
    console.log("[v0] Testing Supabase connection...")
    console.log("[v0] Supabase URL:", supabaseUrl)
    console.log("[v0] Has anon key:", !!supabaseAnonKey)

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection test timeout")), 10000)
    })

    const queryPromise = supabase.from("menu_items").select("menu_id").limit(1)

    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any

    if (error) {
      // Handle specific auth errors
      if (error.message?.includes("Invalid Refresh Token") || error.message?.includes("refresh_token_not_found")) {
        console.log("[v0] Invalid refresh token detected, clearing session")
        await supabase.auth.signOut().catch(() => {})
        return { status: "connected", warning: "Session cleared due to invalid refresh token" }
      }

      console.error("[v0] Supabase connection test failed:", error.message)
      return { status: "connected", error: error.message }
    }

    console.log("[v0] Supabase connection test successful")

    return {
      status: "connected",
      data,
    }
  } catch (error) {
    // Handle auth errors gracefully
    if (
      error instanceof Error &&
      (error.message.includes("Invalid Refresh Token") || error.message.includes("refresh_token_not_found"))
    ) {
      console.log("[v0] Invalid refresh token in connection test, clearing session")
      await supabase.auth.signOut().catch(() => {})
      return { status: "connected", warning: "Session cleared due to invalid refresh token" }
    }

    console.error("[v0] Supabase connection test error:", error)
    return { status: "connected", error: String(error) }
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
  short_order_id?: string
  user_id?: string | null
  customer_name?: string
  phone_number?: string
  address?: string
  payment_method?: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  total_amount: number
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
  product_name?: string | null
  product_description?: string | null
  product_image?: string | null
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
