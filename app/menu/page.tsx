"use client"

import { useMemo, useState, useEffect } from "react"
import { Search, ShoppingBag } from "lucide-react"
import ImageWithFallback from "@/components/image-fallback"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { OrderButton } from "@/components/ui/order-button"
import { createClient } from "@/lib/supabase"

interface MenuItem {
  menu_id: string // Changed from id to menu_id to match database schema
  name: string
  category: string
  price: number
  description: string | null
  image_url: string | null
  available: boolean // Changed from is_available to available to match database schema
  created_at: string
  updated_at: string
}

function normalizeCategory(value?: string | null) {
  return (value ?? "").toString().trim().toLowerCase().replace(/\s+/g, "-")
}

function toTitle(label: string) {
  return label
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [hideUnavailable, setHideUnavailable] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addItem, totalItems } = useCart()
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching menu items:", error)
        setError("Failed to load menu items")
        return
      }

      setMenuItems(data || [])
    } catch (err) {
      console.error("Error:", err)
      setError("Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuItems()

    // Set up real-time subscription for menu items
    const supabase = createClient()
    const channel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          console.log("[v0] Menu item change detected:", payload)
          // Refresh menu items when changes occur
          fetchMenuItems()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const derivedCategories = useMemo(() => {
    const map = new Map<string, string>() // id -> label
    for (const it of menuItems) {
      const id = normalizeCategory(it.category)
      if (id) map.set(id, it.category)
    }
    return [{ id: "all", name: "All" }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))] as {
      id: string
      name: string
    }[]
  }, [menuItems])

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || normalizeCategory(item.category) === activeCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAvailability = hideUnavailable ? item.available : true

    return matchesCategory && matchesSearch && matchesAvailability
  })

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.menu_id, // Changed from item.id to item.menu_id
      name: item.name,
      price: item.price,
      image: item.image_url || "/placeholder.svg",
      description: item.description || "",
      category: item.category,
    })

    setAddedItems((prev) => ({ ...prev, [item.menu_id]: true })) // Changed from item.id to item.menu_id
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.menu_id]: false })) // Changed from item.id to item.menu_id
    }, 1500)
  }

  if (loading) {
    return (
      <>
        {/* Hero Section */}
        <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
          <div className="container mx-auto px-4 text-center z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Menu</h1>
            <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">Loading our delicious menu items...</p>
          </div>
        </section>

        <section className="py-20 bg-darkBg">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
          </div>
        </section>
      </>
    )
  }

  if (error) {
    return (
      <>
        {/* Hero Section */}
        <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
          <div className="container mx-auto px-4 text-center z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Menu</h1>
            <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
              We're having trouble loading our menu. Please try again.
            </p>
          </div>
        </section>

        <section className="py-20 bg-darkBg">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={fetchMenuItems} className="bg-gold text-black hover:bg-gold/90">
                Try Again
              </Button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Menu</h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            Explore our diverse selection of authentic Japanese dishes prepared with the finest ingredients.
          </p>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          {/* Search and Filter */}
          <div className="mb-12 flex flex-col md:flex-row gap-6 justify-between items-center">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search menu..."
                className="w-full py-3 px-4 pl-10 bg-black/30 border border-gray-700 rounded-md text-white focus:outline-none focus:border-gold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>

            <div
              className="w-full grid grid-cols-3 sm:grid-cols-4 gap-2 md:flex md:flex-wrap md:justify-center"
              role="tablist"
              aria-label="Menu categories"
            >
              {derivedCategories.map((category) => (
                <button
                  key={category.id}
                  title={category.id === "all" ? "All" : toTitle(category.name)}
                  className={`w-full md:w-auto text-center px-4 py-2 rounded-full text-sm truncate ${
                    activeCategory === category.id ? "bg-gold text-black" : "bg-black/30 text-white hover:bg-black/50"
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={activeCategory === category.id}
                  role="tab"
                >
                  {category.id === "all" ? "All" : toTitle(category.name)}
                </button>
              ))}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={hideUnavailable}
                  onChange={(e) => setHideUnavailable(e.target.checked)}
                  className="rounded"
                  aria-label="Hide unavailable items"
                />
                <span className="whitespace-nowrap">Hide Unavailable</span>
              </label>
            </div>

            {/* Cart Button */}
            <div className="md:hidden">
              <Button onClick={() => (window.location.href = "/cart")} className="flex items-center gap-2">
                <ShoppingBag size={18} />
                Cart ({totalItems})
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.menu_id}
                  className={`menu-item bg-darkBg/80 rounded-lg overflow-hidden shadow-lg border border-gray-800 group relative ${
                    !item.available ? "opacity-60" : ""
                  }`}
                >
                  <div className="h-64 relative overflow-hidden group">
                    <ImageWithFallback
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      width={600}
                      height={400}
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                        !item.available ? "grayscale" : ""
                      }`}
                      fill
                    />
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 bg-gold/90 backdrop-blur-sm text-black text-sm font-medium px-3 py-1 rounded-full border border-gold z-20 shadow-lg">
                      {item.category}
                    </div>

                    {!item.available && (
                      <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full border border-red-600 z-20 shadow-lg">
                        Unavailable
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-xl font-serif ${item.available ? "text-white" : "text-gray-400"}`}>
                        {item.name}
                      </h3>
                      <span className={`font-medium text-lg ${item.available ? "text-gold" : "text-gray-500"}`}>
                        Tk {item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-sm mb-4 line-clamp-2 ${item.available ? "text-gray-300" : "text-gray-500"}`}>
                      {item.description || "Delicious and freshly prepared."}
                    </p>

                    {/* Order Button - Disabled if unavailable */}
                    {item.available ? (
                      <OrderButton
                        item={{
                          id: item.menu_id,
                          name: item.name,
                          price: item.price,
                          image: item.image_url || "/placeholder.svg",
                          description: item.description || "",
                          category: item.category,
                        }}
                        fullWidth
                        className="shadow-lg"
                        onOrderComplete={() => {
                          setAddedItems((prev) => ({ ...prev, [item.menu_id]: true }))
                          setTimeout(() => {
                            setAddedItems((prev) => ({ ...prev, [item.menu_id]: false }))
                          }, 3000)
                        }}
                      />
                    ) : (
                      <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                        Currently Unavailable
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-400">No menu items found. Please try a different search.</p>
                {menuItems.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No menu items available. Add some items through the dashboard.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
