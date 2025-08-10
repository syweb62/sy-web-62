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
    const admin = getSupabaseAdminClient()
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

    // If Supabase says the user already exists, treat it as a successful, idempotent outcome
    if (created.error) {
      const msg = String(created.error.message || "").toLowerCase()
      const alreadyExists =
        msg.includes("already registered") ||
        msg.includes("user already exists") ||
        msg.includes("email already") ||
        msg.includes("duplicate")

      if (alreadyExists) {
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

      return json({ error: created.error.message || "Failed to create user." }, 400)
    }

    const user = created.data.user

    // Best-effort profile upsert (skip quietly if table isn't present)
    try {
      await admin.from("profiles").upsert(
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
    } catch {
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
    console.error("instant-signup error:", err)
    return json({ error: "Internal error while creating account." }, 500)
  }
}
