import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { apiRateLimit } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = apiRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    // Generate CSRF token
    const token = randomBytes(32).toString("hex")

    // In production, store this token in a secure session store
    logger.debug("CSRF token generated")

    const response = NextResponse.json({ token })

    // Set secure headers
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    logger.error(
      "CSRF token generation error",
      { error: error instanceof Error ? error.message : "Unknown error" },
      error instanceof Error ? error : undefined,
    )
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
