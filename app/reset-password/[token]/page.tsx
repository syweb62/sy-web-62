"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ResetToken {
  id: string
  email: string
  token: string
  createdAt: number
  expiresAt: number
}

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    validateToken()
  }, [params.token])

  const validateToken = () => {
    try {
      const resetTokens = JSON.parse(localStorage.getItem("resetTokens") || "[]") as ResetToken[]
      const token = resetTokens.find((t) => t.token === params.token)

      if (!token) {
        setTokenValid(false)
        return
      }

      if (Date.now() > token.expiresAt) {
        setTokenValid(false)
        // Clean up expired token
        const updatedTokens = resetTokens.filter((t) => t.token !== params.token)
        localStorage.setItem("resetTokens", JSON.stringify(updatedTokens))
        return
      }

      setTokenValid(true)
      setUserEmail(token.email)
    } catch (error) {
      console.error("Error validating token:", error)
      setTokenValid(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Get the reset token details
      const resetTokens = JSON.parse(localStorage.getItem("resetTokens") || "[]") as ResetToken[]
      const token = resetTokens.find((t) => t.token === params.token)

      if (!token) {
        throw new Error("Invalid or expired reset token")
      }

      // Update user password
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === token.email.toLowerCase())

      if (userIndex === -1) {
        throw new Error("User account not found")
      }

      // Update password in users array
      users[userIndex].password = formData.newPassword
      localStorage.setItem("users", JSON.stringify(users))

      // Update password in separate passwords storage
      const passwords = JSON.parse(localStorage.getItem("userPasswords") || "{}")
      passwords[token.email.toLowerCase()] = formData.newPassword
      localStorage.setItem("userPasswords", JSON.stringify(passwords))

      // Remove the used token
      const updatedTokens = resetTokens.filter((t) => t.token !== params.token)
      localStorage.setItem("resetTokens", JSON.stringify(updatedTokens))

      console.log("Password reset successful for:", token.email)
      setSuccess(true)

      // Redirect to sign-in page after 3 seconds
      setTimeout(() => {
        router.push("/signin?message=Password reset successful. Please sign in with your new password.")
      }, 3000)
    } catch (error) {
      console.error("Password reset error:", error)
      if (error instanceof Error) {
        setErrors({ form: error.message })
      } else {
        setErrors({ form: "An unexpected error occurred" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="bg-black/30 border-gray-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Invalid Reset Link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-800 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  The reset link may have expired or been used already. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/signin">Request New Reset Link</Link>
                </Button>
                <Button variant="outline" asChild className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                  <Link href="/signin" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="bg-black/30 border-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-gold" />
            </div>
            <CardTitle className="text-white">Reset Your Password</CardTitle>
            <CardDescription>Enter a new password for {userEmail}</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.form && (
              <Alert className="mb-6 border-red-800 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">{errors.form}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-800 bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  Password reset successful! Redirecting to sign in...
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-200 block">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    required
                    className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.newPassword && <p className="text-red-400 text-sm">{errors.newPassword}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200 block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    required
                    className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Use a combination of letters, numbers, and symbols for better security</li>
                    <li>• Choose something memorable but secure</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating Password...
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Link href="/signin" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
