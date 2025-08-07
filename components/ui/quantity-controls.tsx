"use client"

import * as React from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface QuantityControlsProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  min?: number
  max?: number
  size?: "sm" | "default" | "lg"
  className?: string
  disabled?: boolean
}

const QuantityControls = React.forwardRef<HTMLDivElement, QuantityControlsProps>(
  ({ quantity, onQuantityChange, min = 1, max = 99, size = "default", className, disabled = false }, ref) => {
    const handleDecrease = () => {
      if (quantity > min) {
        onQuantityChange(quantity - 1)
      }
    }

    const handleIncrease = () => {
      if (quantity < max) {
        onQuantityChange(quantity + 1)
      }
    }

    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      default: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    }

    const inputSizeClasses = {
      sm: "h-8 w-12 text-xs",
      default: "h-10 w-16 text-sm",
      lg: "h-12 w-20 text-base",
    }

    return (
      <div ref={ref} className={cn("flex items-center gap-1 bg-black/20 rounded-lg p-1", className)}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-md hover:bg-gold/20 text-white hover:text-gold border border-transparent hover:border-gold/30",
            sizeClasses[size],
          )}
          onClick={handleDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div
          className={cn(
            "flex items-center justify-center bg-black/30 border border-gray-600 rounded-md text-white font-medium",
            inputSizeClasses[size],
          )}
        >
          {quantity}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-md hover:bg-gold/20 text-white hover:text-gold border border-transparent hover:border-gold/30",
            sizeClasses[size],
          )}
          onClick={handleIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  },
)
QuantityControls.displayName = "QuantityControls"

export { QuantityControls }
