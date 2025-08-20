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
    })

    if (!loading && (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin"))) {
      console.log("[v0] Redirecting to signin - not admin user")
      router.push("/signin?redirect=/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    console.log("[v0] Dashboard loading...")
    return (
      <div className="flex min-h-screen items-center justify-center dashboard-layout">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin")) {
    console.log("[v0] Dashboard access denied - redirecting to signin")
    return null
  }

  console.log("[v0] Dashboard access granted for admin user")
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
