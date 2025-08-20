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

const menuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    title: "Menu Management",
    url: "/dashboard/menu",
    icon: MenuIcon,
  },
  {
    title: "Reservations",
    url: "/dashboard/reservations",
    icon: Calendar,
  },
  {
    title: "Customers",
    url: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <Sidebar className="dashboard-sidebar">
      <SidebarHeader className="border-b border-gray-600">
        <div className="flex items-center gap-3 px-2 py-4">
          <Image src="/images/logo.png" alt="Sushi Yaki" width={40} height={40} className="h-10 w-auto" />
          <div>
            <h2 className="font-serif text-lg font-bold text-white">Sushi Yaki</h2>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="hover:bg-yellow-500/10 data-[active=true]:bg-yellow-500/20 data-[active=true]:text-yellow-500 text-gray-300 hover:text-white"
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-yellow-500/10 text-gray-300 hover:text-white">
                  <Link href="/">
                    <Home />
                    <span>View Website</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-yellow-500/10 text-gray-300 hover:text-white">
                  <Link href="/dashboard/menu/new">
                    <ChefHat />
                    <span>Add Menu Item</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-600">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Users size={16} className="text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name || "Admin"}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-red-500/10 hover:text-red-400 text-gray-300">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
