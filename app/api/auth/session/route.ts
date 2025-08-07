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

export async function GET(request: NextRequest) {
  try {
    console.log("=== SESSION CHECK REQUEST ===")

    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      console.log("No session token found")
      return createJSONResponse({
        authenticated: false,
        user: null,
        message: "No session found",
      })
    }

    console.log(`Checking session token: ${sessionToken.substring(0, 8)}...`)

    // Get session from storage
    const session = authStorage.getSession(sessionToken)

    if (!session) {
      console.log("Session not found or expired")
      return createJSONResponse({
        authenticated: false,
        user: null,
        message: "Invalid or expired session",
      })
    }

    console.log(`Valid session found for user: ${session.userId}`)

    // Get user data
    const user = authStorage.getUser(session.email)

    if (!user) {
      console.log("User not found for session")
      authStorage.deleteSession(sessionToken)
      return createJSONResponse({
        authenticated: false,
        user: null,
        message: "User not found",
      })
    }

    console.log(`Session valid for user: ${user.id} (${user.email})`)

    return createJSONResponse({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: "",
      },
      message: "Session valid",
    })
  } catch (error) {
    console.error("Session check error:", error)
    return createJSONResponse(
      {
        authenticated: false,
        user: null,
        error: "Session service temporarily unavailable",
        code: "INTERNAL_ERROR",
      },
      500,
    )
  }
}

// Handle other HTTP methods
export async function POST() {
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
