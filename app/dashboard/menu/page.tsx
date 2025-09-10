"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"

interface MenuItem {
  menu_id: string // Changed from id to menu_id to match database schema
  name: string
  description: string
  price: number
  category: string
  available: boolean
  image_url?: string
  created_at: string
  updated_at?: string
}

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname.includes("supabase.co") &&
      urlObj.pathname.includes("/storage/v1/object/public/") &&
      !url.includes(".lic") && // Enhanced exclusion of malformed domains
      !url.includes("undefined") &&
      !url.includes("null") &&
      url.length > 50 &&
      urlObj.protocol === "https:"
    )
  } catch {
    return false
  }
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [supabase] = useState(() => createClient())

  const fetchMenuItems = useCallback(async () => {
    try {
      console.log("[v0] Fetching menu items...")

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      console.log("[v0] Current user:", user?.id, "Auth error:", authError)

      const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

      console.log("[v0] Menu items fetch result - data count:", data?.length, "error:", error)

      if (error) throw error

      setMenuItems(data || [])
      const uniqueCategories = [...new Set(data?.map((item) => item.category).filter(Boolean) || [])]
      setCategories(uniqueCategories)
      console.log("[v0] Menu items loaded successfully:", data?.length, "categories:", uniqueCategories.length)
    } catch (error) {
      console.error("[v0] Error fetching menu items:", error)
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMenuItems()

    const channel = supabase
      .channel("dashboard_menu_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as MenuItem
            setMenuItems((prev) => [newItem, ...prev])

            if (newItem.category) {
              setCategories((prev) => {
                if (!prev.includes(newItem.category)) {
                  return [...prev, newItem.category]
                }
                return prev
              })
            }

            toast({
              title: "New Item Added",
              description: `${newItem.name} has been added to the menu`,
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as MenuItem
            setMenuItems((prev) => prev.map((item) => (item.menu_id === updatedItem.menu_id ? updatedItem : item)))

            toast({
              title: "Item Updated",
              description: `${updatedItem.name} has been updated`,
            })
          } else if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as MenuItem
            setMenuItems((prev) => prev.filter((item) => item.menu_id !== deletedItem.menu_id))

            toast({
              title: "Item Deleted",
              description: `${deletedItem.name} has been removed from the menu`,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMenuItems, supabase])

  const deleteMenuItem = useCallback(
    async (menu_id: string, itemName: string) => {
      const confirmed = confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)

      if (!confirmed) return

      try {
        console.log("[v0] Deleting menu item:", itemName, "ID:", menu_id)

        const { error } = await supabase.from("menu_items").delete().eq("menu_id", menu_id)

        if (error) throw error

        setMenuItems((prev) => prev.filter((item) => item.menu_id !== menu_id))

        toast({
          title: "Success",
          description: `${itemName} deleted successfully`,
        })
      } catch (error: any) {
        console.error("[v0] Error deleting menu item:", error)
        toast({
          title: "Error",
          description: `Failed to delete ${itemName}: ${error.message}`,
          variant: "destructive",
        })
      }
    },
    [supabase],
  )

  const toggleAvailability = useCallback(
    async (menu_id: string, currentStatus: boolean, itemName: string) => {
      try {
        console.log("[v0] Toggling availability for:", itemName)

        const { error } = await supabase.from("menu_items").update({ available: !currentStatus }).eq("menu_id", menu_id)

        if (error) throw error

        setMenuItems((prev) =>
          prev.map((item) => (item.menu_id === menu_id ? { ...item, available: !currentStatus } : item)),
        )

        toast({
          title: "Success",
          description: `${itemName} ${!currentStatus ? "enabled" : "disabled"} successfully`,
        })
      } catch (error: any) {
        console.error("[v0] Error updating availability:", error)
        toast({
          title: "Error",
          description: `Failed to update menu item: ${error.message}`,
          variant: "destructive",
        })
      }
    },
    [supabase],
  )

  const getStatusColor = useMemo(() => {
    return (isAvailable: boolean) => {
      return isAvailable ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"
    }
  }, [])

  const getCategoryColor = useMemo(() => {
    return (category: string) => {
      switch (category.toLowerCase()) {
        case "sushi":
        case "sushi rolls":
          return "bg-purple-900/50 text-purple-300"
        case "main course":
          return "bg-blue-900/50 text-blue-300"
        case "sashimi":
          return "bg-orange-900/50 text-orange-300"
        case "appetizer":
          return "bg-green-900/50 text-green-300"
        case "desserts":
          return "bg-pink-900/50 text-pink-300"
        case "beverages":
          return "bg-cyan-900/50 text-cyan-300"
        default:
          return "bg-gray-900/50 text-gray-300"
      }
    }
  }, [])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase()
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && item.available) ||
        (statusFilter === "unavailable" && !item.available)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [menuItems, searchTerm, categoryFilter, statusFilter])

  const ToggleSwitch = ({
    isOn,
    onToggle,
    disabled = false,
  }: { isOn: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        isOn ? "bg-green-600" : "bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading menu items..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Menu Management</h1>
          <p className="text-gray-400 mt-1">
            Manage your restaurant's menu items and categories • {menuItems.length} items • Real-time updates enabled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchMenuItems}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/menu/new">
            <Button className="bg-yellow-600 text-black hover:bg-yellow-700">
              <Plus size={16} className="mr-2" />
              Add New Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-black/30 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.menu_id} className="bg-black/30 border-gray-800 overflow-hidden">
            <div className="relative h-48">
              <Image
                src={
                  isValidImageUrl(item.image_url)
                    ? item.image_url!
                    : `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(item.name + " " + item.category)}`
                }
                alt={item.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  const fallbackUrl = `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(item.name + " " + item.category)}`
                  if (target.src !== fallbackUrl && !target.src.includes("placeholder.svg")) {
                    console.log("[v0] Image load failed for:", item.name, "URL:", target.src)
                    target.src = fallbackUrl
                  }
                }}
                unoptimized={!isValidImageUrl(item.image_url)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={`${getStatusColor(item.available)} border-none text-xs px-2 py-1`}>
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
                <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-semibold text-white">{item.name}</h3>
                <span className="text-yellow-500 font-bold">Tk{item.price}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{item.available ? "Available" : "Unavailable"}</span>
                  <ToggleSwitch
                    isOn={item.available}
                    onToggle={() => toggleAvailability(item.menu_id, item.available, item.name)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/menu/${item.menu_id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-900/30 text-blue-400 border-blue-600 hover:bg-blue-900/50"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 bg-red-900/20 border-red-600"
                    onClick={() => deleteMenuItem(item.menu_id, item.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No menu items found</h3>
              <p>Try adjusting your search criteria or add a new menu item.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
