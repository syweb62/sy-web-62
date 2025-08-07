"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Share2, Eye, Star } from "lucide-react"
import { ImageOverlayButton } from "@/components/ui/image-overlay-button"
import { CartButton } from "@/components/ui/cart-button"
import { QuantityControls } from "@/components/ui/quantity-controls"
import { ResponsiveButtonContainer } from "@/components/ui/responsive-button-container"
import { Button } from "@/components/ui/button"

export default function TestOverlayButtons() {
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({
    item1: 1,
    item2: 1,
    item3: 1,
  })

  const handleAddToCart = (itemId: string) => {
    setAddedItems((prev) => ({ ...prev, [itemId]: true }))
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [itemId]: false }))
    }, 2000)
  }

  const testImages = [
    {
      id: "item1",
      src: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Sushi Platter",
      price: 24.99,
    },
    {
      id: "item2",
      src: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Ramen Bowl",
      price: 18.99,
    },
    {
      id: "item3",
      src: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Teriyaki Salmon",
      price: 22.99,
    },
  ]

  return (
    <div className="min-h-screen bg-darkBg py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4 text-white">Button Overlay Testing</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Testing button visibility and accessibility over images across different screen sizes and devices.
          </p>
        </div>

        {/* Test Section 1: Image Overlay Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif mb-8 text-white">Image Overlay Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testImages.map((image) => (
              <div key={image.id} className="group relative">
                <div className="h-64 relative overflow-hidden rounded-lg">
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Multiple overlay buttons in different positions */}
                  <ImageOverlayButton position="top-right" overlay="light" size="icon" showOnHover={true}>
                    <Heart className="h-4 w-4" />
                  </ImageOverlayButton>

                  <ImageOverlayButton position="top-left" overlay="dark" size="icon" showOnHover={true}>
                    <Share2 className="h-4 w-4" />
                  </ImageOverlayButton>

                  <ImageOverlayButton
                    position="center"
                    overlay="blur"
                    showOnHover={true}
                    alwaysVisible={false}
                    onClick={() => handleAddToCart(image.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Quick View
                  </ImageOverlayButton>

                  <ImageOverlayButton position="bottom-right" overlay="gradient" size="sm" alwaysVisible={true}>
                    <Star className="h-3 w-3 mr-1" />
                    4.8
                  </ImageOverlayButton>
                </div>

                <div className="mt-4 p-4 bg-black/30 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-2">{image.title}</h3>
                  <p className="text-gold font-medium mb-4">${image.price}</p>

                  <ResponsiveButtonContainer spacing="normal" alignment="stretch">
                    <CartButton
                      isAdded={addedItems[image.id]}
                      onAddToCart={() => handleAddToCart(image.id)}
                      fullWidth
                    />
                  </ResponsiveButtonContainer>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Test Section 2: Quantity Controls */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif mb-8 text-white">Quantity Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["Small", "Default", "Large"].map((size, index) => (
              <div key={size} className="bg-black/30 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-4">{size} Size</h3>
                <QuantityControls
                  quantity={quantities[`item${index + 1}`]}
                  onQuantityChange={(qty) => setQuantities((prev) => ({ ...prev, [`item${index + 1}`]: qty }))}
                  size={size.toLowerCase() as "sm" | "default" | "lg"}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Test Section 3: Button Variants Over Different Backgrounds */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif mb-8 text-white">Button Variants Over Backgrounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dark Background */}
            <div className="relative h-64 bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-black/50" />
              <h3 className="absolute top-4 left-4 text-white font-medium">Dark Background</h3>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <Button variant="overlay-primary" fullWidth>
                  Primary Overlay
                </Button>
                <Button variant="overlay" fullWidth>
                  Dark Overlay
                </Button>
              </div>
            </div>

            {/* Light Background */}
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-white rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-white/50" />
              <h3 className="absolute top-4 left-4 text-black font-medium">Light Background</h3>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <Button variant="primary" fullWidth>
                  Primary Button
                </Button>
                <Button variant="outline" fullWidth>
                  Outline Button
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Test Section 4: Responsive Button Layouts */}
        <section>
          <h2 className="text-2xl font-serif mb-8 text-white">Responsive Button Layouts</h2>
          <div className="space-y-8">
            <div className="bg-black/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-4">Horizontal Layout (Desktop) / Vertical (Mobile)</h3>
              <ResponsiveButtonContainer orientation="responsive" spacing="normal">
                <Button variant="primary">Add to Cart</Button>
                <Button variant="outline">Add to Wishlist</Button>
                <Button variant="ghost">Share</Button>
              </ResponsiveButtonContainer>
            </div>

            <div className="bg-black/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-4">Always Vertical</h3>
              <ResponsiveButtonContainer orientation="vertical" spacing="normal" alignment="stretch">
                <Button variant="primary" fullWidth>
                  Primary Action
                </Button>
                <Button variant="secondary" fullWidth>
                  Secondary Action
                </Button>
                <Button variant="outline" fullWidth>
                  Tertiary Action
                </Button>
              </ResponsiveButtonContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
