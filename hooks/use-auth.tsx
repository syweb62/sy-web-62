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

const withTimeout = async <T,>(p: Promise<T>, ms = 15000): Promise<T> => {
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

const getUserRole = (email: string | null | undefined): "admin" | "manager" | "user" => {
  if (!email) return "user"
  const normalizedEmail = email.toLowerCase().trim()
  if (normalizedEmail === "admin@sushiyaki.com") return "admin"
  if (normalizedEmail === "manager@sushiyaki.com") return "manager"
  return "user"
}

const createProfile = (u: SupabaseUser): Profile => ({
  id: u.id,
  email: u.email ?? "",
  full_name: (u.user_metadata?.full_name || u.user_metadata?.name || "User") as string,
  name: (u.user_metadata?.full_name || u.user_metadata?.name || "User") as string,
  avatar_url: u.user_metadata?.avatar_url || "",
  phone: u.user_metadata?.phone || "",
  address: "",
  role: getUserRole(u.email),
  created_at: u.created_at,
  updated_at: u.updated_at || u.created_at,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("testing")
  const [authInitialized, setAuthInitialized] = useState(false)

  const clearError = useCallback(() => setError(null), [])

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error && !err.message.includes("session")) {
      console.error("[v0] Auth error:", err.message)
    }
    setError(err as AuthError)
  }, [])

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const stableProfile = createProfile(supabaseUser)

      if (!supabase) {
        setUser(stableProfile)
        return stableProfile
      }

      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", supabaseUser.id).maybeSingle(),
        3000,
      )

      if (error && (error as any).code !== "PGRST116") {
        setUser(stableProfile)
        return stableProfile
      }

      if (data) {
        const finalProfile = {
          ...stableProfile,
          ...data,
          role: stableProfile.role,
          name: data.full_name || data.name || stableProfile.name,
        }
        setUser(finalProfile)
        return finalProfile
      }

      const newProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: stableProfile.full_name,
        avatar_url: stableProfile.avatar_url,
        phone: stableProfile.phone,
        role: stableProfile.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single()
        .catch(() => {})

      setUser(stableProfile)
      return stableProfile
    } catch (err) {
      const fallbackProfile = createProfile(supabaseUser)
      setUser(fallbackProfile)
      return fallbackProfile
    }
  }, [])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let mounted = true

    const initializeAuth = async () => {
      if (authInitialized) return

      try {
        const connectionResult = await testSupabaseConnection().catch(() => ({
          status: "connected",
        }))
        if (mounted) {
          setConnectionStatus(connectionResult.status as "connected" | "disconnected" | "testing")
        }

        if (!supabase || !mounted) {
          setIsLoading(false)
          return
        }

        let currentSession: Session | null = null
        try {
          const { data: sessionData } = await withTimeout(supabase.auth.getSession(), 10000)
          currentSession = sessionData?.session ?? null
        } catch (err) {
          if (err instanceof Error && err.message.includes("Invalid Refresh Token")) {
            console.log("[v0] Invalid refresh token detected, clearing session")
            await supabase.auth.signOut().catch(() => {})
            currentSession = null
          } else {
            throw err
          }
        }

        if (!mounted) return

        setSession(currentSession)

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user)
        } else {
          setUser(null)
        }

        if (!authInitialized) {
          const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
            if (!mounted) return

            try {
              setSession(nextSession)
              if (nextSession?.user) {
                await fetchUserProfile(nextSession.user)
              } else {
                setUser(null)
              }
            } catch (err) {
              if (err instanceof Error && err.message.includes("Invalid Refresh Token")) {
                console.log("[v0] Invalid refresh token in auth state change, clearing session")
                setSession(null)
                setUser(null)
              } else {
                console.error("[v0] Auth state change error:", err)
              }
            }
          })

          unsubscribe = () => data.subscription.unsubscribe()
          setAuthInitialized(true)
        }
      } catch (err) {
        console.error("[v0] Auth initialization error:", err)
        if (err instanceof Error && err.message.includes("Invalid Refresh Token")) {
          console.log("[v0] Clearing invalid session during initialization")
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [fetchUserProfile, authInitialized])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Authentication service unavailable")
      }

      try {
        setIsLoading(true)
        clearError()

        if (!isValidEmail(email)) {
          throw new Error("Invalid email format")
        }

        console.log(`[v0] Attempting admin login with: ${email}`)

        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: sanitizeInput(email.toLowerCase()),
            password,
          }),
          15000,
        )

        if (error) {
          if (error.message === "Invalid login credentials") {
            throw new Error("Invalid email or password")
          }
          if (error.message === "request-timeout") {
            throw new Error("Connection timeout. Please check your internet connection and try again.")
          }
          throw error
        }

        if (data.session && data.user) {
          setSession(data.session)
          const profile = await fetchUserProfile(data.user)
          console.log("[v0] Admin login successful")
        }

        console.log("[v0] Login successful, useEffect will handle redirect")
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile],
  )

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      clearError()

      if (!supabase) {
        setUser(null)
        setSession(null)
        return
      }

      const { error } = await withTimeout(supabase.auth.signOut(), 5000)
      if (error && !error.message.includes("Auth session missing")) {
        throw error
      }

      setUser(null)
      setSession(null)
    } catch (err) {
      setUser(null)
      setSession(null)
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [clearError, handleError])

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      if (!supabase) {
        throw new Error("Signup service unavailable")
      }
      try {
        setIsLoading(true)
        clearError()

        if (!isValidEmail(email)) throw new Error("Invalid email format")
        if (!isStrongPassword(password)) throw new Error("Password must be at least 6 characters long")

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

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
        }).finally(() => clearTimeout(timeout))

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}))
          if (resp.status !== 409) {
            throw new Error(data?.error || "Failed to create account")
          }
        }

        const { data: signInData, error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: sanitizeInput(email.toLowerCase()),
            password,
          }),
          15000,
        )

        if (signInError) {
          throw new Error(signInError.message || "Sign-in failed after signup")
        }

        if (signInData.session && signInData.user) {
          setSession(signInData.session)
          await fetchUserProfile(signInData.user)
          return { success: true, requiresSignIn: false, user: signInData.user }
        }

        return { success: true, requiresSignIn: !signInData.session, user: signInData.user ?? undefined }
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile],
  )

  const updateUser = useCallback(
    async (userData: Partial<Profile>) => {
      if (!supabase || !user) {
        throw new Error("Profile service unavailable or not authenticated")
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
          15000,
        )
        if (error) throw error
        const updatedProfile = { ...data, name: data.full_name || data.name || "User" }
        setUser(updatedProfile)
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [user, clearError, handleError],
  )

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        throw new Error("Password reset service unavailable")
      }
      try {
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format")
        const { error } = await withTimeout(
          supabase.auth.resetPasswordForEmail(sanitizeInput(email), {
            redirectTo: `${window.location.origin}/reset-password`,
          }),
          15000,
        )
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [clearError, handleError],
  )

  const resetPasswordWithToken = useCallback(
    async (token: string, newPassword: string) => {
      if (!supabase) {
        throw new Error("Password update service unavailable")
      }
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long")
        const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }), 15000)
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [clearError, handleError],
  )

  const changePassword = useCallback(
    async (_currentPassword: string, newPassword: string) => {
      if (!supabase || !user) {
        throw new Error("Password change unavailable or not authenticated")
      }
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long")
        const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }), 15000)
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [user, clearError, handleError],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error("Authentication service unavailable")
    }

    try {
      setIsLoading(true)
      clearError()

      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        15000,
      )

      if (error) {
        throw error
      }
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [clearError, handleError])

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
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
