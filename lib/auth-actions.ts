"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function signUpAction(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")
  const phone = formData.get("phone")

  if (!email || !password || !fullName) {
    return { error: "Email, password, and full name are required" }
  }

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
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.SITE_URL}/auth/callback`,
        data: {
          full_name: fullName.toString(),
          phone: phone?.toString() || "",
          role: "customer",
        },
      },
    })

    if (error) {
      console.error("Signup error:", error)
      return { error: error.message }
    }

    if (data.user && data.user.email_confirmed_at) {
      // Only create profile if email is confirmed
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: email.toString(),
          full_name: fullName.toString(),
          phone: phone?.toString() || "",
          role: "customer",
        },
        {
          onConflict: "id",
        },
      )

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continue anyway as user is created
      }
    }

    return { success: "Account created successfully! Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
