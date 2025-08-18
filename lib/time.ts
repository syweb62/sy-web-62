/**
 * Bangladesh timezone formatter utility
 * Converts UTC ISO string to Asia/Dhaka timezone display
 */

export const toUTCDate = (v: string | Date) => {
  if (v instanceof Date) return v
  // if string has no Z or ±HH:MM, treat as UTC (append Z)
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(v)
  return new Date(hasTZ ? v : v + "Z")
}

export function formatDhaka(iso: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(toUTCDate(iso))
}

export function formatBD(iso: string): string {
  try {
    return `${formatDhaka(iso)} BDT`
  } catch (error) {
    console.error("[v0] formatBD error:", error)
    return "—"
  }
}
