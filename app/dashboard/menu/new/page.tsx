"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NewMenuItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_available: true,
  })

  useEffect(() => {
    fetchCategories()

    const handleFocus = () => {
      fetchCategories()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        fetchCategories()
      }
    })

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("category").not("category", "is", null)

      if (error) throw error

      const uniqueCategories = [...new Set(data?.map((item) => item.category).filter(Boolean) || [])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("menu_items").insert([
        {
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          category: formData.category,
          image_url: formData.image_url,
          is_available: formData.is_available,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Menu item created successfully",
      })
      router.push("/dashboard/menu")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create menu item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Menu
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Add New Menu Item</h1>
          <p className="text-gray-400 mt-1">Create a new item for your restaurant menu</p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Menu Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Item Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white">
                  Price (৳) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="bg-gray-800/50 border-gray-700 min-h-24"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="__refresh__"
                      className="text-blue-400 italic"
                      onSelect={(e) => {
                        e.preventDefault()
                        fetchCategories()
                      }}
                    >
                      🔄 Refresh Categories
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url" className="text-white">
                  Image URL
                </Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange("image_url", e.target.value)}
                  className="bg-gray-800/50 border-gray-700"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => handleInputChange("is_available", checked)}
              />
              <Label htmlFor="is_available" className="text-white">
                Available for ordering
              </Label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={loading} className="bg-gold text-black hover:bg-gold/80">
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Create Menu Item
                  </>
                )}
              </Button>
              <Link href="/dashboard/menu">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
