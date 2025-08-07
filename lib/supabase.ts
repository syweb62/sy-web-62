import { createClient } from "@supabase/supabase-js"

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

// Type definitions for your database schema
export type Profile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone: string | null
  address: string | null
  role: "user" | "admin" | null
  created_at: string
  updated_at: string
}

export type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  image_url: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
}

export type Order = {
  order_id: string
  user_id: string | null
  customer_name: string | null
  phone: string | null
  address: string | null
  payment_method: string | null
  status: "pending" | "processing" | "completed" | "cancelled" | null
  total_price: number
  subtotal: number | null
  discount: number | null
  vat: number | null
  delivery_charge: number | null
  message: string | null
  created_at: string
}

export type Reservation = {
  reservation_id: string
  user_id: string | null
  name: string
  phone: string
  date: string
  time: string
  people_count: number
  created_at: string
}

export type SocialMediaLink = {
  id: string
  platform_name: string
  link: string
  button_type: string | null
  display_order: number | null
  created_at: string
}

// Define the database schema for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      menu_items: {
        Row: MenuItem
        Insert: Partial<MenuItem>
        Update: Partial<MenuItem>
      }
      orders: {
        Row: Order
        Insert: Partial<Order>
        Update: Partial<Order>
      }
      order_items: {
        Row: OrderItem
        Insert: Partial<OrderItem>
        Update: Partial<OrderItem>
      }
      reservations: {
        Row: Reservation
        Insert: Partial<Reservation>
        Update: Partial<Reservation>
      }
      social_media_links: {
        Row: SocialMediaLink
        Insert: Partial<SocialMediaLink>
        Update: Partial<SocialMediaLink>
      }
    }
    Functions: {
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_profiles_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
  }
}

// Create Supabase client with proper error handling
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error)
}

export const supabase = supabaseClient

// Function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

// Function to test Supabase connection
export async function testSupabaseConnection(): Promise<{
  connected: boolean
  status: string
  error: string | null
}> {
  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      connected: false,
      status: 'configuration_error',
      error: 'Supabase environment variables are not properly configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    }
  }

  // Check if client was created successfully
  if (!supabase) {
    return {
      connected: false,
      status: 'client_error',
      error: 'Failed to create Supabase client. Please check your configuration.'
    }
  }

  try {
    // Test connection by trying to access a table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      // Check if it's a table not found error (which means connection works but tables don't exist)
      if (error.message.includes('relation "public.profiles" does not exist')) {
        return {
          connected: true,
          status: 'connected_no_tables',
          error: 'Connected to Supabase but database tables do not exist. Please run the setup script.'
        }
      }

      return {
        connected: false,
        status: 'query_error',
        error: `Database query failed: ${error.message}`
      }
    }

    return {
      connected: true,
      status: 'connected',
      error: null
    }
  } catch (error) {
    return {
      connected: false,
      status: 'connection_error',
      error: error instanceof Error ? error.message : 'Unknown connection error'
    }
  }
}

// Helper function to get environment info for debugging
export function getSupabaseConfig() {
  return {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set',
    anonKey: supabaseAnonKey ? 'Set (hidden)' : 'Not set',
    clientCreated: !!supabase,
    isConfigured: isSupabaseConfigured()
  }
}
