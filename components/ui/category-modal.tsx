"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CategoryModalProps {
  onCategoryCreated: (category: string) => void
}

export function CategoryModal({ onCategoryCreated }: CategoryModalProps) {
  const [open, setOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    setLoading(true)
    try {
      // Since we don't have a categories table, we'll just validate the name and pass it back
      const formattedCategory = categoryName.trim()
      onCategoryCreated(formattedCategory)

      toast({
        title: "Success",
        description: `Category "${formattedCategory}" created successfully`,
      })

      setCategoryName("")
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-gold text-gold hover:bg-gold hover:text-black"
        >
          <Plus size={16} className="mr-2" />
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/95 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-white">
              Category Name *
            </Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
              placeholder="e.g., Seafood, Vegetarian, etc."
              required
            />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading} className="bg-gold text-black hover:bg-gold/80">
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Create Category
                </>
              )}
            </Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
