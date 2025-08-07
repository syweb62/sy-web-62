import { createClient } from '@supabase/supabase-js'

// Your correct Supabase credentials for the Vercel auto-connected project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjoelkxkcwtzmbyswfhu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2Vsa3hrY3d0em1ieXN3Zmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTMwMTksImV4cCI6MjA3MDEyOTAxOX0.xY2bVHrv_gl4iEHY79f_PC1OJxjHbHWYoqiSkrpi5n8'

// Validate that we have the required credentials
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client for admin operations (only available on server)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
    )
  : null

// Types for our database tables
export interface Profile {
  id: string
  full_name?: string
  email: string
  avatar_url?: string
  phone?: string
  address?: string
  role: 'user' | 'admin'
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
  user_id?: string
  customer_name?: string
  phone?: string
  address?: string
  payment_method?: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total_price: number
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  message?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
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

// Function to test Supabase connection
export async function testSupabaseConnection(): Promise<{
  connected: boolean
  status: string
  error: string | null
  config?: any
}> {
  try {
    // First check if client is properly initialized
    if (!supabase) {
      return {
        connected: false,
        status: 'client_error',
        error: 'Supabase client not initialized'
      }
    }

    // Test connection by trying to access a simple query
    const { data, error } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1)

    if (error) {
      // Check if it's a table not found error
      if (error.message.includes('relation "public.menu_items" does not exist') || 
          error.message.includes('table "public.menu_items" does not exist')) {
        return {
          connected: true,
          status: 'connected_no_tables',
          error: 'Connected to Supabase but database tables do not exist. Please run the setup script in your Supabase SQL editor.',
          config: getSupabaseConfig()
        }
      }

      return {
        connected: false,
        status: 'query_error',
        error: `Database query failed: ${error.message}`,
        config: getSupabaseConfig()
      }
    }

    return {
      connected: true,
      status: 'connected',
      error: null,
      config: getSupabaseConfig()
    }
  } catch (error) {
    return {
      connected: false,
      status: 'connection_error',
      error: error instanceof Error ? error.message : 'Unknown connection error occurred',
      config: getSupabaseConfig()
    }
  }
}

// Function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

// Helper function to get environment info for debugging
export function getSupabaseConfig() {
  return {
    url: supabaseUrl || 'Not set',
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set',
    hasAnonKey: !!supabaseAnonKey,
    anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not set',
    clientCreated: !!supabase,
    isConfigured: isSupabaseConfigured(),
    projectId: supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : 'Unknown'
  }
}

// Helper functions for common database operations
export const menuItemsService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
      
      if (error) throw error
      return data as MenuItem[]
    } catch (error) {
      console.error('Error fetching menu items:', error)
      throw error
    }
  },

  async getByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data as MenuItem[]
    } catch (error) {
      console.error('Error fetching menu items by category:', error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as MenuItem
    } catch (error) {
      console.error('Error fetching menu item by ID:', error)
      throw error
    }
  }
}

export const ordersService = {
  async create(order: Omit<Order, 'order_id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single()
      
      if (error) throw error
      return data as Order
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  },

  async getByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Order[]
    } catch (error) {
      console.error('Error fetching orders by user ID:', error)
      throw error
    }
  },

  async updateStatus(orderId: string, status: Order['status']) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', orderId)
        .select()
        .single()
      
      if (error) throw error
      return data as Order
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }
}

export const reservationsService = {
  async create(reservation: Omit<Reservation, 'reservation_id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single()
      
      if (error) throw error
      return data as Reservation
    } catch (error) {
      console.error('Error creating reservation:', error)
      throw error
    }
  },

  async getByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
      
      if (error) throw error
      return data as Reservation[]
    } catch (error) {
      console.error('Error fetching reservations by user ID:', error)
      throw error
    }
  }
}

export const socialMediaService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      return data as SocialMediaLink[]
    } catch (error) {
      console.error('Error fetching social media links:', error)
      throw error
    }
  }
}
