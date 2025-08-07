import { type NextRequest, NextResponse } from "next/server"
import { isValidEmail, sanitizeInput } from "@/lib/auth"
import { authRateLimit } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = authRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many reset attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase())

    // In production, generate reset token and send email
    logger.info("Password reset requested", { email: sanitizedEmail })

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        message: "If an account with that email exists, we've sent a password reset link.",
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error(
      "Reset password error",
      { error: error instanceof Error ? error.message : "Unknown error" },
      error instanceof Error ? error : undefined,
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
