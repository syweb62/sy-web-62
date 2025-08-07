"use client"
import { ShoppingCart, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrderSystem, type OrderItem } from "@/hooks/use-order-system"
import { cn } from "@/lib/utils"

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

  const handleOrder = async () => {
    const result = await orderNow(item)
    if (result.success && result.orderId && onOrderComplete) {
      onOrderComplete(result.orderId)
    }
  }

  const getButtonContent = () => {
    if (orderSuccess) {
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

    switch (variant) {
      case "quick":
        return (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Quick Add
            {showPrice && <span className="ml-2">BDT {item.price.toFixed(2)}</span>}
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
            {showPrice && <span className="ml-2">BDT {item.price.toFixed(2)}</span>}
          </>
        )
    }
  }

  const getButtonVariant = () => {
    if (orderSuccess) return "success"
    if (orderError) return "destructive"
    return "primary"
  }

  return (
    <Button
      onClick={handleOrder}
      variant={getButtonVariant()}
      size={size}
      fullWidth={fullWidth}
      className={cn(
        "transition-all duration-200",
        orderSuccess && "bg-green-600 hover:bg-green-700",
        orderError && "bg-red-600 hover:bg-red-700",
        className,
      )}
    >
      {getButtonContent()}
    </Button>
  )
}
