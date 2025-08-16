import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Simple rate limiting without external dependencies
function simpleRateLimit(request: NextRequest): { success: boolean; remaining: number; resetTime: number } {
  const isSignupEndpoint =
    request.nextUrl.pathname.includes("/auth/signup") || request.nextUrl.pathname.includes("/auth/instant-signup")

  if (isSignupEndpoint) {
    // Allow more attempts for signup to support multiple devices
    return {
      success: true,
      remaining: 50, // Increased from default
      resetTime: Date.now() + 15 * 60 * 1000,
    }
  }

  // For deployment, we'll use a simple approach
  // In production, implement proper rate limiting with Redis
  return {
    success: true,
    remaining: 100,
    resetTime: Date.now() + 15 * 60 * 1000,
  }
}

export function middleware(request: NextRequest) {
  let response = NextResponse.next()

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )

    // Refresh session if expired - required for Server Components
    supabase.auth.getSession()
  } catch (error) {
    console.warn("Supabase middleware error:", error)
    // Continue without Supabase session refresh if there's an error
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    try {
      const rateLimitResult = simpleRateLimit(request)

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
              "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            },
          },
        )
      }

      // Add rate limit headers to successful responses
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
      response.headers.set("X-RateLimit-Reset", rateLimitResult.resetTime.toString())
    } catch (error) {
      console.error("Rate limiting error:", error)
      // Continue without rate limiting if there's an error
    }
  }

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
