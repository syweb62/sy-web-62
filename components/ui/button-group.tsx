"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
  fullWidth?: boolean
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", size, variant, fullWidth, children, ...props }, ref) => {
    const isHorizontal = orientation === "horizontal"

    return (
      <div
        ref={ref}
        className={cn("inline-flex", isHorizontal ? "flex-row" : "flex-col", fullWidth && "w-full", className)}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child) || child.type !== Button) {
            return child
          }

          const isFirst = index === 0
          const isLast = index === React.Children.count(children) - 1
          const isMiddle = !isFirst && !isLast

          return React.cloneElement(child, {
            size: child.props.size || size,
            variant: child.props.variant || variant,
            fullWidth: fullWidth,
            className: cn(
              child.props.className,
              isHorizontal
                ? [
                    isFirst && "rounded-r-none border-r-0",
                    isMiddle && "rounded-none border-r-0",
                    isLast && "rounded-l-none",
                  ]
                : [
                    isFirst && "rounded-b-none border-b-0",
                    isMiddle && "rounded-none border-b-0",
                    isLast && "rounded-t-none",
                  ],
            ),
          })
        })}
      </div>
    )
  },
)
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
