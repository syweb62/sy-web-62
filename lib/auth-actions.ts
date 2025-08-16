"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function signUpAction(
  prevState: any,
  formDataOrObject: FormData | { email: string; password: string; name: string; phone: string },
) {
  let email: string
  let password: string
  let fullName: string
  let phone: string

  // Handle both FormData and direct object inputs
  if (formDataOrObject instanceof FormData) {
    const emailValue = formDataOrObject.get("email")
    const passwordValue = formDataOrObject.get("password")
    const fullNameValue = formDataOrObject.get("name") || formDataOrObject.get("fullName")
    const phoneValue = formDataOrObject.get("phone")

    if (!emailValue || !passwordValue || !fullNameValue) {
      return { error: "Email, password, and full name are required" }
    }

    email = emailValue.toString()
    password = passwordValue.toString()
    fullName = fullNameValue.toString()
    phone = phoneValue?.toString() || ""
  } else if (formDataOrObject && typeof formDataOrObject === "object") {
    // Handle direct object input
    email = formDataOrObject.email
    password = formDataOrObject.password
    fullName = formDataOrObject.name
    phone = formDataOrObject.phone || ""

    if (!email || !password || !fullName) {
      return { error: "Email, password, and full name are required" }
    }
  } else {
    return { error: "Form data is missing" }
  }

  console.log("[v0] Processing signup for:", { email, fullName, phone: phone ? "provided" : "empty" })

  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  try {
    console.log("[v0] Attempting Supabase signup...")
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.SITE_URL}/auth/callback`,
        data: {
          full_name: fullName,
          phone: phone,
          role: "customer",
        },
      },
    })

    if (error) {
      console.error("[v0] Signup error:", error)
      return { error: error.message }
    }

    console.log("[v0] Signup successful, user created:", data.user?.id)

    if (data.user && data.user.email_confirmed_at) {
      // Only create profile if email is confirmed
      console.log("[v0] Creating user profile...")
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: "customer",
        },
        {
          onConflict: "id",
        },
      )

      if (profileError) {
        console.error("[v0] Profile creation error:", profileError)
        // Continue anyway as user is created
      } else {
        console.log("[v0] Profile created successfully")
      }
    }

    return { success: true, message: "Account created successfully! Check your email to confirm your account." }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
