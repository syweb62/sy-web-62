import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
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
    const sanitizedName = name.trim()
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedPhone = phone ? phone.trim() : ""
    const sanitizedAddress = address ? address.trim() : ""

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return createJSONResponse(
        {
          error: "Please enter a valid email address",
          code: "INVALID_EMAIL",
        },
        400,
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return createJSONResponse(
        {
          error: "Password must be at least 6 characters long",
          code: "WEAK_PASSWORD",
        },
        400,
      )
    }

    // Validate name
    if (sanitizedName.length < 2) {
      return createJSONResponse(
        {
          error: "Name must be at least 2 characters long",
          code: "INVALID_NAME",
        },
        400,
      )
    }

    // Validate phone if provided
    if (sanitizedPhone && !/^[0-9]{10,15}$/.test(sanitizedPhone.replace(/\D/g, ""))) {
      return createJSONResponse(
        {
          error: "Please enter a valid phone number",
          code: "INVALID_PHONE",
        },
        400,
      )
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          full_name: sanitizedName,
          phone: sanitizedPhone,
          address: sanitizedAddress,
        },
      },
    })

    if (authError) {
      console.error("Supabase auth error:", authError)

      // Handle specific Supabase errors
      if (authError.message.includes("already registered")) {
        return createJSONResponse(
          {
            error: "An account with this email already exists",
            code: "EMAIL_EXISTS",
          },
          409,
        )
      }

      return createJSONResponse(
        {
          error: authError.message || "Failed to create account",
          code: "AUTH_ERROR",
        },
        400,
      )
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: sanitizedEmail,
        full_name: sanitizedName,
        phone: sanitizedPhone,
        address: sanitizedAddress,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Don't fail the signup if profile creation fails, just log it
      }
    }

    return createJSONResponse({
      success: true,
      user: authData.user
        ? {
            id: authData.user.id,
            email: authData.user.email,
            name: sanitizedName,
            phone: sanitizedPhone,
            address: sanitizedAddress,
            role: "user",
          }
        : null,
      message: authData.user?.email_confirmed_at
        ? "Account created successfully"
        : "Account created successfully. Please check your email to confirm your account.",
      requiresEmailConfirmation: !authData.user?.email_confirmed_at,
    })
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

export async function DELETE() {
  return createJSONResponse({ error: "Method not allowed" }, 405)
}
