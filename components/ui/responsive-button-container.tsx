"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveButtonContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical" | "responsive"
  spacing?: "tight" | "normal" | "loose"
  alignment?: "start" | "center" | "end" | "stretch"
  wrap?: boolean
}

const ResponsiveButtonContainer = React.forwardRef<HTMLDivElement, ResponsiveButtonContainerProps>(
  (
    { className, orientation = "responsive", spacing = "normal", alignment = "start", wrap = true, children, ...props },
    ref,
  ) => {
    const spacingClasses = {
      tight: "gap-1",
      normal: "gap-2",
      loose: "gap-4",
    }

    const alignmentClasses = {
      start: "justify-start items-start",
      center: "justify-center items-center",
      end: "justify-end items-end",
      stretch: "justify-stretch items-stretch",
    }

    const orientationClasses = {
      horizontal: "flex-row",
      vertical: "flex-col",
      responsive: "flex-col sm:flex-row",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientationClasses[orientation],
          spacingClasses[spacing],
          alignmentClasses[alignment],
          wrap && "flex-wrap",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ResponsiveButtonContainer.displayName = "ResponsiveButtonContainer"

export { ResponsiveButtonContainer }
