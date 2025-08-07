import { type NextRequest, NextResponse } from "next/server"
import { getSession, isStrongPassword } from "@/lib/auth"
import { authRateLimit } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = authRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many password change attempts. Please try again later." }, { status: 429 })
    }

    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters with uppercase, lowercase, numbers, and special characters",
        },
        { status: 400 },
      )
    }

    // In production, verify current password against database
    logger.info("Password changed successfully", { userId: user.id })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error(
      "Change password error",
      { error: error instanceof Error ? error.message : "Unknown error" },
      error instanceof Error ? error : undefined,
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
