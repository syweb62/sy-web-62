"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface LayoutWrapperProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
  containerClass?: string
  background?: "dark" | "black" | "gradient" | "transparent"
}

export function LayoutWrapper({
  children,
  className,
  fullWidth = true,
  containerClass,
  background = "transparent",
}: LayoutWrapperProps) {
  const backgroundClasses = {
    dark: "bg-darkBg",
    black: "bg-black",
    gradient: "bg-gradient-to-b from-darkBg to-black",
    transparent: "",
  }

  return (
    <section className={cn(fullWidth && "full-width-section", backgroundClasses[background], className)}>
      <div className={cn("section-container", containerClass)}>{children}</div>
    </section>
  )
}
