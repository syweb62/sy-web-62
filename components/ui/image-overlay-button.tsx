"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface ImageOverlayButtonProps extends ButtonProps {
  overlay?: "light" | "dark" | "gradient" | "blur"
  position?: "center" | "bottom" | "top" | "bottom-left" | "bottom-right" | "top-left" | "top-right"
  showOnHover?: boolean
  alwaysVisible?: boolean
}

const overlayStyles = {
  light: "bg-white/90 text-black border border-gray-200 hover:bg-white",
  dark: "bg-black/80 text-white border border-white/20 hover:bg-black/90",
  gradient: "bg-gradient-to-t from-black/80 to-transparent text-white border border-white/20",
  blur: "bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20",
}

const positionStyles = {
  center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-4 left-1/2 transform -translate-x-1/2",
  top: "top-4 left-1/2 transform -translate-x-1/2",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
}

const ImageOverlayButton = React.forwardRef<HTMLButtonElement, ImageOverlayButtonProps>(
  (
    { className, overlay = "dark", position = "bottom", showOnHover = false, alwaysVisible = true, children, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "absolute z-30 shadow-2xl transition-all duration-300",
          overlayStyles[overlay],
          positionStyles[position],
          showOnHover && !alwaysVisible && "opacity-0 group-hover:opacity-100",
          alwaysVisible && "opacity-100",
          "focus:opacity-100 focus:scale-105",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    )
  },
)
ImageOverlayButton.displayName = "ImageOverlayButton"

export { ImageOverlayButton }
