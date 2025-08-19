// Short Order ID Generator
// Generates IDs like: 1205e, 14r84, 762v9

export function generateShortOrderId(): string {
  // Get current time in minutes since epoch (shorter than full timestamp)
  const timeBase = Math.floor(Date.now() / 60000) // Minutes since epoch

  // Take last 4 digits of time for uniqueness
  const timePart = timeBase.toString().slice(-4)

  // Generate 1-2 random characters (letters/numbers)
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz"
  const randomPart = chars[Math.floor(Math.random() * chars.length)]

  return `${timePart}${randomPart}`
}

// Alternative format with more randomness if needed
export function generateShortOrderIdAlt(): string {
  // 3 digits from timestamp + 2 random chars
  const timeBase = Math.floor(Date.now() / 1000) // Seconds
  const timePart = timeBase.toString().slice(-3)

  const chars = "0123456789abcdefghijklmnopqrstuvwxyz"
  const randomPart = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")

  return `${timePart}${randomPart}`
}

// Validate short order ID format
export function isValidShortOrderId(id: string): boolean {
  // Should be 5-6 characters, alphanumeric
  return /^[0-9a-z]{5,6}$/i.test(id)
}
