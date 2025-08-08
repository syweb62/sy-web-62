"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

interface Order {
  id: string
  date: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  items: OrderItem[]
  subtotal: number
  tax: number
  delivery: number
  total: number
  deliveryType: "pickup" | "delivery"
}

const ORDERS_PER_PAGE = 5

// Mock data for fallback
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    date: "2024-01-15T18:30:00Z",
    status: "delivered",
    deliveryType: "delivery",
    items: [
      {
        id: "1",
        name: "Dragon Roll",
        quantity: 2,
        price: 14.99,
        image: "/placeholder.svg?height=100&width=100&text=Dragon+Roll",
      },
      {
        id: "2",
        name: "Salmon Sashimi",
        quantity: 1,
        price: 18.99,
        image: "/placeholder.svg?height=100&width=100&text=Salmon+Sashimi",
      },
    ],
    subtotal: 48.97,
    tax: 4.4,
    delivery: 3.99,
    total: 57.36,
  },
  {
    id: "ORD-002",
    date: "2024-01-12T19:15:00Z",
    status: "preparing",
    deliveryType: "pickup",
    items: [
      {
        id: "3",
        name: "California Roll",
        quantity: 3,
        price: 8.99,
        image: "/placeholder.svg?height=100&width=100&text=California+Roll",
      },
      {
        id: "4",
        name: "Miso Soup",
        quantity: 2,
        price: 4.99,
        image: "/placeholder.svg?height=100&width=100&text=Miso+Soup",
      },
    ],
    subtotal: 36.95,
    tax: 3.33,
    delivery: 0.0,
    total: 40.28,
  }
]

export function useOrderHistory() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('Fetching orders for user:', user?.id)
        
        if (!user) {
          console.log('No user found, clearing orders')
          setOrders([])
          return
        }

        if (!supabase) {
          console.log('Supabase not available, using mock data')
          setOrders(MOCK_ORDERS)
          return
        }

        // Fetch orders from Supabase
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            order_id,
            created_at,
            status,
            total_price,
            subtotal,
            vat,
            delivery_charge,
            payment_method,
            customer_name,
            phone,
            address
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersError) {
          console.error('Error fetching orders:', ordersError)
          // Fallback to mock data on error
          console.log('Using mock data due to error')
          setOrders(MOCK_ORDERS)
          return
        }

        console.log('Fetched orders from Supabase:', ordersData)

        if (!ordersData || ordersData.length === 0) {
          console.log('No orders found, using mock data for demo')
          setOrders(MOCK_ORDERS)
          return
        }

        // Transform Supabase data to match our Order interface
        const transformedOrders: Order[] = await Promise.all(
          ordersData.map(async (order) => {
            // Fetch order items for each order
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                quantity,
                price_at_purchase,
                item_name,
                item_image
              `)
              .eq('order_id', order.order_id)

            if (itemsError) {
              console.error('Error fetching order items:', itemsError)
            }

            const items: OrderItem[] = (itemsData || []).map((item: any, index: number) => ({
              id: `${order.order_id}-${index}`,
              name: item.item_name || 'Unknown Item',
              quantity: item.quantity || 1,
              price: item.price_at_purchase || 0,
              image: item.item_image || "/placeholder.svg?height=100&width=100&text=Item",
            }))

            // Map status from database to our interface
            const statusMap: Record<string, Order['status']> = {
              'pending': 'pending',
              'processing': 'preparing',
              'completed': 'delivered',
              'cancelled': 'cancelled'
            }

            return {
              id: order.order_id,
              date: order.created_at,
              status: statusMap[order.status] || 'confirmed',
              items,
              subtotal: order.subtotal || 0,
              tax: order.vat || 0,
              delivery: order.delivery_charge || 0,
              total: order.total_price || 0,
              deliveryType: order.payment_method === 'delivery' ? 'delivery' : 'pickup',
            }
          })
        )

        console.log('Transformed orders:', transformedOrders)
        setOrders(transformedOrders)
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err instanceof Error ? err.message : "Failed to fetch orders")
        // Fallback to mock data on error
        setOrders(MOCK_ORDERS)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return []
    }

    let filtered = [...orders]

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchLower) ||
          (order.items && Array.isArray(order.items) && order.items.some((item) => 
            item.name && item.name.toLowerCase().includes(searchLower)
          ))
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    return filtered
  }, [orders, searchTerm, statusFilter])

  // Pagination
  const safeFilteredOrders = Array.isArray(filteredOrders) ? filteredOrders : []
  const totalPages = Math.ceil(safeFilteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = safeFilteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE, 
    currentPage * ORDERS_PER_PAGE
  )

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCurrentPage(1)
  }

  const hasActiveFilters = (searchTerm && searchTerm.trim() !== "") || (statusFilter && statusFilter !== "all")

  const reorderItems = async (items: OrderItem[]) => {
    try {
      console.log('Reordering items:', items)
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('No items to reorder')
      }
      
      for (const item of items) {
        if (item && item.id && item.name && typeof item.price === 'number' && typeof item.quantity === 'number') {
          addItem(
            {
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image || "/placeholder.svg?height=100&width=100",
            },
            item.quantity
          )
        }
      }

      toast({
        title: "Items added to cart",
        description: `${items.length} item${items.length !== 1 ? "s" : ""} added to your cart`,
      })
    } catch (err) {
      console.error('Error reordering items:', err)
      toast({
        title: "Error",
        description: "Failed to add items to cart",
        variant: "destructive",
      })
    }
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  return {
    orders: paginatedOrders || [],
    filteredOrders: safeFilteredOrders,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    clearFilters,
    hasActiveFilters,
    reorderItems,
  }
}
