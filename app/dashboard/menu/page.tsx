"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { CategoryModal } from "@/components/ui/category-modal"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setMenuItems(data || [])

        const uniqueCategories = [...new Set(data?.map((item) => item.category).filter(Boolean) || [])]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching menu items:", error)
        toast({
          title: "Error",
          description: "Failed to load menu items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

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
          console.log("[v0] Dashboard menu item change detected:", payload)

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as MenuItem
            setMenuItems((prev) => [newItem, ...prev])

            // Update categories if new category is added
            if (newItem.category && !categories.includes(newItem.category)) {
              setCategories((prev) => [...prev, newItem.category])
            }

            toast({
              title: "New Item Added",
              description: `${newItem.name} has been added to the menu`,
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as MenuItem
            setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))

            toast({
              title: "Item Updated",
              description: `${updatedItem.name} has been updated`,
            })
          } else if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as MenuItem
            setMenuItems((prev) => prev.filter((item) => item.id !== deletedItem.id))

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
  }, [categories])

  const handleCategoryCreated = (newCategory: string) => {
    if (!categories.includes(newCategory)) {
      setCategories((prev) => [...prev, newCategory])
    }
  }

  const deleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id)

      if (error) throw error

      setMenuItems(menuItems.filter((item) => item.id !== id))
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      })
    }
  }

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, is_available: !currentStatus } : item)))

      const { error } = await supabase.from("menu_items").update({ is_available: !currentStatus }).eq("id", id)

      if (error) {
        // Revert optimistic update on error
        setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, is_available: currentStatus } : item)))
        throw error
      }

      toast({
        title: "Success",
        description: `Menu item ${!currentStatus ? "enabled" : "disabled"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "sushi":
        return "bg-purple-900/50 text-purple-300"
      case "main course":
        return "bg-blue-900/50 text-blue-300"
      case "noodles":
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

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && item.is_available) ||
      (statusFilter === "unavailable" && !item.is_available)

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Menu Management</h1>
          <p className="text-gray-400 mt-1">Manage your restaurant's menu items and categories</p>
        </div>
        <div className="flex items-center gap-3">
          <CategoryModal onCategoryCreated={handleCategoryCreated} />
          <Link href="/dashboard/menu/new">
            <Button className="bg-gold text-black hover:bg-gold/80">
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
          <Card key={item.id} className="bg-black/30 border-gray-800 overflow-hidden">
            <div className="relative h-48">
              <Image
                src={item.image_url || "/placeholder.svg?height=200&width=300&query=food"}
                alt={item.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`${getStatusColor(item.is_available)} border-none text-xs px-2 py-1 h-auto`}
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                >
                  {item.is_available ? "Available" : "Unavailable"}
                </Button>
                <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-semibold text-white">{item.name}</h3>
                <span className="text-gold font-bold">৳{item.price}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/menu/${item.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                </Link>
                <Link href={`/dashboard/menu/${item.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 hover:text-red-300 bg-transparent"
                  onClick={() => deleteMenuItem(item.id)}
                >
                  <Trash2 size={14} />
                </Button>
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
