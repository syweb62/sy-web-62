"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is admin (in a real app, this would be a proper role check)
    if (!user || user.email !== "admin@sushiyaki.com") {
      router.push("/signin")
    }
  }, [user, router])

  if (!user || user.email !== "admin@sushiyaki.com") {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-darkBg">
        <DashboardSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}
