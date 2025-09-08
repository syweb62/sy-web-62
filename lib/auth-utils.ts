import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

// JWT secret with proper fallback
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    console.warn("JWT_SECRET not set or too short. Using fallback for development.")
    return "ylbkDjam1BEzzNmYGfh2BoA5n6uDRBFC+FP2bYVJ3CuUDX0Z0L1C2q5wVZ2g30IYU1TIW8yPv9A0fmxJd7b74w=="
  }
  return secret
}

// User interface
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: "admin" | "user"
}

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  )
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
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
}

// Demo users function with proper typing
export const getDemoUsers = () => {
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@sushiyaki.com"
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin123!"

  return {
    [adminEmail]: {
      id: "admin",
      name: "Admin User",
      email: adminEmail,
      password: adminPassword,
      avatar: "",
      role: "admin" as const,
    },
  }
}

// JWT token creation with proper error handling
export const createToken = (user: User): string => {
  try {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    }

    return jwt.sign(payload, getJWTSecret(), { algorithm: "HS256" })
  } catch (error) {
    console.error("Token creation failed:", error)
    throw new Error("Failed to create authentication token")
  }
}

// JWT token verification with proper error handling
export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any

    if (!decoded.userId || !decoded.email) {
      console.warn("Invalid token payload")
      return null
    }

    return {
      id: decoded.userId,
      name: decoded.name || "User",
      email: decoded.email,
      avatar: decoded.avatar || "",
      role: decoded.role || "user",
    }
  } catch (error) {
    console.warn("Token verification failed:", error)
    return null
  }
}

// Session management with proper async handling
export const getSession = async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")

    if (!sessionToken?.value) {
      return null
    }

    return verifyToken(sessionToken.value)
  } catch (error) {
    console.error("Session retrieval failed:", error)
    return null
  }
}

// Synchronous session validation for API routes
export const getSessionSync = (token: string): User | null => {
  if (!token) return null
  return verifyToken(token)
}
