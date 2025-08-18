"use client"

import { useEffect, useState } from "react"

interface TimeBDProps {
  iso: string
  className?: string
}

/**
 * Client-only Bangladesh timezone renderer
 * Treats input timestamps as already being in Bangladesh time
 */
export function TimeBD({ iso, className }: TimeBDProps) {
  const [text, setText] = useState("")

  useEffect(() => {
    console.log("[v0] TimeBD input:", iso)

    // Remove timezone suffix and treat as local Bangladesh time
    const cleanIso = iso.replace(/[+-]\d{2}:\d{2}$|Z$/, "")
    const date = new Date(cleanIso)

    // Format directly without timezone conversion since it's already Bangladesh time
    const result =
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(date) + " BDT"

    console.log("[v0] TimeBD output:", result)
    setText(result)
  }, [iso])

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  )
}
