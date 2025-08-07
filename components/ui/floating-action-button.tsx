"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface FloatingActionButtonProps extends Omit<ButtonProps, "size"> {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  size?: "default" | "lg" | "xl"
  icon: React.ReactNode
  label?: string
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = "bottom-right", size = "lg", icon, label, className, variant = "default", ...props }, ref) => {
    const positionClasses = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6",
    }

    const sizeClasses = {
      default: "h-12 w-12",
      lg: "h-14 w-14",
      xl: "h-16 w-16",
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          "fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "hover:scale-110 active:scale-95",
          positionClasses[position],
          sizeClasses[size],
          className,
        )}
        aria-label={label}
        title={label}
        {...props}
      >
        {icon}
      </Button>
    )
  },
)
FloatingActionButton.displayName = "FloatingActionButton"

export { FloatingActionButton }
