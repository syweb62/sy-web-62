import { type NextRequest, NextResponse } from "next/server"

const createJSONResponse = (data: any, status = 200) => {
  try {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Failed to create JSON response:", error)
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        code: "JSON_SERIALIZATION_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("User update request received")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Request body parsed:", body)
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError)
      return createJSONResponse(
        {
          success: false,
          error: "Invalid request format",
          code: "INVALID_JSON",
        },
        400,
      )
    }

    const { name, email, phone, address, avatar } = body

    // Validate required fields
    if (!name && !email && !phone && !address && !avatar) {
      return createJSONResponse(
        {
          success: false,
          error: "At least one field must be provided for update",
          code: "NO_UPDATE_FIELDS",
        },
        400,
      )
    }

    // Validate field formats if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createJSONResponse(
        {
          success: false,
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        },
        400,
      )
    }

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
      return createJSONResponse(
        {
          success: false,
          error: "Name must be at least 2 characters long",
          code: "INVALID_NAME",
        },
        400,
      )
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^(\+88)?01[3-9]\d{8}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return createJSONResponse(
          {
            success: false,
            error: "Invalid phone number format",
            code: "INVALID_PHONE",
          },
          400,
        )
      }
    }

    // Create updated user object
    const updatedUser = {
      id: "demo-user-id",
      name: name || "Demo User",
      email: email || "demo@example.com",
      phone: phone || "",
      address: address || "",
      avatar: avatar || "",
      role: "user" as const,
      lastUpdated: new Date().toISOString(),
    }

    console.log("User updated successfully:", updatedUser.email)

    return createJSONResponse({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("User update error:", error)
    return createJSONResponse(
      {
        success: false,
        error: "User update service temporarily unavailable",
        code: "INTERNAL_ERROR",
      },
      500,
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return createJSONResponse(
    {
      success: false,
      error: "Method not allowed",
    },
    405,
  )
}

export async function POST() {
  return createJSONResponse(
    {
      success: false,
      error: "Method not allowed",
    },
    405,
  )
}

export async function PUT() {
  return createJSONResponse(
    {
      success: false,
      error: "Method not allowed",
    },
    405,
  )
}

export async function DELETE() {
  return createJSONResponse(
    {
      success: false,
      error: "Method not allowed",
    },
    405,
  )
}
