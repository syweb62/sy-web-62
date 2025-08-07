"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Shield, Key } from "lucide-react"

export default function SecurityPage() {
  const { user, changePassword } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    setSuccess(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

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
      await changePassword(formData.currentPassword, formData.newPassword)
      setSuccess(true)
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ form: error.message })
      } else {
        setErrors({ form: "An unexpected error occurred" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-darkBg pt-20">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please sign in to access your security settings.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-darkBg pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Security Settings</h1>
            <p className="text-gray-400">Manage your account security and password</p>
          </div>

          {/* Account Security Overview */}
          <Card className="mb-8 bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-gold" />
                Account Security
              </CardTitle>
              <CardDescription>Your account security status and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-medium text-white">Email Verified</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Password Protected</p>
                    <p className="text-sm text-gray-400">Last changed recently</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
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
                    Your password has been successfully updated!
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                  placeholder="Enter your current password"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />

                <Input
                  label="New Password"
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  placeholder="Enter your new password"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Confirm your new password"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Different from your current password</li>
                    <li>• Use a combination of letters, numbers, and symbols for better security</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
