import { type NextRequest, NextResponse } from "next/server"
import { authStorage } from "@/lib/auth-storage"

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
    console.log("=== SIGNOUT REQUEST ===")

    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value

    if (sessionToken) {
      // Delete session from storage
      authStorage.deleteSession(sessionToken)
      console.log(`Session deleted: ${sessionToken.substring(0, 8)}...`)
    }

    // Create response and clear session cookie
    const response = createJSONResponse({
      success: true,
      message: "Signed out successfully",
    })

    // Clear session cookie
    response.cookies.set("session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("=== SIGNOUT COMPLETED ===")
    return response
  } catch (error) {
    console.error("Signout error:", error)
    return createJSONResponse(
      {
        error: "Signout service temporarily unavailable",
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

export async function DELETE() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}

export async function PATCH() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}
