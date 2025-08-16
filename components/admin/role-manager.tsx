"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface RoleManagerProps {
  users: User[]
  onUserUpdate: () => void
}

export function RoleManager({ users, onUserUpdate }: RoleManagerProps) {
  const [loading, setLoading] = useState(false)

  const updateUserRole = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "User role updated successfully",
      })
      onUserUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>Manage user roles and permissions for the admin dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{user.full_name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || "user"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={user.role || "user"}
                  onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
