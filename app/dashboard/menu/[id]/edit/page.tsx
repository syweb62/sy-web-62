"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import Image from "next/image"

interface MenuItem {
  menu_id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  available: boolean
}

export default function EditMenuItemPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [supabase] = useState(() => createClient())
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    available: true,
  })

  useEffect(() => {
    if (params.id) {
      fetchMenuItem(params.id as string)
      fetchCategories()
    }
  }, [params.id])

  useEffect(() => {
    if (formData.image_url) {
      setImagePreview(formData.image_url)
    }
  }, [formData.image_url])

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

  const fetchMenuItem = async (id: string) => {
    try {
      console.log("[v0] Fetching menu item with ID:", id)
      const { data, error } = await supabase.from("menu_items").select("*").eq("menu_id", id).single()

      if (error) throw error

      console.log("[v0] Fetched menu item:", data)
      setMenuItem(data)
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        image_url: data.image_url || "",
        available: data.available,
      })
    } catch (error) {
      console.error("[v0] Error fetching menu item:", error)
      toast({
        title: "Error",
        description: "Failed to load menu item",
        variant: "destructive",
      })
      router.push("/dashboard/menu")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please select a valid image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      console.log("[v0] Ensuring storage bucket exists...")
      const bucketResponse = await fetch("/api/storage/create-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!bucketResponse.ok) {
        const bucketError = await bucketResponse.json()
        throw new Error(bucketError.error || "Failed to create storage bucket")
      }

      console.log("[v0] Storage bucket ready")

      const fileExt = file.name.split(".").pop()
      const fileName = `menu-items/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      console.log("[v0] Uploading image via server API:", fileName)

      // Create FormData for server upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileName", fileName)

      // Upload via server API
      const uploadResponse = await fetch("/api/storage/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json()
        throw new Error(uploadError.error || "Failed to upload image")
      }

      const uploadResult = await uploadResponse.json()
      console.log("[v0] Upload successful:", uploadResult.url)

      // Update form data with new image URL
      handleInputChange("image_url", uploadResult.url)
      setImagePreview(uploadResult.url)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    handleInputChange("image_url", "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      console.log("[v0] Updating menu item with data:", formData)

      const { error } = await supabase
        .from("menu_items")
        .update({
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          category: formData.category,
          image_url: formData.image_url,
          available: formData.available,
        })
        .eq("menu_id", params.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      })
      router.push("/dashboard/menu")
    } catch (error: any) {
      console.error("[v0] Error updating menu item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Menu item not found</p>
        <Link href="/dashboard/menu">
          <Button className="mt-4">Back to Menu</Button>
        </Link>
      </div>
    )
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
          <h1 className="text-3xl font-serif font-bold text-white">Edit Menu Item</h1>
          <p className="text-gray-400 mt-1">Update details for {menuItem.name}</p>
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
                  Price (Tk) *
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Menu Item Image</Label>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-32 bg-gray-800/50 border border-gray-700 rounded-md overflow-hidden">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Menu item preview"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("[v0] Image load error:", e)
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=128&width=200&query=${encodeURIComponent(formData.name || "menu item")}`
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        {imagePreview ? "Change Image" : "Upload Image"}
                      </>
                    )}
                  </Button>

                  {/* URL Input as fallback */}
                  <Input
                    placeholder="Or paste image URL"
                    value={formData.image_url}
                    onChange={(e) => {
                      handleInputChange("image_url", e.target.value)
                      setImagePreview(e.target.value)
                    }}
                    className="bg-gray-800/50 border-gray-700 flex-1 text-white"
                  />
                </div>

                {/* Hidden file input */}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <p className="text-xs text-gray-400">
                  Upload an image or paste a URL. Max size: 5MB (JPEG/PNG/WebP/GIF)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleInputChange("available", checked)}
              />
              <Label htmlFor="available" className="text-white">
                Available for ordering
              </Label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving} className="bg-gold text-black hover:bg-gold/80">
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Update Menu Item
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
