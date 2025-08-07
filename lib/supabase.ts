import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bncgfivqfuryyyxbvzhp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuY3pnZml2cWZ1cnl5eGJ2emhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI3ODYsImV4cCI6MjA3MDEyODc4Nn0.gq24PaaaO9yd7Z5MZpuwjt5Fpk-eL1UI01DYP8n_4h4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
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

// Helper functions for common database operations
export const menuItemsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('category', { ascending: true })
    
    if (error) throw error
    return data as MenuItem[]
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data as MenuItem[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as MenuItem
  }
}

export const ordersService = {
  async create(order: Omit<Order, 'order_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (error) throw error
    return data as Order
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Order[]
  },

  async updateStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data as Order
  }
}

export const reservationsService = {
  async create(reservation: Omit<Reservation, 'reservation_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select()
      .single()
    
    if (error) throw error
    return data as Reservation
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    
    if (error) throw error
    return data as Reservation[]
  }
}

export const socialMediaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('social_media_links')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) throw error
    return data as SocialMediaLink[]
  }
}
