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
  // Simplified password requirement - 6+ characters
  return password.length >= 6
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
      console.log("Fetching user profile for:", supabaseUser.id)
      
      // Try to fetch from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error("Error fetching user profile:", error.message)
      }

      if (data) {
        console.log("Profile found:", data)
        // Ensure we have proper name field for navbar display
        const profileWithName = {
          ...data,
          name: data.full_name || data.name || "User" // Add name field for navbar
        }
        setUser(profileWithName)
        return profileWithName
      } else {
        console.log("No profile found, creating new profile for user:", supabaseUser.id)
        
        // Create new profile
        const newUserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || "New User",
          avatar_url: supabaseUser.user_metadata?.avatar_url || "",
          phone: supabaseUser.user_metadata?.phone || "",
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newUserProfile])
          .select()
          .single()

        if (createError) {
          console.error("Error creating user profile:", createError.message)
          // Use fallback profile if database insert fails
          const fallbackProfile: Profile = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            full_name: supabaseUser.user_metadata?.full_name || "New User",
            name: supabaseUser.user_metadata?.full_name || "New User", // Add name field
            role: 'user',
            created_at: supabaseUser.created_at,
            updated_at: supabaseUser.updated_at || supabaseUser.created_at,
          }
          setUser(fallbackProfile)
          return fallbackProfile
        } else {
          console.log("Profile created successfully:", createdProfile)
          const profileWithName = {
            ...createdProfile,
            name: createdProfile.full_name || "User" // Add name field for navbar
          }
          setUser(profileWithName)
          return profileWithName
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchUserProfile:", err)
      // Generic fallback for any unexpected errors
      const fallbackProfile: Profile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name: supabaseUser.user_metadata?.full_name || "New User",
        name: supabaseUser.user_metadata?.full_name || "New User", // Add name field
        role: 'user',
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at || supabaseUser.created_at,
      }
      setUser(fallbackProfile)
      return fallbackProfile
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Initializing auth...")
      
      const connectionResult = await testSupabaseConnection()
      setConnectionStatus(connectionResult.status)

      if (!supabase) {
        console.warn("Supabase not available")
        setIsLoading(false)
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
        }
        
        console.log("Initial session:", session?.user?.email || "No session")
        
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user)
        }
      } catch (error) {
        console.error("Error in getSession:", error)
      }
      
      setIsLoading(false)

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email || "No user")
        
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    initializeAuth()
  }, [fetchUserProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      console.log("SignIn called with:", email)
      
      if (!supabase) {
        console.error("Supabase not initialized")
        throw new Error("Supabase not initialized")
      }
      
      try {
        setIsLoading(true)
        clearError()
        
        if (!isValidEmail(email)) {
          throw new Error("Invalid email format.")
        }
        
        console.log("Attempting to sign in...")
        
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: sanitizeInput(email), 
          password 
        })
        
        console.log("SignIn response:", { 
          user: data.user?.email, 
          session: !!data.session, 
          error: error?.message 
        })
        
        if (error) {
          // Handle specific email confirmation error
          if (error.message === "Email not confirmed") {
            throw new Error("Please check your email and click the confirmation link, or contact support.")
          }
          
          // If invalid credentials, suggest creating account
          if (error.message === "Invalid login credentials") {
            const customError = new Error("Account not found. Please create an account first or check your email and password.")
            customError.name = "AccountNotFound"
            throw customError
          }
          
          console.error("SignIn error:", error)
          throw error
        }
        
        if (data.session && data.user) {
          console.log("SignIn successful, setting session and user")
          setSession(data.session)
          await fetchUserProfile(data.user)
        }
        
      } catch (err) {
        console.error("SignIn catch block:", err)
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      console.log("SignUp called with:", email)
      
      if (!supabase) throw new Error("Supabase not initialized")
      try {
        setIsLoading(true)
        clearError()
        if (!isValidEmail(email)) throw new Error("Invalid email format.")
        if (!isStrongPassword(password)) throw new Error("Password must be at least 6 characters long.")

        console.log("Attempting to sign up...")

        const { data, error } = await supabase.auth.signUp({
          email: sanitizeInput(email),
          password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation redirect
            data: {
              full_name: sanitizeInput(name),
              name: sanitizeInput(name), // Also set name for compatibility
              phone: phone ? sanitizeInput(phone) : undefined,
            },
          },
        })
        
        console.log("SignUp response:", { 
          user: data.user?.email, 
          session: !!data.session, 
          error: error?.message 
        })
        
        if (error) {
          console.error("SignUp error:", error)
          throw error
        }
        
        if (data.user && data.session) {
          console.log("SignUp successful with immediate session")
          setSession(data.session)
          await fetchUserProfile(data.user)
          return { success: true, requiresSignIn: false, user: data.user }
        } else if (data.user && !data.session) {
          console.log("SignUp successful but no session - email confirmation may be required")
          return { success: true, requiresSignIn: true, user: data.user }
        }
        
        return { success: true, requiresSignIn: !data.session, user: data.user ?? undefined }
      } catch (err) {
        console.error("SignUp catch block:", err)
        handleError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearError, handleError, fetchUserProfile],
  )

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error("Supabase not initialized")
    try {
      setIsLoading(true)
      clearError()
      console.log("Signing out...")
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      console.log("Signed out successfully")
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
        
        console.log("Updating user profile:", userData)
        
        const { data, error } = await supabase
          .from("profiles")
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)
          .select()
          .single()
          
        if (error) {
          console.error("Profile update error:", error)
          throw error
        }
        
        console.log("Profile updated successfully:", data)
        // Add name field for navbar display
        const updatedProfile = {
          ...data,
          name: data.full_name || data.name || "User"
        }
        setUser(updatedProfile)
        
        // Force a small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error("Update user error:", err)
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
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long.")
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
        if (!isStrongPassword(newPassword)) throw new Error("New password must be at least 6 characters long.")
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
