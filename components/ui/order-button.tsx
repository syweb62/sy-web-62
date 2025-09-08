"use client"
import { ShoppingCart, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrderSystem, type OrderItem } from "@/hooks/use-order-system"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface OrderButtonProps {
  item: OrderItem
  variant?: "default" | "quick" | "reorder"
  size?: "sm" | "default" | "lg"
  fullWidth?: boolean
  showPrice?: boolean
  className?: string
  onOrderComplete?: (orderId: string) => void
}

export function OrderButton({
  item,
  variant = "default",
  size = "default",
  fullWidth = false,
  showPrice = true,
  className,
  onOrderComplete,
}: OrderButtonProps) {
  const { orderNow, orderSuccess, orderError } = useOrderSystem()
  const { cartItems } = useCart()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const cartItem = cartItems.find((cartItem) => cartItem.id === item.id)
  const isInCart = !!cartItem
  const quantity = cartItem?.quantity || 0

  useEffect(() => {
    if (orderSuccess) {
      setShowConfirmation(true)

      const timer = setTimeout(() => {
        setShowConfirmation(false)
      }, 3000) // Reduced confirmation display time from 5s to 3s

      return () => clearTimeout(timer)
    }
  }, [orderSuccess])

  const handleOrder = async () => {
    setIsLoading(true)
    const result = await orderNow(item)
    setIsLoading(false)

    if (result.success && result.orderId && onOrderComplete) {
      onOrderComplete(result.orderId)
    }
  }

  const getButtonContent = () => {
    if (showConfirmation || orderSuccess) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added to Cart!
        </>
      )
    }

    if (orderError) {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          Try Again
        </>
      )
    }

    if (isInCart) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          In Cart ({quantity})
        </>
      )
    }

    switch (variant) {
      case "quick":
        return (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Quick Add
            {showPrice && <span className="ml-2">Tk {item.price.toFixed(2)}</span>}
          </>
        )
      case "reorder":
        return (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Reorder
          </>
        )
      default:
        return (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
            {showPrice && <span className="ml-2">Tk {item.price.toFixed(2)}</span>}
          </>
        )
    }
  }

  const getButtonVariant = () => {
    if (showConfirmation || orderSuccess) return "success"
    if (orderError) return "destructive"
    if (isInCart) return "secondary"
    return "primary"
  }

  const getButtonStyles = () => {
    if (showConfirmation || orderSuccess) {
      return "bg-green-600 hover:bg-green-700 text-white border-green-600"
    }
    if (isInCart) {
      return "bg-green-100 hover:bg-green-200 text-green-800 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-700"
    }
    return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"
  }

  return (
    <Button
      onClick={handleOrder}
      variant={getButtonVariant()}
      size={size}
      fullWidth={fullWidth}
      disabled={isLoading}
      className={cn(getButtonStyles(), isLoading && "opacity-90", className)}
    >
      {isLoading ? (
        <>
          <div className="h-3 w-3 mr-2 rounded-full border border-current border-t-transparent animate-spin opacity-70" />
          <span className="opacity-80">Adding...</span>
        </>
      ) : (
        getButtonContent()
      )}
    </Button>
  )
}
