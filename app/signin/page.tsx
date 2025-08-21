"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, User, Phone, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
  phone?: string
  general?: string
}

export default function SignInPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  })

  const { signIn, signUp, signInWithGoogle, user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectTo)
    }
  }, [user, authLoading, router, redirectTo])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = "Full name is required"
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters"
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required"
      } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        console.log("[v0] Attempting admin login with:", formData.email.trim().toLowerCase())
        await signIn(formData.email.trim().toLowerCase(), formData.password)

        if (formData.email.trim().toLowerCase() === "admin@sushiyaki.com") {
          console.log("[v0] Admin login successful, redirecting to:", redirectTo === "/" ? "/dashboard" : redirectTo)
          router.push(redirectTo === "/" ? "/dashboard" : redirectTo)
        } else {
          console.log("[v0] Regular user login successful, redirecting to:", redirectTo)
          router.push(redirectTo)
        }
      } else {
        await signUp(formData.name.trim(), formData.email.trim().toLowerCase(), formData.password, formData.phone)
        router.push(redirectTo)
      }
    } catch (error) {
      console.error("[v0] Authentication error:", error)

      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ general: "Invalid email or password. Please check your credentials and try again." })
        } else if (error.message.includes("User already registered")) {
          setErrors({ email: "An account with this email already exists. Please sign in instead." })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ email: "", password: "", confirmPassword: "", name: "", phone: "" })
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  if (user && !authLoading) {
    return null
  }

  return (
    <>
      <section className="hero-section min-h-[40vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            {isLogin ? "Welcome Back" : "Join Our Community"}
          </h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            {isLogin
              ? "Sign in to your account to access exclusive features and track your orders."
              : "Create your account to enjoy personalized dining experiences and exclusive offers."}
          </p>
        </div>
      </section>

      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-8 p-6 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-200 mb-2">
                    {isLogin ? "Sign In to Your Account" : "Create Your Account"}
                  </h3>
                  <p className="text-blue-300 text-sm leading-relaxed">
                    {isLogin
                      ? "Enter your email and password to access your account. Don't have an account yet? Switch to sign up below."
                      : "Fill out the form below to create your new account. You'll be automatically logged in after successful registration."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-8 rounded-lg border border-gray-800 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isLogin ? "Sign In to Your Account" : "Create Your Account"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isLogin
                    ? "Enter your email and password to access your account"
                    : "Enter your details to get started"}
                </p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-200">
                  <p className="text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-stretch min-h-[48px]">
                      <div className="flex items-center px-2 bg-gray-700 border border-r-0 border-gray-600 rounded-l-md min-w-[60px] max-w-[60px] justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-gray-400 mr-1" />
                        <div className="w-4 h-4 rounded-full relative overflow-hidden flex items-center justify-center bg-[rgba(14,133,11,1)] flex-shrink-0">
                          <div className="absolute rounded-full bg-[rgba(185,6,6,1)] h-2 w-2"></div>
                        </div>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="flex-1 min-w-0 px-3 py-3 bg-gray-800/50 border border-gray-600 rounded-r-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none overflow-hidden"
                        placeholder="1712345678"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder={isLogin ? "Your password" : "Create a strong password"}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                  </div>
                )}

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-gold hover:underline focus:outline-none focus:underline transition-colors"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold hover:bg-gold/90 text-gray-900 font-semibold py-3 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                      <span>{isLogin ? "Signing In..." : "Creating Account..."}</span>
                    </div>
                  ) : (
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black/40 text-gray-400">OR</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    console.log("[v0] Google OAuth button clicked")
                    signInWithGoogle().catch((err) => {
                      console.error("[v0] Google OAuth button error:", err)
                    })
                  }}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{isLogin ? "Sign in with Google" : "Sign up with Google"}</span>
                </Button>

                <div className="text-center pt-4">
                  <p className="text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-gold hover:underline focus:outline-none focus:underline transition-colors font-medium"
                      disabled={isLoading}
                    >
                      {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
