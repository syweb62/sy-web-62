"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Mail, Eye, EyeOff, CheckCircle, Info, User, Lock, Phone, RefreshCw } from "lucide-react"

export default function SignIn() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({})
  const { signIn, signUp, resetPassword, isLoading, error, clearError, user } = useAuth()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [isResettingRateLimit, setIsResettingRateLimit] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Check if user was redirected from password reset flow
  useEffect(() => {
    const forgotPassword = searchParams.get("forgotPassword")
    if (forgotPassword === "true") {
      setShowForgotPassword(true)
    }
  }, [searchParams])

  // Clear auth errors when component unmounts or form changes
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) && value.length <= 254
      case "password":
        if (isLogin) {
          return value.length >= 6
        } else {
          return (
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(value)
          )
        }
      case "name":
        return value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(value.trim())
      case "confirmPassword":
        return value === formData.password
      case "phone":
        // Bangladesh phone number validation (11 digits after country code)
        const phoneRegex = /^[0-9]{11}$/
        return phoneRegex.test(value)
      default:
        return true
    }
  }

  const getFieldError = (name: string, value: string) => {
    switch (name) {
      case "email":
        if (!value) return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address"
        return ""
      case "password":
        if (!value) return "Password is required"
        if (isLogin) {
          if (value.length < 6) return "Password must be at least 6 characters"
        } else {
          if (value.length < 8) return "Password must be at least 8 characters"
          if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter"
          if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter"
          if (!/[0-9]/.test(value)) return "Password must contain a number"
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Password must contain a special character"
        }
        return ""
      case "name":
        if (!value) return "Name is required"
        if (value.trim().length < 2) return "Name must be at least 2 characters"
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Name can only contain letters and spaces"
        return ""
      case "confirmPassword":
        if (!value) return "Please confirm your password"
        if (value !== formData.password) return "Passwords do not match"
        return ""
      case "phone":
        if (!value) return "Phone number is required"
        if (!/^[0-9]{11}$/.test(value)) return "Please enter a valid 11-digit phone number"
        return ""
      default:
        return ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    const isValid = validateField(name, value)
    setFieldValidation((prev) => ({ ...prev, [name]: isValid }))

    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError()
    }
  }

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}
    let fieldsToValidate: string[] = []

    if (isLogin) {
      fieldsToValidate = ["email", "password"]
    } else {
      fieldsToValidate = ["name", "email", "password", "confirmPassword", "phone"]
    }

    fieldsToValidate.forEach((field) => {
      const fieldError = getFieldError(field, formData[field as keyof typeof formData])
      if (fieldError) {
        newErrors[field] = fieldError
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetRateLimit = async () => {
    try {
      setIsResettingRateLimit(true)

      const endpoint = isLogin ? "/api/auth/signin" : "/api/auth/signup"
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        clearError()
        console.log("Rate limits reset successfully")
      } else {
        console.error("Failed to reset rate limits")
      }
    } catch (error) {
      console.error("Error resetting rate limits:", error)
    } finally {
      setIsResettingRateLimit(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCurrentStep()) return

    try {
      if (isLogin) {
        console.log("Attempting to sign in with:", formData.email)
        await signIn(formData.email, formData.password)
        // Navigation will be handled by the useEffect that watches for user changes
      } else {
        console.log("Attempting to sign up with:", formData.email)
        const result = await signUp(formData.name, formData.email, formData.password, formData.phone)

        if (result && result.success) {
          if (!result.requiresSignIn) {
            // User is automatically signed in, navigation will be handled by useEffect
            console.log("User automatically signed in after signup")
          } else {
            // Show success message and switch to login
            setSignUpSuccess(true)
            setTimeout(() => {
              setSignUpSuccess(false)
              setIsLogin(true)
              setFormData({
                name: "",
                email: formData.email, // Keep email for convenience
                password: "",
                confirmPassword: "",
                phone: "",
              })
            }, 3000)
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      // Error will be displayed via the error state from useAuth
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = getFieldError("email", formData.email)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }

    try {
      await resetPassword(formData.email)
      setResetSent(true)
      console.log(`Password reset initiated for: ${formData.email}`)
    } catch (error) {
      console.error("Password reset error:", error)
    }
  }

  const getErrorMessage = () => {
    if (!error) return null

    let message = error.message
    if (error.retryAfter) {
      message += ` Please try again in ${error.retryAfter} seconds.`
    }

    return message
  }

  const isRateLimitError = () => {
    return error && error.code === "RATE_LIMIT_EXCEEDED"
  }

  // Don't render if user is already logged in
  if (user) {
    return null
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-[40vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            {showForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Join Our Community"}
          </h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            {showForgotPassword
              ? "Enter your email address and we'll send you a link to reset your password."
              : isLogin
                ? "Sign in to your account to access exclusive features and track your orders."
                : "Create your account to enjoy personalized dining experiences, track orders, and receive special offers."}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-black/30 p-8 rounded-lg border border-gray-800 backdrop-blur-sm">
            {/* Enhanced Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{getErrorMessage()}</p>
                    {error.code && <p className="text-sm text-red-300 mt-1">Error Code: {error.code}</p>}
                    {isRateLimitError() && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={resetRateLimit}
                          disabled={isResettingRateLimit}
                          className="text-xs bg-transparent"
                        >
                          {isResettingRateLimit ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset Rate Limit
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {signUpSuccess && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-md text-green-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Account created successfully!</p>
                    <p className="text-sm text-green-300 mt-1">
                      You are now logged in and can start using the platform.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Message for New Users */}
            {!error && !signUpSuccess && (
              <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-md text-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium mb-2">{isLogin ? "Sign In to Your Account" : "Create Your Account"}</p>
                    <p className="text-sm">
                      {isLogin
                        ? "Enter your email and password to access your account. Don't have an account yet? Switch to sign up below."
                        : "Fill out the form below to create your new account. You'll be automatically logged in after successful registration."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resetSent ? (
              <div className="text-center space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-center">
                  <div className="p-4 bg-green-900/30 rounded-full">
                    <Mail className="h-12 w-12 text-green-400" />
                  </div>
                </div>
                <div className="p-4 bg-green-900/50 border border-green-700 rounded-md text-green-200">
                  <p className="font-medium text-lg mb-2">Check Your Email</p>
                  <p>
                    We've sent a password reset link to <strong>{formData.email}</strong>.
                  </p>
                </div>

                <div className="text-gray-300 text-sm space-y-4">
                  <p>
                    <strong>Didn't receive the email?</strong> Please check your spam folder or try the following:
                  </p>
                  <ul className="list-disc pl-5 text-left space-y-2">
                    <li>Verify you entered the correct email address</li>
                    <li>Add noreply@sushiyaki.com to your contacts</li>
                    <li>Check your spam or junk mail folder</li>
                    <li>Wait a few minutes and check again</li>
                  </ul>
                  <p className="pt-2 text-blue-300">For this demo, check the browser console to see the reset link.</p>
                </div>

                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false)
                      setResetSent(false)
                      clearError()
                    }}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResetSent(false)
                      clearError()
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : showForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="relative">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="your@email.com"
                    required
                    icon={<Mail className="h-5 w-5" />}
                  />
                  {fieldValidation.email && <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-green-500" />}
                </div>

                <div className="flex flex-col space-y-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForgotPassword(false)
                      clearError()
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sign In Form */}
                {isLogin ? (
                  <>
                    <div className="relative">
                      <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="your@email.com"
                        required
                        icon={<Mail className="h-5 w-5" />}
                      />
                      {fieldValidation.email && (
                        <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="Your password"
                        required
                        icon={<Lock className="h-5 w-5" />}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      {fieldValidation.password && (
                        <CheckCircle className="absolute right-10 top-9 h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true)
                          clearError()
                        }}
                        className="text-sm text-gold hover:underline focus:outline-none focus:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                ) : (
                  /* Sign Up Form */
                  <>
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Create Your Account</h3>
                        <p className="text-sm text-gray-400">Enter your details to get started</p>
                      </div>

                      <div className="relative">
                        <Input
                          label="Full Name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          error={errors.name}
                          placeholder="John Doe"
                          required
                          icon={<User className="h-5 w-5" />}
                        />
                        {fieldValidation.name && (
                          <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="relative">
                        <Input
                          label="Email Address"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          error={errors.email}
                          placeholder="your@email.com"
                          required
                          icon={<Mail className="h-5 w-5" />}
                        />
                        {fieldValidation.email && (
                          <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="relative">
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l-md">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-300 text-sm">+880</span>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="1712345678"
                            required
                            className="flex-1 h-10 px-3 py-2 text-sm text-white bg-gray-800/50 border border-gray-600 rounded-r-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                            <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                            {errors.phone}
                          </p>
                        )}
                        {fieldValidation.phone && (
                          <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="relative">
                        <Input
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          error={errors.password}
                          placeholder="Create a strong password"
                          required
                          icon={<Lock className="h-5 w-5" />}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-300 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {fieldValidation.password && (
                          <CheckCircle className="absolute right-10 top-9 h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="relative">
                        <Input
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          error={errors.confirmPassword}
                          placeholder="Confirm your password"
                          required
                          icon={<Lock className="h-5 w-5" />}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-300 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {fieldValidation.confirmPassword && (
                          <CheckCircle className="absolute right-10 top-9 h-5 w-5 text-green-500" />
                        )}
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">Password Requirements:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div
                              className={`flex items-center gap-1 ${
                                formData.password.length >= 8 ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  formData.password.length >= 8 ? "bg-green-400" : "bg-gray-500"
                                }`}
                              />
                              8+ characters
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                /[A-Z]/.test(formData.password) ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  /[A-Z]/.test(formData.password) ? "bg-green-400" : "bg-gray-500"
                                }`}
                              />
                              Uppercase
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                /[a-z]/.test(formData.password) ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  /[a-z]/.test(formData.password) ? "bg-green-400" : "bg-gray-500"
                                }`}
                              />
                              Lowercase
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                /[0-9]/.test(formData.password) ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  /[0-9]/.test(formData.password) ? "bg-green-400" : "bg-gray-500"
                                }`}
                              />
                              Number
                            </div>
                            <div
                              className={`flex items-center gap-1 col-span-2 ${
                                /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "bg-green-400" : "bg-gray-500"
                                }`}
                              />
                              Special character
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex flex-col space-y-4">
                  {isLogin ? (
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full" disabled={isLoading || Object.keys(errors).length > 0}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  )}

                  <div className="text-center mt-4">
                    <p className="text-gray-400">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(!isLogin)
                          setErrors({})
                          setFieldValidation({})
                          clearError()
                        }}
                        className="text-gold hover:underline focus:outline-none focus:underline transition-colors"
                      >
                        {isLogin ? "Sign Up" : "Sign In"}
                      </button>
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
