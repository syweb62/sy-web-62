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
  signOut: () => Promise<void>
  updateUser: (userData: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  error: AuthError | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Validation utilities
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const escapeMap: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    }
    return escapeMap[match]
  })
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("testing")

  const clearError = useCallback(() => setError(null), [])
  const handleError = useCallback((error: unknown) => {
    console.error("Auth error:", error)
    setError(error as AuthError)
  }, [])

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    if (!supabase) return null
    try {
      // Try to fetch from profiles table without .single() initially
      const { data, error } = await supabase.from("profiles").select("*").eq("id", supabaseUser.id)

      if (error) {
        console.error("Error fetching user profile:", error.message)
        // If there's a database error, still try to create a fallback
        const fallbackProfile: Profile = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || "New User",
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at || supabaseUser.created_at,
        }
        setUser(fallbackProfile)
        return fallbackProfile
      }

      if (data && data.length > 0) {
        // Profile found
        setUser(data[0]) // Take the first one if multiple, though id should be unique
        return data[0]
      } else {
        // No profile found, create one
        console.log("No profile found for user, creating new profile.")
        const newUserProfile: Partial<Profile> = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || "", // Use metadata from signup
          avatar_url: supabaseUser.user_metadata?.avatar_url || "",
          phone: supabaseUser.user_metadata?.phone || "",
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at || supabaseUser.created_at,
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newUserProfile])
          .select()
          .single() // Use .single() here as we expect exactly one insertion

        if (createError) {
          console.error("Error creating user profile:", createError.message)
          // Fallback to basic user object if creation fails
          const fallbackProfile: Profile = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            full_name: supabaseUser.user_metadata?.full_name || "New User",
            created_at: supabaseUser.created_at,
            updated_at: supabaseUser.updated_at || supabaseUser.created_at,
          }
          setUser(fallbackProfile)
          return fallbackProfile
        } else {
          setUser(createdProfile)
          return createdProfile
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchUserProfile:", err)
      // Generic fallback for any unexpected errors
      const fallbackProfile: Profile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: supabaseUser.user_metadata?.full_name || "New User",
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at || supabaseUser.created_at,
      }
      setUser(fallbackProfile)
      return fallbackProfile
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      const connectionResult = await testSupabaseConnection()
      setConnectionStatus(connectionResult.status)

      if (!supabase || !connectionResult.connected) {
        console.warn("Supabase not available:", connectionResult.error)
        setIsLoading(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      }
      setIsLoading(false)

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }

    initializeAuth()
  }, [fetchUserProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not initialized")
      try {
        setIsLoading(true)
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        const { error } = await supabase.auth.signInWithPassword({ email: sanitizeInput(email), password })
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      if (!supabase) throw new Error("Supabase not initialized")
      try {
        setIsLoading(true)
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        if (!isStrongPassword(password)) throw new Error("Password is not strong enough.")

        const { data, error } = await supabase.auth.signUp({
          email: sanitizeInput(email),
          password,
          options: {
            data: {
              full_name: sanitizeInput(name),
              phone: phone ? sanitizeInput(phone) : undefined,
            },
          },
        })
        if (error) throw error
        return { success: true, requiresSignIn: !data.session, user: data.user ?? undefined }
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError],
  )

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error("Supabase not initialized")
    try {
      setIsLoading(true)
      clearError()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [clearError, handleError])

  const updateUser = useCallback(
    async (userData: Partial<Profile>) => {
      if (!supabase || !user) throw new Error("User not authenticated or Supabase not initialized")
      try {
        setIsLoading(true)
        clearError()
        const { data, error } = await supabase.from("profiles").update(userData).eq("id", user.id).select().single()
        if (error) throw error
        setUser(data)
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
      if (!supabase) throw new Error("Supabase not initialized")
      try {
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizeInput(email), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
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
      if (!supabase) throw new Error("Supabase not initialized")
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password is not strong enough.")
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [clearError, handleError],
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!supabase || !user) throw new Error("User not authenticated or Supabase not initialized")
      try {
        clearError()
        if (!isStrongPassword(newPassword)) throw new Error("New password is not strong enough.")
        // Note: Supabase doesn't have a direct changePassword method that verifies the old password.
        // This is typically handled by re-authenticating and then updating.
        // For simplicity, we'll just update the user's password directly.
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [user, clearError, handleError],
  )

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    connectionStatus,
    signIn,
    signUp,
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
