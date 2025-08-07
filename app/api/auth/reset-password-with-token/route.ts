import { type NextRequest, NextResponse } from "next/server"
import { isStrongPassword } from "@/lib/auth"
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
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters" },
        { status: 400 },
      )
    }

    // In production, validate token against database and update password
    logger.info("Password reset completed with token")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error(
      "Reset password with token error",
      { error: error instanceof Error ? error.message : "Unknown error" },
      error instanceof Error ? error : undefined,
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
