"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Save, Plus, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

export default function NewMenuItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [supabase] = useState(() => createClient())

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  })

  useEffect(() => {
    fetchCategories()
    initializeStorageBucket()
  }, [])

  const initializeStorageBucket = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((bucket) => bucket.name === "menu-images")

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket("menu-images", {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          fileSizeLimit: 5242880, // 5MB
        })

        if (error && !error.message.includes("already exists")) {
          console.error("Error creating storage bucket:", error)
        }
      }
    } catch (error) {
      console.error("Error initializing storage bucket:", error)
    }
  }

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      })
      return
    }

    if (categories.includes(newCategoryName.trim())) {
      toast({
        title: "Error",
        description: "Category already exists",
        variant: "destructive",
      })
      return
    }

    setCategories((prev) => [...prev, newCategoryName.trim()])
    setFormData((prev) => ({ ...prev, category: newCategoryName.trim() }))
    setNewCategoryName("")
    setShowNewCategoryDialog(false)

    toast({
      title: "Success",
      description: `Category "${newCategoryName.trim()}" created successfully`,
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setImageUploading(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `menu-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from("menu-images").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("menu-images").getPublicUrl(filePath)

      setUploadedImageUrl(publicUrl)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = async () => {
    if (uploadedImageUrl) {
      try {
        const fileName = uploadedImageUrl.split("/").pop()
        if (fileName) {
          await supabase.storage.from("menu-images").remove([`menu-images/${fileName}`])
        }
      } catch (error) {
        console.error("Error removing image from storage:", error)
      }
    }
    setUploadedImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name.trim() || !formData.description.trim() || !formData.category || !formData.price) {
        throw new Error("Please fill in all required fields")
      }

      const price = Number.parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error("Please enter a valid price")
      }

      const { error } = await supabase.from("menu_items").insert([
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          category: formData.category,
          available: formData.available,
          image_url: uploadedImageUrl || null,
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Menu item created successfully",
      })

      router.push("/dashboard/menu")
    } catch (error: any) {
      console.error("Error creating menu item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
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
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
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
                  className="bg-gray-800/50 border-gray-700 text-white"
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
                  className="bg-gray-800/50 border-gray-700 text-white"
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
                className="bg-gray-800/50 border-gray-700 min-h-24 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Category *
                </Label>
                <div className="flex gap-2">
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
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
                  <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                      >
                        <Plus size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newCategory" className="text-white">
                            Category Name
                          </Label>
                          <Input
                            id="newCategory"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Enter category name"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateCategory}
                            className="bg-yellow-600 text-black hover:bg-yellow-700"
                          >
                            Create Category
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Menu Item Image</Label>
                {uploadedImageUrl ? (
                  <div className="relative">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-700">
                      <Image
                        src={uploadedImageUrl || "/placeholder.svg"}
                        alt="Menu item preview"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `/placeholder.svg?height=128&width=200&query=${encodeURIComponent(formData.name || "menu item")}`
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-600"
                      onClick={removeImage}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="bg-gray-800/50 border-gray-700 text-white file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                        disabled={imageUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={imageUploading}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                        onClick={() => document.querySelector('input[type="file"]')?.click()}
                      >
                        {imageUploading ? (
                          <>Uploading...</>
                        ) : (
                          <>
                            <Upload size={16} className="mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Upload an image for your menu item (max 5MB, JPG/PNG/WebP/GIF)
                    </p>
                  </div>
                )}
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
              <Button type="submit" disabled={loading} className="bg-yellow-600 text-black hover:bg-yellow-700">
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
                <Button
                  variant="outline"
                  type="button"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
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
