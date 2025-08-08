import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create the Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null

// Server-side client for admin operations (only available on server)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(
      supabaseUrl || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Types for our database tables
export interface Profile {
  id: string
  email: string
  full_name?: string
  name?: string // Add name field for navbar compatibility
  avatar_url?: string
  phone?: string
  address?: string // Added address field
  role?: 'user' | 'admin'
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
export async function testSupabaseConnection() {
  if (!supabase) {
    return {
      connected: false,
      status: 'disconnected' as const,
      error: 'Supabase client not initialized - missing environment variables',
      config: getSupabaseConfig()
    }
  }

  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return {
        connected: false,
        status: 'disconnected' as const,
        error: error.message,
        config: getSupabaseConfig()
      }
    }

    console.log('Supabase connection successful')
    return {
      connected: true,
      status: 'connected' as const,
      data,
      config: getSupabaseConfig()
    }
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return {
      connected: false,
      status: 'disconnected' as const,
      error: error instanceof Error ? error.message : 'Unknown connection error',
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
    projectId: supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : 'Unknown',
    initializationError: !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL not set' : 
                        !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set' : null
  }
}

// Helper functions for common database operations
export const menuItemsService = {
  async getAll() {
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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
    if (!supabase) throw new Error('Supabase not initialized')
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

// Profile service for better organization
export const profileService = {
  async getById(userId: string) {
    if (!supabase) throw new Error('Supabase not initialized')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data as Profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  async update(userId: string, updates: Partial<Profile>) {
    if (!supabase) throw new Error('Supabase not initialized')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data as Profile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    if (!supabase) throw new Error('Supabase not initialized')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data as Profile
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  }
}
