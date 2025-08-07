import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "user" | "admin"
}

export interface SessionData {
  user: User
  expiresAt: number
}

// Secure password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

// JWT token management
export const createToken = (user: User): string => {
  const secret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: "24h",
      issuer: "sushi-yaki",
      audience: "sushi-yaki-users",
    },
  )
}

export const verifyToken = (token: string): { userId: string; email: string; role: string } | null => {
  try {
    const secret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
    const decoded = jwt.verify(token, secret) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

// Session management
export const getSession = async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")

    if (!sessionToken) {
      return null
    }

    const tokenData = verifyToken(sessionToken.value)
    if (!tokenData) {
      return null
    }

    // In production, fetch user from database
    // For demo, return mock user data
    const demoUsers: Record<string, User> = {
      admin: {
        id: "admin",
        name: "Admin User",
        email: process.env.DEMO_ADMIN_EMAIL || "admin@sushiyaki.com",
        avatar: "",
        role: "admin",
      },
      demo: {
        id: "demo",
        name: "Demo User",
        email: process.env.DEMO_USER_EMAIL || "demo@example.com",
        avatar: "",
        role: "user",
      },
    }

    return demoUsers[tokenData.userId] || null
  } catch (error) {
    console.error("Session validation error:", error)
    return null
  }
}

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const escapeMap: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    }
    return escapeMap[match]
  })
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  )
}
