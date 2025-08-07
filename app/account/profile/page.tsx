"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MapPin, Edit, Save, X, User, Mail, Phone, Check, AlertCircle, ArrowLeft, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  address?: string
}

const ProfilePage = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin")
    }
  }, [user, authLoading, router])

  // Load user data when available
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      }
      setFormData(userData)
      setProfileImage(user.avatar || null)
    }
    setIsLoading(false)
  }, [user])

  // Track unsaved changes
  useEffect(() => {
    if (user && isEditing) {
      const hasChanges =
        formData.name !== (user.name || "") ||
        formData.email !== (user.email || "") ||
        formData.phone !== (user.phone || "") ||
        formData.address !== (user.address || "") ||
        profileImage !== (user.avatar || null)
      setHasUnsavedChanges(hasChanges)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [formData, user, isEditing, profileImage])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate name (required, min 2 characters)
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters"
    }

    // Validate email (required and valid format)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate phone (optional but if provided, must be valid)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^(\+88)?01[3-9]\d{8}$/
      if (!phoneRegex.test(formData.phone.trim().replace(/\s/g, ""))) {
        newErrors.phone = "Please enter a valid phone number (e.g., 01712345678)"
      }
    }

    // Validate address (optional but if provided, must be complete)
    if (formData.address && formData.address.trim() && formData.address.trim().length < 15) {
      newErrors.address = "Please provide a complete address (minimum 15 characters)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setSuccessMessage("")
    setErrors({}) // Clear any existing errors

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        avatar: profileImage || undefined,
      }

      console.log("Updating profile with data:", updateData)

      // Direct API call instead of using the auth hook to avoid context issues
      const response = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      console.log("Update response status:", response.status)
      console.log("Update response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          success: false,
          error: "Failed to parse error response",
        }))
        console.error("Update failed:", errorData)
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Update result:", result)

      if (result.success && result.user) {
        // Update the user in the auth context
        await updateUser(result.user)

        setIsEditing(false)
        setSuccessMessage("Profile updated successfully!")
        setHasUnsavedChanges(false)

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("")
        }, 5000)
      } else {
        throw new Error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update failed:", error)

      let errorMessage = "Failed to update profile. Please try again."

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("email")) {
          setErrors({ email: "Email address is already in use or invalid" })
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("validation")) {
          errorMessage = "Please check your information and try again."
        } else {
          errorMessage = error.message
        }
      }

      // If no specific field error, show general error
      if (!Object.keys(errors).length) {
        setErrors({ name: errorMessage })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      })
      setProfileImage(user.avatar || null)
    }
    setErrors({})
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  const handleImageUpdate = (imageUrl: string) => {
    if (!isEditing) {
      console.log("Profile picture update blocked - not in edit mode")
      return
    }

    setProfileImage(imageUrl)
    // Mark as having unsaved changes when image is updated
    setHasUnsavedChanges(true)
  }

  // Show loading state while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Simplified header section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg border border-gold/20 mb-4">
            <User className="text-gold" size={16} />
            <span className="text-sm font-medium text-gold">Profile Management</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Manage Your Account</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Keep your profile information up to date for the best experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 space-y-6">
              {/* Profile Picture */}
              <div className="text-center">
                <ProfilePictureUpload
                  currentImage={profileImage}
                  onImageUpdate={handleImageUpdate}
                  className="mb-4"
                  isEditable={isEditing}
                />
                <h2 className="text-xl font-semibold text-white">{user.name || "User"}</h2>
                <p className="text-gray-400">{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">Verified Account</span>
                </div>
              </div>

              {/* Tips Card */}
              <div className="mt-6 bg-blue-900/10 rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-400 mt-1" size={20} />
                  <div>
                    <h3 className="text-white font-medium mb-2">Tips</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Complete profile for faster checkout</li>
                      <li>• Add phone for order updates</li>
                      <li>• Set address for delivery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <Check className="text-green-400 flex-shrink-0" size={20} />
                <p className="text-green-400 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
                <p className="text-yellow-400 font-medium">You have unsaved changes</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Personal Information</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors font-medium"
                  >
                    <Edit size={16} />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <User size={16} className="text-gold" />
                  Full Name
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full rounded-lg border bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                    errors.name
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-gray-600 focus:ring-gold/50 focus:border-gold"
                  }`}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={16} />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Mail size={16} className="text-gold" />
                  Email Address
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full rounded-lg border bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-gray-600 focus:ring-gold/50 focus:border-gold"
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={16} />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Phone size={16} className="text-gold" />
                  Phone Number
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full rounded-lg border bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-gray-600 focus:ring-gold/50 focus:border-gold"
                  }`}
                  placeholder="01712345678"
                />
                {errors.phone && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={16} />
                    {errors.phone}
                  </div>
                )}
                <p className="text-xs text-gray-400">We'll use this for order updates and delivery coordination</p>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <MapPin size={16} className="text-gold" />
                  Delivery Address
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full rounded-lg border bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all ${
                    errors.address
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-gray-600 focus:ring-gold/50 focus:border-gold"
                  }`}
                  placeholder="Enter your complete delivery address including house/flat number, road, area, and landmark"
                />
                {errors.address && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={16} />
                    {errors.address}
                  </div>
                )}
                <p className="text-xs text-gray-400">This will be your default delivery address for orders</p>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex-1"
                  >
                    <Save size={18} />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex-1"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
