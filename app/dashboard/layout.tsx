"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect } from "react"
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
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Dashboard auth check:", {
      user: user ? { email: user.email, role: user.role } : null,
      loading,
      isAdmin: user && (user.email === "admin@sushiyaki.com" || user.role === "admin"),
      isManager: user && (user.email === "manager@sushiyaki.com" || user.role === "manager"),
    })

    if (
      !loading &&
      (!user ||
        (user.email !== "admin@sushiyaki.com" &&
          user.email !== "manager@sushiyaki.com" &&
          user.role !== "admin" &&
          user.role !== "manager"))
    ) {
      console.log("[v0] Redirecting to signin - not admin or manager user")
      router.push("/signin?redirect=/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    console.log("[v0] Dashboard loading...")
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkBg">
        <LoadingSpinner />
      </div>
    )
  }

  if (
    !user ||
    (user.email !== "admin@sushiyaki.com" &&
      user.email !== "manager@sushiyaki.com" &&
      user.role !== "admin" &&
      user.role !== "manager")
  ) {
    console.log("[v0] Dashboard access denied - redirecting to signin")
    return null
  }

  console.log("[v0] Dashboard access granted for admin/manager user")
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
