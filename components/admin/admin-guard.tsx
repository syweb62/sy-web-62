"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin"))) {
      router.push("/signin?redirect=/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-darkBg">
          <LoadingSpinner />
        </div>
      )
    )
  }

  if (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin")) {
    return null
  }

  return <>{children}</>
}
