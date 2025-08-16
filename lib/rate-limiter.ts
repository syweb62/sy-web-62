interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  },
  5 * 60 * 1000,
)

export function apiRateLimit(request: Request, limit = 100, windowMs = 15 * 60 * 1000): RateLimitResult {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  const key = `rate_limit:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Initialize or reset if window expired
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return {
      success: true,
      remaining: limit - 1,
      resetTime: store[key].resetTime,
    }
  }

  // Increment count
  store[key].count++

  const success = store[key].count <= limit
  const remaining = Math.max(0, limit - store[key].count)

  return {
    success,
    remaining,
    resetTime: store[key].resetTime,
  }
}

export function authRateLimit(request: Request): RateLimitResult {
  const url = new URL(request.url)
  const isSignup = url.pathname.includes("/signup")

  if (isSignup) {
    // More generous limits for signup to allow multiple devices
    return apiRateLimit(request, 20, 15 * 60 * 1000) // 20 attempts per 15 minutes for signup
  }

  // More restrictive rate limiting for signin endpoints
  return apiRateLimit(request, 10, 15 * 60 * 1000) // 10 attempts per 15 minutes for signin
}
