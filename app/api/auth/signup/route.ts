import { type NextRequest, NextResponse } from "next/server"
import { authStorage, isValidEmail, isStrongPassword, sanitizeInput, getClientIP } from "@/lib/auth-storage"

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
    console.log("=== SIGNUP REQUEST RECEIVED ===")

    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = authStorage.checkRateLimit(`signup:${clientIP}`)

    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`)
      return createJSONResponse(
        {
          error: `Too many signup attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
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
      console.error("Invalid JSON in request body")
      return createJSONResponse(
        {
          error: "Invalid request format",
          code: "INVALID_JSON",
        },
        400,
      )
    }

    const { name, email, password, phone, address } = body

    // Validate required fields
    if (!name || !email || !password) {
      return createJSONResponse(
        {
          error: "Name, email, and password are required",
          code: "MISSING_FIELDS",
        },
        400,
      )
    }

    // Validate input types
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return createJSONResponse(
        {
          error: "Invalid field format",
          code: "INVALID_FORMAT",
        },
        400,
      )
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedPhone = phone ? sanitizeInput(phone) : ""
    const sanitizedAddress = address ? sanitizeInput(address) : ""

    console.log(`Signup attempt for: ${sanitizedEmail}`)

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return createJSONResponse(
        {
          error: "Please enter a valid email address",
          code: "INVALID_EMAIL",
        },
        400,
      )
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return createJSONResponse(
        {
          error: "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters",
          code: "WEAK_PASSWORD",
        },
        400,
      )
    }

    // Validate name
    if (sanitizedName.length < 2 || !/^[a-zA-Z\s]+$/.test(sanitizedName)) {
      return createJSONResponse(
        {
          error: "Name must be at least 2 characters and contain only letters and spaces",
          code: "INVALID_NAME",
        },
        400,
      )
    }

    // Validate phone if provided
    if (sanitizedPhone && !/^[0-9]{11}$/.test(sanitizedPhone)) {
      return createJSONResponse(
        {
          error: "Please enter a valid 11-digit phone number",
          code: "INVALID_PHONE",
        },
        400,
      )
    }

    // Check if user already exists
    if (authStorage.userExists(sanitizedEmail)) {
      console.log(`User already exists: ${sanitizedEmail}`)
      return createJSONResponse(
        {
          error: "An account with this email already exists",
          code: "EMAIL_EXISTS",
        },
        409,
      )
    }

    // Create new user
    const newUser = authStorage.createUser({
      name: sanitizedName,
      email: sanitizedEmail,
      password: password, // Store password as-is for demo purposes
      phone: sanitizedPhone,
      address: sanitizedAddress,
      role: "user",
    })

    console.log(`User created successfully: ${newUser.id}`)
    console.log(`Current users:`, authStorage.getAllUserEmails())

    // Create session automatically (auto-login after signup)
    const sessionToken = authStorage.createSession(newUser)

    console.log(`Auto-login session created for new user`)

    // Create response
    const response = createJSONResponse({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        avatar: "",
      },
      message: "Account created successfully and logged in",
      requiresSignIn: false, // User is automatically signed in
    })

    // Set session cookie
    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    console.log("=== SIGNUP COMPLETED SUCCESSFULLY ===")
    return response
  } catch (error) {
    console.error("Signup error:", error)
    return createJSONResponse(
      {
        error: "Registration service temporarily unavailable",
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
