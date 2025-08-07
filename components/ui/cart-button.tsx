"use client"

import * as React from "react"
import { ShoppingCart, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface CartButtonProps extends Omit<ButtonProps, "children"> {
  isAdded?: boolean
  showIcon?: boolean
  addedText?: string
  defaultText?: string
  onAddToCart?: () => void
}

const CartButton = React.forwardRef<HTMLButtonElement, CartButtonProps>(
  (
    {
      className,
      isAdded = false,
      showIcon = true,
      addedText = "Added to Cart!",
      defaultText = "Add to Cart",
      onAddToCart,
      variant = "primary",
      ...props
    },
    ref,
  ) => {
    const [isAnimating, setIsAnimating] = React.useState(false)

    const handleClick = () => {
      if (onAddToCart && !isAdded) {
        setIsAnimating(true)
        onAddToCart()
        setTimeout(() => setIsAnimating(false), 1500)
      }
    }

    return (
      <Button
        ref={ref}
        variant={isAdded ? "success" : variant}
        className={cn("transition-all duration-300 min-w-[140px]", isAnimating && "scale-105", className)}
        onClick={handleClick}
        leftIcon={showIcon ? isAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" /> : undefined}
        {...props}
      >
        {isAdded ? addedText : defaultText}
      </Button>
    )
  },
)
CartButton.displayName = "CartButton"

export { CartButton }
