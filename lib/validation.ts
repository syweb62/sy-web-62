// Input validation utilities
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  password: (password: string): boolean => {
    return (
      password.length >= 8 &&
      password.length <= 128 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    )
  },

  bangladeshiPhone: (phone: string): boolean => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "")

    // Check for valid Bangladeshi mobile number patterns
    // Local format: 01XXXXXXXXX (11 digits)
    // International format: 8801XXXXXXXXX (13 digits)
    if (digits.length === 11 && digits.startsWith("01")) {
      const secondDigit = digits[2]
      return ["3", "4", "5", "6", "7", "8", "9"].includes(secondDigit)
    }

    if (digits.length === 13 && digits.startsWith("8801")) {
      const fourthDigit = digits[4]
      return ["3", "4", "5", "6", "7", "8", "9"].includes(fourthDigit)
    }

    return false
  },

  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      }
      return entities[char] || char
    })
  },

  isValidImageFile: (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize
  },
}
