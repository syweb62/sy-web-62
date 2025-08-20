"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase, testSupabaseConnection, type Profile } from "@/lib/supabase"
import type { User as SupabaseUser, Session, AuthError } from "@supabase/supabase-js"

interface AuthContextType {
  user: Profile | null
  session: Session | null
  isLoading: boolean
  connectionStatus: "connected" | "disconnected" | "testing"
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: string,
  ) => Promise<{ success: boolean; requiresSignIn?: boolean; user?: SupabaseUser } | void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (userData: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  error: AuthError | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Utilities
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    }
    return map[match]
  })
}
const isValidEmail = (email: string): boolean => {
  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return rx.test(email) && email.length <= 254
}
const isStrongPassword = (password: string): boolean => password.length >= 6
const withTimeout = async <T,>(p: Promise<T>, ms = 8000): Promise<T> => {
  return Promise.race<T>([
    p,
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error("request-timeout"))
      }, ms)
    }),
  ])
}
const toFallbackProfile = (u: SupabaseUser): Profile => ({
  id: u.id,
  email: u.email ?? "",
  full_name: (u.user_metadata?.full_name || u.user_metadata?.name || "User") as string,
  name: (u.user_metadata?.full_name || u.user_metadata?.name || "User") as string,
  avatar_url: u.user_metadata?.avatar_url || "",
  phone: u.user_metadata?.phone || "",
  address: "",
  role: u.email === "admin@sushiyaki.com" ? "admin" : "user",
  created_at: u.created_at,
  updated_at: u.updated_at || u.created_at,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("testing")

  const clearError = useCallback(() => setError(null), [])
  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      // Don't log session-related errors as they're normal for public pages
      if (!err.message.includes("session") && !err.message.includes("Session")) {
        console.error("[v0] Auth error:", err.message)
      }
    } else {
      console.error("[v0] Auth error:", err)
    }
    setError(err as AuthError)
  }, [])

  const fetchUserProfile = useCallback(
    async (supabaseUser: SupabaseUser) => {
      // Never throw from here; always resolve with a profile
      try {
        // If Supabase client not ready or connection is down, return a fallback
        if (!supabase || connectionStatus !== "connected") {
          const fallback = toFallbackProfile(supabaseUser)
          setUser(fallback)
          return fallback
        }

        // Try to fetch existing profile
        const { data, error } = await withTimeout(
          supabase.from("profiles").select("*").eq("id", supabaseUser.id).maybeSingle(),
          8000,
        )

        if (error && (error as any).code !== "PGRST116") {
          console.warn("Error fetching user profile; using fallback:", (error as any).message || error)
          const fallback = toFallbackProfile(supabaseUser)
          setUser(fallback)
          return fallback
        }

        if (data) {
          const profileWithName = {
            ...data,
            name: data.full_name || data.name || "User",
            role: supabaseUser.email === "admin@sushiyaki.com" ? "admin" : data.role,
          }
          setUser(profileWithName)
          return profileWithName
        }

        // Create a new profile if not found
        const newUserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || "New User",
          avatar_url: supabaseUser.user_metadata?.avatar_url || "",
          phone: supabaseUser.user_metadata?.phone || "",
          role: supabaseUser.email === "admin@sushiyaki.com" ? "admin" : ("user" as const),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: created, error: createError } = await withTimeout(
          supabase.from("profiles").insert([newUserProfile]).select().single(),
          8000,
        )

        if (createError) {
          console.warn("Error creating profile; using fallback:", createError.message)
          const fallback = toFallbackProfile(supabaseUser)
          setUser(fallback)
          return fallback
        }

        const profileWithName = {
          ...created,
          name: created.full_name || "User",
        }
        setUser(profileWithName)
        return profileWithName
      } catch (err) {
        // Network errors, timeouts, etc.
        console.warn("fetchUserProfile fallback due to error:", err instanceof Error ? err.message : err)
        const fallback = toFallbackProfile(supabaseUser)
        setUser(fallback)
        return fallback
      }
    },
    [connectionStatus],
  )

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let initTimeout: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        initTimeout = setTimeout(() => {
          console.warn("[v0] Auth initialization timeout - setting loading to false")
          setIsLoading(false)
          setConnectionStatus("disconnected")
        }, 10000) // 10 second maximum timeout

        // 1) Probe connectivity once up front
        const connectionResult = await testSupabaseConnection().catch((e) => {
          console.warn("[v0] testSupabaseConnection failed:", e)
          return { status: "disconnected" as const }
        })
        setConnectionStatus(connectionResult.status as "connected" | "disconnected" | "testing")

        // If client missing or no connectivity, stop here gracefully
        if (!supabase || connectionResult.status !== "connected") {
          console.warn("[v0] Supabase not reachable; running in disconnected mode.")
          clearTimeout(initTimeout)
          setIsLoading(false)
          return
        }

        // 2) Get session with a timeout guard
        try {
          const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession(), 5000)

          if (sessionError) {
            console.warn("[v0] getSession info:", sessionError.message)
          }

          const current = sessionData?.session ?? null
          setSession(current)

          if (current?.user) {
            await fetchUserProfile(current.user)
          } else {
            setUser(null)
          }
        } catch (sessErr) {
          console.warn(
            "[v0] getSession failed (network/timeout); skipping profile fetch:",
            sessErr instanceof Error ? sessErr.message : sessErr,
          )
        }

        // 3) Subscribe to auth state changes only when connected
        const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          setSession(nextSession)
          if (nextSession?.user) {
            await fetchUserProfile(nextSession.user)
          } else {
            setUser(null)
          }
          setIsLoading(false)
        })

        unsubscribe = () => data.subscription.unsubscribe()

        clearTimeout(initTimeout)
      } catch (err) {
        console.error("[v0] Auth initialization error:", err)
        clearTimeout(initTimeout)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
    return () => {
      if (unsubscribe) unsubscribe()
      if (initTimeout) clearTimeout(initTimeout)
    }
  }, [fetchUserProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase || connectionStatus !== "connected") {
        throw new Error("Authentication service unavailable. Please try again later.")
      }

      try {
        setIsLoading(true)
        clearError()

        if (!isValidEmail(email)) {
          throw new Error("Invalid email format.")
        }

        console.log("[v0] Attempting signin for:", email)

        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: sanitizeInput(email),
            password,
          }),
          10000,
        )

        if (error) {
          console.error("[v0] Signin error:", error.message)
          if (error.message === "Email not confirmed") {
            throw new Error("Please confirm your email (check inbox) or contact support.")
          }
          if (error.message === "Invalid login credentials") {
            const customError = new Error("Account not found. Please create an account first or verify your password.")
            customError.name = "AccountNotFound"
            throw customError
          }
          throw error
        }

        if (data.session && data.user) {
          console.log("[v0] Signin successful for:", data.user.email)
          setSession(data.session)
          await fetchUserProfile(data.user)
        }
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile, connectionStatus],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      if (!supabase || connectionStatus !== "connected") {
        throw new Error("Signup service unavailable. Please try again later.")
      }
      try {
        setIsLoading(true)
        clearError()

        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        if (!isStrongPassword(password)) throw new Error("Password must be at least 6 characters long.")

        // Instant signup path (kept as-is, wrapped with timeout)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const resp = await fetch("/api/auth/instant-signup", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sanitizeInput(name),
            email: sanitizeInput(email.toLowerCase()),
            password,
            phone: phone ? sanitizeInput(phone) : undefined,
          }),
        })
          .catch((e) => {
            console.error("instant-signup fetch error:", e)
            throw new Error("Network issue during signup. Please try again.")
          })
          .finally(() => clearTimeout(timeout))

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}))
          if (resp.status !== 409 && !data?.error?.includes?.("already")) {
            throw new Error(data?.error || "Failed to create account.")
          }
        }

        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: sanitizeInput(email.toLowerCase()),
            password,
          }),
          10000,
        )

        if (error) {
          throw new Error(error.message || "Sign-in failed after signup.")
        }

        if (data.session && data.user) {
          setSession(data.session)
          await fetchUserProfile(data.user)
          return { success: true, requiresSignIn: false, user: data.user }
        }

        return { success: true, requiresSignIn: !data.session, user: data.user ?? undefined }
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile, connectionStatus],
  )

  const signOut = useCallback(async () => {
    if (!supabase || connectionStatus !== "connected") {
      // Already "signed out" in a disconnected state
      setUser(null)
      setSession(null)
      return
    }
    try {
      setIsLoading(true)
      clearError()
      const { error } = await withTimeout(supabase.auth.signOut(), 8000)
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [clearError, handleError, connectionStatus])

  const updateUser = useCallback(
    async (userData: Partial<Profile>) => {
      if (!supabase || !user || connectionStatus !== "connected") {
        throw new Error("Profile service unavailable or not authenticated.")
      }
      try {
        setIsLoading(true)
        clearError()
        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .update({
              ...userData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select()
            .single(),
          10000,
        )
        if (error) throw error
        const updatedProfile = { ...data, name: data.full_name || data.name || "User" }
        setUser(updatedProfile)
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [user, clearError, handleError, connectionStatus],
  )

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase || connectionStatus !== "connected") {
        throw new Error("Password reset service unavailable. Please try again later.")
      }
      try {
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        const { error } = await withTimeout(
          supabase.auth.resetPasswordForEmail(sanitizeInput(email), {
            redirectTo: `${window.location.origin}/reset-password`,
          }),
          10000,
        )
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [clearError, handleError, connectionStatus],
  )

  const resetPasswordWithToken = useCallback(
    async (token: string, newPassword: string) => {
      if (!supabase || connectionStatus !== "connected") {
        throw new Error("Password update service unavailable. Please try again later.")
      }
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long.")
        const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }), 10000)
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [clearError, handleError, connectionStatus],
  )

  const changePassword = useCallback(
    async (_currentPassword: string, newPassword: string) => {
      if (!supabase || !user || connectionStatus !== "connected") {
        throw new Error("Password change unavailable or not authenticated.")
      }
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long.")
        const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }), 10000)
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [user, clearError, handleError, connectionStatus],
  )

  const signInWithGoogle = useCallback(async () => {
    console.log("[v0] Google OAuth button clicked - starting authentication flow")

    if (!supabase || connectionStatus !== "connected") {
      console.log("[v0] Google OAuth failed - Supabase not connected:", { supabase: !!supabase, connectionStatus })
      throw new Error("Authentication service unavailable. Please try again later.")
    }

    try {
      setIsLoading(true)
      clearError()

      console.log("[v0] Calling Supabase signInWithOAuth for Google...")
      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        10000,
      )

      console.log("[v0] Google OAuth response:", { data, error })

      if (error) {
        console.error("[v0] Google OAuth error:", error)
        throw error
      }

      console.log("[v0] Google OAuth initiated successfully, redirecting...")
      // OAuth redirect will handle the rest
    } catch (err) {
      console.error("[v0] Google OAuth catch block:", err)
      handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [clearError, handleError, connectionStatus])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    connectionStatus,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUser,
    resetPassword,
    resetPasswordWithToken,
    changePassword,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.error(
      "[v0] useAuth hook called outside of AuthProvider. Make sure your component is wrapped with AuthProvider.",
    )
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
