"use client"

import * as React from "react"
import { Button, type ButtonProps } from "./button"
import { cn } from "@/lib/utils"

interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon"> {
  icon: React.ReactNode
  label?: string
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, tooltip, className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("shrink-0", className)}
        title={tooltip || label}
        aria-label={label}
        {...props}
      >
        {icon}
        {label && size !== "icon" && size !== "icon-sm" && size !== "icon-lg" && (
          <span className="sr-only">{label}</span>
        )}
      </Button>
    )
  },
)
IconButton.displayName = "IconButton"

export { IconButton }
