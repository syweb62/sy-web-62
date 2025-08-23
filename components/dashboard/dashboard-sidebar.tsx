"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ShoppingBag, MenuIcon, Calendar, Users, Settings, Home, LogOut, ChefHat } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { useState } from "react"

const menuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "manager"], // Added roles array to control access
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingBag,
    roles: ["admin", "manager"], // Manager can access orders
  },
  {
    title: "Menu Management",
    url: "/dashboard/menu",
    icon: MenuIcon,
    roles: ["admin"], // Only admin can access menu management
  },
  {
    title: "Reservations",
    url: "/dashboard/reservations",
    icon: Calendar,
    roles: ["admin", "manager"], // Manager can access reservations
  },
  {
    title: "Customers",
    url: "/dashboard/customers",
    icon: Users,
    roles: ["admin"], // Only admin can access customers
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["admin"], // Only admin can access analytics
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"], // Only admin can access settings
  },
]

interface DashboardSidebarProps {
  userRole?: string
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const filteredMenuItems = menuItems.filter((item) => {
    const currentUserRole = userRole || user?.role || "user"
    return item.roles.includes(currentUserRole)
  })

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent multiple clicks

    try {
      setIsSigningOut(true)
      console.log("[v0] Signout button clicked")
      await signOut()
      console.log("[v0] Signout completed successfully")
      // Redirect to home page after successful signout
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Signout failed:", error)
      // Show user-friendly error message
      alert("Sign out failed. Please try again.")
    } finally {
      setIsSigningOut(false)
    }
  }

  const getRoleDisplayText = () => {
    const currentUserRole = userRole || user?.role || "user"
    return currentUserRole === "manager" ? "Manager" : "Administrator"
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-800">
        <div className="flex items-center gap-3 px-2 py-4">
          <Image src="/images/logo.png" alt="Sushi Yaki" width={40} height={40} className="h-10 w-auto" />
          <div>
            <h2 className="font-serif text-lg font-bold text-gold">Sushi Yaki</h2>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(userRole === "admin" || user?.role === "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Home />
                      <span>View Website</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/menu/new">
                      <ChefHat />
                      <span>Add Menu Item</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Users size={16} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">{getRoleDisplayText()}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
