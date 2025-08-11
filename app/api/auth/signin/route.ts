import { type NextRequest, NextResponse } from "next/server"
import { authStorage, isValidEmail, sanitizeInput, getClientIP } from "@/lib/auth-storage"

const createJSONResponse = (data: any, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = authStorage.checkRateLimit(`signin:${clientIP}`)

    if (!rateLimit.allowed) {
      return createJSONResponse(
        {
          error: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimit.retryAfter,
        },
        429,
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return createJSONResponse(
        {
          error: "Invalid request format",
          code: "INVALID_JSON",
        },
        400,
      )
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return createJSONResponse(
        {
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        },
        400,
      )
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return createJSONResponse(
        {
          error: "Invalid credential format",
          code: "INVALID_FORMAT",
        },
        400,
      )
    }

    // Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase())

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return createJSONResponse(
        {
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        },
        400,
      )
    }

    // Get user from storage
    const user = authStorage.getUser(sanitizedEmail)

    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return createJSONResponse(
        {
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        401,
      )
    }

    // Check password
    if (user.password !== password) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return createJSONResponse(
        {
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        401,
      )
    }

    // Create session
    const sessionToken = authStorage.createSession(user)

    // Create response with session cookie
    const response = createJSONResponse({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: "",
      },
      message: "Login successful",
    })

    // Set session cookie
    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Signin error:", error)
    }
    return createJSONResponse(
      {
        error: "Authentication service temporarily unavailable",
        code: "INTERNAL_ERROR",
      },
      500,
    )
  }
}

// Reset rate limiting endpoint for development
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    authStorage.resetRateLimit(`signup:${clientIP}`)
    authStorage.resetRateLimit(`signin:${clientIP}`)

    console.log(`Rate limits reset for IP: ${clientIP}`)

    return createJSONResponse({
      success: true,
      message: "Rate limits reset successfully",
    })
  } catch (error) {
    console.error("Rate limit reset error:", error)
    return createJSONResponse(
      {
        error: "Failed to reset rate limits",
        code: "INTERNAL_ERROR",
      },
      500,
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}

export async function PUT() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}

export async function PATCH() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}
