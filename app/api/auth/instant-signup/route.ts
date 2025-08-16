import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"

function json(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

const sanitize = (s: string) =>
  String(s)
    .trim()
    .replace(/[<>"'&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "&": "&amp;" })[m] as string)

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const strongEnough = (p: string) => String(p).length >= 6

export async function POST(req: NextRequest) {
  try {
    let admin
    try {
      admin = getSupabaseAdminClient()
    } catch (adminError) {
      console.error("Failed to initialize Supabase admin client:", adminError)
      return json(
        {
          error: "Authentication service configuration error. Please contact support.",
          code: "ADMIN_CLIENT_ERROR",
        },
        503,
      )
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      email?: string
      password?: string
      phone?: string
    }

    const name = body.name ?? ""
    const email = body.email ?? ""
    const password = body.password ?? ""
    const phone = body.phone ?? ""

    if (!name || !email || !password) {
      return json({ error: "Name, email and password are required." }, 400)
    }
    if (!isEmail(email)) return json({ error: "Invalid email." }, 400)
    if (!strongEnough(password)) return json({ error: "Password must be at least 6 characters." }, 400)

    const safeEmail = sanitize(email.toLowerCase())
    const safeName = sanitize(name)
    const safePhone = phone ? sanitize(phone) : ""

    console.log("[v0] Attempting to create user with admin client:", { email: safeEmail, name: safeName })

    // Attempt to create the user with confirmed email so client can sign in immediately
    const created = await admin.auth.admin.createUser({
      email: safeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: safeName,
        name: safeName,
        phone: safePhone,
      },
    })

    console.log("[v0] User creation result:", {
      success: !created.error,
      error: created.error?.message,
      userId: created.data?.user?.id,
    })

    // If Supabase says the user already exists, treat it as a successful, idempotent outcome
    if (created.error) {
      const msg = String(created.error.message || "").toLowerCase()
      const alreadyExists =
        msg.includes("already registered") ||
        msg.includes("user already exists") ||
        msg.includes("email already") ||
        msg.includes("duplicate")

      if (alreadyExists) {
        console.log("[v0] User already exists, returning success")
        return json(
          {
            success: true,
            alreadyExisted: true,
            email: safeEmail,
            emailConfirmed: true,
            message: "User already exists. You can sign in now.",
          },
          200,
        )
      }

      console.error("[v0] User creation failed:", created.error)
      return json(
        {
          error: created.error.message || "Failed to create user.",
          code: "USER_CREATION_FAILED",
        },
        400,
      )
    }

    const user = created.data.user
    console.log("[v0] User created successfully, creating profile")

    // Best-effort profile upsert (skip quietly if table isn't present)
    try {
      const profileResult = await admin.from("profiles").upsert(
        [
          {
            id: user.id,
            email: user.email,
            full_name: safeName,
            avatar_url: user.user_metadata?.avatar_url || "",
            phone: safePhone,
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" },
      )

      if (profileResult.error) {
        console.warn("[v0] Profile creation failed:", profileResult.error)
      } else {
        console.log("[v0] Profile created successfully")
      }
    } catch (profileError) {
      console.warn("[v0] Profile creation error:", profileError)
      // no-op
    }

    return json(
      {
        success: true,
        userId: user.id,
        email: user.email,
        emailConfirmed: true,
        message: "User created and confirmed. Proceed to client sign-in.",
      },
      201,
    )
  } catch (err) {
    console.error("[v0] instant-signup error:", err)
    return json(
      {
        error: "Internal error while creating account. Please try again or contact support.",
        code: "INTERNAL_ERROR",
      },
      500,
    )
  }
}
