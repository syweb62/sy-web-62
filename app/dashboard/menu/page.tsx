"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"

// Mock menu items data
const mockMenuItems = [
  {
    id: "item-1",
    name: "Sushi Platter",
    description: "Assortment of fresh nigiri and maki rolls with wasabi, ginger, and soy sauce.",
    price: 24.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop",
    status: "available",
    ingredients: ["Fresh Fish", "Rice", "Nori", "Wasabi"],
    allergens: ["Fish"],
    calories: 450,
  },
  {
    id: "item-2",
    name: "Teriyaki Salmon",
    description: "Grilled salmon glazed with our signature teriyaki sauce, served with steamed rice.",
    price: 22.99,
    category: "main",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop",
    status: "available",
    ingredients: ["Salmon", "Teriyaki Sauce", "Rice", "Vegetables"],
    allergens: ["Fish", "Soy"],
    calories: 520,
  },
  {
    id: "item-3",
    name: "Ramen Bowl",
    description: "Rich broth with ramen noodles, soft-boiled egg, chashu pork, and fresh vegetables.",
    price: 18.99,
    category: "noodles",
    image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop",
    status: "available",
    ingredients: ["Ramen Noodles", "Pork", "Egg", "Vegetables", "Broth"],
    allergens: ["Gluten", "Egg"],
    calories: 680,
  },
  {
    id: "item-4",
    name: "Miso Soup",
    description: "Traditional Japanese soup with miso paste, tofu, and seaweed.",
    price: 4.99,
    category: "appetizer",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=600&h=400&auto=format&fit=crop",
    status: "unavailable",
    ingredients: ["Miso Paste", "Tofu", "Seaweed", "Green Onions"],
    allergens: ["Soy"],
    calories: 120,
  },
]

export default function MenuManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-900/50 text-green-300"
      case "unavailable":
        return "bg-red-900/50 text-red-300"
      case "limited":
        return "bg-yellow-900/50 text-yellow-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sushi":
        return "bg-purple-900/50 text-purple-300"
      case "main":
        return "bg-blue-900/50 text-blue-300"
      case "noodles":
        return "bg-orange-900/50 text-orange-300"
      case "appetizer":
        return "bg-green-900/50 text-green-300"
      case "dessert":
        return "bg-pink-900/50 text-pink-300"
      case "beverage":
        return "bg-cyan-900/50 text-cyan-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  const filteredItems = mockMenuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Menu Management</h1>
          <p className="text-gray-400 mt-1">Manage your restaurant's menu items and categories</p>
        </div>
        <Button className="bg-gold text-black hover:bg-gold/80">
          <Plus size={16} className="mr-2" />
          Add Menu Item
        </Button>
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
                <SelectItem value="sushi">Sushi</SelectItem>
                <SelectItem value="main">Main Dishes</SelectItem>
                <SelectItem value="noodles">Noodles</SelectItem>
                <SelectItem value="appetizer">Appetizers</SelectItem>
                <SelectItem value="dessert">Desserts</SelectItem>
                <SelectItem value="beverage">Beverages</SelectItem>
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
                <SelectItem value="limited">Limited</SelectItem>
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
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-semibold text-white">{item.name}</h3>
                <span className="text-gold font-bold">${item.price}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Calories:</span>
                  <span className="text-gray-300">{item.calories}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Allergens:</span>
                  <span className="text-gray-300">{item.allergens.join(", ")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye size={14} className="mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
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
            <Button className="bg-gold text-black hover:bg-gold/80">
              <Plus size={16} className="mr-2" />
              Add Menu Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
