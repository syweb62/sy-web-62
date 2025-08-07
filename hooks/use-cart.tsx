"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define cart item type
export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  options?: {
    [key: string]: string
  }
}

// Define cart context type
type CartContextType = {
  cartItems: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

// Create cart context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart provider props
type CartProviderProps = {
  children: ReactNode
}

// Create cart provider
export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("sushiyaki_cart")
    if (storedCart) {
      setCartItems(JSON.parse(storedCart))
    }
  }, [])

  // Update localStorage and totals when cart changes
  useEffect(() => {
    localStorage.setItem("sushiyaki_cart", JSON.stringify(cartItems))

    // Calculate totals
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
    const priceTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

    setTotalItems(itemCount)
    setTotalPrice(priceTotal)
  }, [cartItems])

  // Add item to cart
  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === item.id)

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        return updatedItems
      } else {
        // Add new item if it doesn't exist
        return [...prevItems, { ...item, quantity }]
      }
    })
  }

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  // Remove item from cart
  const removeItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
  }

  const value = {
    cartItems,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
