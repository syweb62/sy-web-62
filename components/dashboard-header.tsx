"use client"

import { Bell, Settings, User, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/context/notification-context"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"

interface DashboardHeaderProps {
  connectionStatus?: "connected" | "connecting" | "disconnected"
}

export function DashboardHeader({ connectionStatus = "connected" }: DashboardHeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { user } = useAuth()

  const recentNotifications = notifications.slice(0, 5)

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi size={16} className="text-green-400" />
      case "connecting":
        return <Wifi size={16} className="text-yellow-400 animate-pulse" />
      case "disconnected":
        return <WifiOff size={16} className="text-red-400" />
      default:
        return <Wifi size={16} className="text-gray-400" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "disconnected":
        return "Connection Lost"
      default:
        return "Unknown"
    }
  }

  return (
    <header className="flex items-center justify-between p-4 bg-black/30 border-b border-gray-800">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700">
          {getConnectionStatusIcon()}
          <span
            className={`text-xs font-medium ${
              connectionStatus === "connected"
                ? "text-green-400"
                : connectionStatus === "connecting"
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            {getConnectionStatusText()}
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-2 h-2 rounded-full ${notification.read ? "bg-gray-400" : "bg-gold"}`} />
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-4">{notification.message}</p>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                <span className="text-gray-400">No notifications</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User size={20} />
              <span className="hidden md:inline">{user?.name || "Admin"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
