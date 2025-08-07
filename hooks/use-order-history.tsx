"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"
import type { OrderFilters } from "@/components/order-filters"

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
      {
        id: "5",
        name: "Edamame",
        quantity: 1,
        price: 5.99,
        image: "/placeholder.svg?height=100&width=100&text=Edamame",
      },
    ],
    subtotal: 42.95,
    tax: 3.87,
    delivery: 0.0,
    total: 46.82,
  },
  {
    id: "ORD-003",
    date: "2024-01-10T20:00:00Z",
    status: "confirmed",
    deliveryType: "delivery",
    items: [
      {
        id: "6",
        name: "Spicy Tuna Roll",
        quantity: 1,
        price: 12.99,
        image: "/placeholder.svg?height=100&width=100&text=Spicy+Tuna",
      },
      {
        id: "7",
        name: "Chicken Teriyaki",
        quantity: 1,
        price: 16.99,
        image: "/placeholder.svg?height=100&width=100&text=Chicken+Teriyaki",
      },
    ],
    subtotal: 29.98,
    tax: 2.7,
    delivery: 3.99,
    total: 36.67,
  },
  {
    id: "ORD-004",
    date: "2024-01-08T17:45:00Z",
    status: "cancelled",
    deliveryType: "pickup",
    items: [
      {
        id: "8",
        name: "Rainbow Roll",
        quantity: 1,
        price: 15.99,
        image: "/placeholder.svg?height=100&width=100&text=Rainbow+Roll",
      },
    ],
    subtotal: 15.99,
    tax: 1.44,
    delivery: 0.0,
    total: 17.43,
  },
  {
    id: "ORD-005",
    date: "2024-01-05T19:30:00Z",
    status: "delivered",
    deliveryType: "delivery",
    items: [
      {
        id: "9",
        name: "Salmon Roll",
        quantity: 2,
        price: 10.99,
        image: "/placeholder.svg?height=100&width=100&text=Salmon+Roll",
      },
      {
        id: "10",
        name: "Tuna Sashimi",
        quantity: 1,
        price: 19.99,
        image: "/placeholder.svg?height=100&width=100&text=Tuna+Sashimi",
      },
      {
        id: "11",
        name: "Green Tea",
        quantity: 2,
        price: 2.99,
        image: "/placeholder.svg?height=100&width=100&text=Green+Tea",
      },
    ],
    subtotal: 47.96,
    tax: 4.32,
    delivery: 3.99,
    total: 56.27,
  },
]

const ORDERS_PER_PAGE = 5

export function useOrderHistory() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OrderFilters>({
    sortBy: "date",
    sortOrder: "desc",
  })

  // Simulate API call
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 600))

        if (!user) {
          throw new Error("User not authenticated")
        }

        setOrders(MOCK_ORDERS)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchTerm)),
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "total":
          comparison = a.total - b.total
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [orders, filters])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

  const updateFilters = (newFilters: Partial<OrderFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const reorderItems = async (items: OrderItem[]) => {
    try {
      for (const item of items) {
        addToCart(
          {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: "sushi",
            description: "",
          },
          item.quantity,
        )
      }

      toast({
        title: "Items added to cart",
        description: `${items.length} item${items.length !== 1 ? "s" : ""} added to your cart`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add items to cart",
        variant: "destructive",
      })
    }
  }

  return {
    orders: paginatedOrders,
    isLoading,
    error,
    filters,
    updateFilters,
    currentPage,
    totalPages,
    setCurrentPage,
    totalOrders: filteredOrders.length,
    reorderItems,
  }
}
