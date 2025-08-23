"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    console.log(
      "[v0] Dashboard layout - isLoading:",
      isLoading,
      "user:",
      user,
      "role:",
      user?.role,
      "authChecked:",
      authChecked,
    )
  }, [user, isLoading, authChecked])

  useEffect(() => {
    if (!isLoading) {
      // Give a moment for user state to settle after auth completes
      const timer = setTimeout(() => {
        setAuthChecked(true)

        if (!user || (user.role !== "admin" && user.role !== "manager")) {
          console.log("[v0] Dashboard access denied - user:", user, "role:", user?.role)
          router.push("/signin?redirect=/dashboard")
        } else {
          console.log("[v0] Dashboard access granted for:", user.role)
        }
      }, 200) // Small delay to ensure auth state is settled

      return () => clearTimeout(timer)
    }
  }, [user, isLoading, router])

  if (isLoading || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkBg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-darkBg overflow-hidden">
        <DashboardSidebar userRole={user.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
