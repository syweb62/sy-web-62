"use client"

import { useEffect, useState } from "react"

interface TimeBDProps {
  iso: string
  className?: string
}

/**
 * Client-only Bangladesh timezone renderer
 * Properly converts UTC timestamps to Bangladesh time (Asia/Dhaka)
 */
export function TimeBD({ iso, className }: TimeBDProps) {
  const [text, setText] = useState("")

  useEffect(() => {
    console.log("[v0] TimeBD input:", iso)

    const date = new Date(iso) // Keep original ISO string with timezone info

    // Format with proper Bangladesh timezone conversion
    const result =
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka", // Specify Bangladesh timezone (UTC+6)
      }).format(date) + " BD"

    console.log("[v0] TimeBD output:", result)
    setText(result)
  }, [iso])

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  )
}
