// Shared authentication storage for all auth routes
// This ensures consistency across signin, signup, and session routes

interface User {
  id: string
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  avatar?: string
  role: string
  createdAt: string
}

interface Session {
  userId: string
  email: string
  name: string
  role: string
  expiresAt: number
}

interface RateLimit {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

// Shared stores that persist across all auth routes
class AuthStorage {
  private static instance: AuthStorage
  public users = new Map<string, User>() // Made public for profile updates
  private sessions = new Map<string, Session>()
  private rateLimits = new Map<string, RateLimit>()

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AuthStorage {
    if (!AuthStorage.instance) {
      AuthStorage.instance = new AuthStorage()
    }
    return AuthStorage.instance
  }

  // User management
  public createUser(userData: Omit<User, "id" | "createdAt">): User {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    this.users.set(user.email, user)
    console.log(`User created: ${user.id} (${user.email})`)
    return user
  }

  public getUser(email: string): User | undefined {
    return this.users.get(email.toLowerCase())
  }

  public userExists(email: string): boolean {
    return this.users.has(email.toLowerCase())
  }

  public getAllUserEmails(): string[] {
    return Array.from(this.users.keys())
  }

  // Session management
  public createSession(user: User): string {
    const sessionToken = crypto.randomUUID()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    this.sessions.set(sessionToken, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt,
    })

    console.log(`Session created for user: ${user.id}`)
    return sessionToken
  }

  public getSession(sessionToken: string): Session | undefined {
    const session = this.sessions.get(sessionToken)

    // Check if session is expired
    if (session && Date.now() > session.expiresAt) {
      this.sessions.delete(sessionToken)
      console.log(`Expired session removed: ${sessionToken}`)
      return undefined
    }

    return session
  }

  public deleteSession(sessionToken: string): void {
    this.sessions.delete(sessionToken)
    console.log(`Session deleted: ${sessionToken}`)
  }

  // Rate limiting
  public checkRateLimit(
    key: string,
    maxAttempts = 10,
    windowMs = 5 * 60 * 1000,
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now()
    const limit = this.rateLimits.get(key)

    if (!limit) {
      this.rateLimits.set(key, { attempts: 1, lastAttempt: now })
      return { allowed: true }
    }

    // Check if currently blocked
    if (limit.blockedUntil && now < limit.blockedUntil) {
      const retryAfter = Math.ceil((limit.blockedUntil - now) / 1000)
      return { allowed: false, retryAfter }
    }

    // Reset if window has passed
    if (now - limit.lastAttempt > windowMs) {
      this.rateLimits.set(key, { attempts: 1, lastAttempt: now })
      return { allowed: true }
    }

    // Increment attempts
    limit.attempts++
    limit.lastAttempt = now

    // Block if too many attempts
    if (limit.attempts >= maxAttempts) {
      limit.blockedUntil = now + windowMs
      const retryAfter = Math.ceil(windowMs / 1000)
      return { allowed: false, retryAfter }
    }

    return { allowed: true }
  }

  public resetRateLimit(key: string): void {
    this.rateLimits.delete(key)
    console.log(`Rate limit reset for: ${key}`)
  }

  // Utility methods
  public getStats() {
    return {
      totalUsers: this.users.size,
      activeSessions: this.sessions.size,
      rateLimitEntries: this.rateLimits.size,
      userEmails: this.getAllUserEmails(),
    }
  }
}

// Export singleton instance
export const authStorage = AuthStorage.getInstance()

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

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

export const getClientIP = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}
