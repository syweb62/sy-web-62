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
    if (!loading && (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin"))) {
      router.push("/signin?redirect=/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkBg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || (user.email !== "admin@sushiyaki.com" && user.role !== "admin")) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-darkBg">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
