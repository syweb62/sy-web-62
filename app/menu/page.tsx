"use client"

import { useEffect, useState } from "react"
import { MenuClient } from "@/components/menu/menu-client"
import { supabase } from "@/lib/supabase"

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
  image?: string
  is_available: boolean
  created_at?: string
  updated_at?: string
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("menu_items")
          .select("*")
          .order("category", { ascending: true })
          .order("name", { ascending: true })

        if (fetchError) {
          console.error("Error fetching menu items:", fetchError)
          // Fall back to mock data if database fails
          setItems(getMockMenuItems())
          setError("Using demo data - database connection failed")
        } else {
          // Transform Supabase data to match expected format
          const transformedItems = (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image_url: item.image_url,
            image: item.image_url, // Alias for compatibility
            is_available: item.is_available !== false,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }))
          setItems(transformedItems)
        }
      } catch (err) {
        console.error("Error in fetchMenuItems:", err)
        setItems(getMockMenuItems())
        setError("Using demo data - please check your database connection")
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [])

  if (loading) {
    return (
      <>
        <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
          <div className="container mx-auto px-4 text-center z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Menu</h1>
            <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">Loading our delicious menu items...</p>
          </div>
        </section>
        <section className="py-20 bg-darkBg">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading menu...</p>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Menu</h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            Explore our diverse selection of authentic Japanese dishes prepared with the finest ingredients.
          </p>
          {error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-yellow-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </section>

      <MenuClient items={items} />
    </>
  )
}

// Mock data fallback
function getMockMenuItems(): MenuItem[] {
  return [
    {
      id: "mock-1",
      name: "Sushi Platter",
      category: "sushi",
      price: 24.99,
      description: "Assortment of fresh nigiri and maki rolls with wasabi, ginger, and soy sauce.",
      image_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: true,
    },
    {
      id: "mock-2",
      name: "Teriyaki Salmon",
      category: "bento",
      price: 22.99,
      description: "Grilled salmon glazed with our signature teriyaki sauce, served with steamed rice.",
      image_url: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: false,
    },
    {
      id: "mock-3",
      name: "Tonkotsu Ramen",
      category: "ramen",
      price: 18.99,
      description: "Rich pork broth with ramen noodles, soft-boiled egg, chashu pork, and fresh vegetables.",
      image_url: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: true,
    },
    {
      id: "mock-4",
      name: "Gyoza",
      category: "appetizers",
      price: 8.99,
      description: "Pan-fried dumplings filled with seasoned ground pork and vegetables.",
      image_url: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: true,
    },
    {
      id: "mock-5",
      name: "Dragon Roll",
      category: "sushi",
      price: 16.99,
      description: "Eel and cucumber inside, avocado and tobiko on top, drizzled with eel sauce.",
      image_url: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: false,
    },
    {
      id: "mock-6",
      name: "Miso Soup",
      category: "appetizers",
      price: 4.99,
      description: "Traditional Japanese soup with tofu, seaweed, and green onions.",
      image_url: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: true,
    },
    {
      id: "mock-7",
      name: "Chicken Katsu Bento",
      category: "bento",
      price: 19.99,
      description: "Crispy breaded chicken cutlet served with rice, salad, and miso soup.",
      image_url: "https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: true,
    },
    {
      id: "mock-8",
      name: "Matcha Green Tea Ice Cream",
      category: "desserts",
      price: 6.99,
      description: "Creamy ice cream infused with premium matcha green tea.",
      image_url: "https://images.unsplash.com/photo-1561845730-208ad5910553?q=80&w=600&h=400&auto=format&fit=crop",
      image: "https://images.unsplash.com/photo-1561845730-208ad5910553?q=80&w=600&h=400&auto=format&fit=crop",
      is_available: false,
    },
  ]
}
