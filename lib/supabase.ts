import { createClient } from '@supabase/supabase-js'

// Your correct Supabase credentials for the Vercel auto-connected project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjoelkxkcwtzmbyswfhu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2Vsa3hrY3d0em1ieXN3Zmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTMwMTksImV4cCI6MjA3MDEyOTAxOX0.xY2bVHrv_gl4iEHY79f_PC1OJxjHbHWYoqiSkrpi5n8'

// Lazy initialization - only create client when needed
let supabaseClient: any = null
let initializationError: string | null = null
let isInitialized = false

function getSupabaseClient() {
  if (isInitialized) {
    return { client: supabaseClient, error: initializationError }
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      initializationError = 'Missing Supabase URL or API key'
      isInitialized = true
      return { client: null, error: initializationError }
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    isInitialized = true
    return { client: supabaseClient, error: null }
  } catch (error) {
    initializationError = error instanceof Error ? error.message : 'Failed to create Supabase client'
    isInitialized = true
    console.error('Supabase initialization error:', error)
    return { client: null, error: initializationError }
  }
}

// Export a safe getter for the client
export const supabase = new Proxy({}, {
  get(target, prop) {
    const { client, error } = getSupabaseClient()
    if (!client) {
      throw new Error(error || 'Supabase client not available')
    }
    return client[prop]
  }
})

// Server-side client for admin operations (only available on server)
export const supabaseAdmin = typeof window === 'undefined' 
  ? (() => {
      try {
        return createClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
        )
      } catch {
        return null
      }
    })()
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
    const { client, error: initError } = getSupabaseClient()
    
    if (!client) {
      return {
        connected: false,
        status: 'client_not_initialized',
        error: initError || 'Supabase client not initialized',
        config: getSupabaseConfig()
      }
    }

    // Test connection by trying to access a simple query
    const { data, error } = await client
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
  const { client, error } = getSupabaseClient()
  return !!(supabaseUrl && supabaseAnonKey && client && !error)
}

// Helper function to get environment info for debugging
export function getSupabaseConfig() {
  const { client, error } = getSupabaseClient()
  
  return {
    url: supabaseUrl || 'Not set',
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set',
    hasAnonKey: !!supabaseAnonKey,
    anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not set',
    clientCreated: !!client,
    isConfigured: isSupabaseConfigured(),
    projectId: supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : 'Unknown',
    initializationError: error
  }
}

// Safe wrapper for database operations
function withSupabaseClient<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const { client, error } = getSupabaseClient()
  if (!client) {
    throw new Error(error || 'Supabase client not available')
  }
  return operation(client)
}

// Helper functions for common database operations
export const menuItemsService = {
  async getAll() {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
      
      if (error) throw error
      return data as MenuItem[]
    })
  },

  async getByCategory(category: string) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data as MenuItem[]
    })
  },

  async getById(id: string) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as MenuItem
    })
  }
}

export const ordersService = {
  async create(order: Omit<Order, 'order_id' | 'created_at'>) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('orders')
        .insert(order)
        .select()
        .single()
      
      if (error) throw error
      return data as Order
    })
  },

  async getByUserId(userId: string) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Order[]
    })
  },

  async updateStatus(orderId: string, status: Order['status']) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('orders')
        .update({ status })
        .eq('order_id', orderId)
        .select()
        .single()
      
      if (error) throw error
      return data as Order
    })
  }
}

export const reservationsService = {
  async create(reservation: Omit<Reservation, 'reservation_id' | 'created_at'>) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('reservations')
        .insert(reservation)
        .select()
        .single()
      
      if (error) throw error
      return data as Reservation
    })
  },

  async getByUserId(userId: string) {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
      
      if (error) throw error
      return data as Reservation[]
    })
  }
}

export const socialMediaService = {
  async getAll() {
    return withSupabaseClient(async (client) => {
      const { data, error } = await client
        .from('social_media_links')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      return data as SocialMediaLink[]
    })
  }
}
