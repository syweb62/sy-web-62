"use client"

import { useMemo, useState, useEffect } from "react"
import { Search, ShoppingBag } from "lucide-react"
import ImageWithFallback from "@/components/image-fallback"
import { Button } from "@/components/ui/button"
import { OrderButton } from "@/components/ui/order-button"
import { createClient } from "@/lib/supabase"

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string | null
  image_url: string | null
  is_available: boolean
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

function formatBDT(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type Props = {
  items?: MenuItem[]
  fetchFromDatabase?: boolean
}

export function MenuClient({ items = [], fetchFromDatabase = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [hideUnavailable, setHideUnavailable] = useState<boolean>(false)
  const [dbItems, setDbItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching menu items:", error)
        return
      }

      setDbItems(data || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fetchFromDatabase) {
      fetchMenuItems()

      // Set up real-time subscription
      const supabase = createClient()
      const channel = supabase
        .channel("menu_client_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "menu_items",
          },
          (payload) => {
            console.log("[v0] Menu client change detected:", payload)
            fetchMenuItems()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchFromDatabase])

  const menuItems = fetchFromDatabase ? dbItems : items

  // Build categories from live data with stable ids
  const categories = useMemo(() => {
    const map = new Map<string, string>() // id -> label
    for (const it of menuItems) {
      const id = normalizeCategory(it.category)
      const label = it.category?.trim() || "Uncategorized"
      if (id) map.set(id, label)
    }
    return [{ id: "all", label: "All" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return menuItems.filter((item) => {
      const name = item.name?.toLowerCase() || ""
      const desc = item.description?.toLowerCase() || ""
      const itemCatId = normalizeCategory(item.category)
      const matchesCategory = activeCategory === "all" || itemCatId === activeCategory
      const matchesSearch = !q || name.includes(q) || desc.includes(q)
      const available = item.is_available !== false
      const matchesAvailability = hideUnavailable ? available : true
      return matchesCategory && matchesSearch && matchesAvailability
    })
  }, [menuItems, searchQuery, activeCategory, hideUnavailable])

  const totalInCategory = useMemo(() => {
    if (activeCategory === "all") return menuItems.length
    return menuItems.filter((it) => normalizeCategory(it.category) === activeCategory).length
  }, [menuItems, activeCategory])

  if (fetchFromDatabase && loading && menuItems.length === 0) {
    return (
      <section className="py-14 md:py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-14 md:py-20 bg-darkBg">
      <div className="container mx-auto px-4">
        {/* Controls */}
        <div className="mb-8 md:mb-10 grid grid-cols-1 md:grid-cols-[1fr_minmax(0,1fr)_auto] gap-6 items-center">
          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full py-3 px-4 pl-10 bg-black/30 border border-gray-700 rounded-md text-white focus:outline-none focus:border-gold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search menu items"
            />
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
              aria-hidden="true"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeCategory === c.id ? "bg-gold text-black" : "bg-black/30 text-white hover:bg-black/50"
                }`}
                onClick={() => setActiveCategory(c.id)}
                aria-pressed={activeCategory === c.id}
              >
                {c.id === "all" ? "All" : toTitle(normalizeCategory(c.label))}
              </button>
            ))}
          </div>

          {/* Availability Toggle + Mobile Cart Shortcut */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <label className="flex items-center gap-2 text-white text-sm select-none">
              <input
                type="checkbox"
                checked={hideUnavailable}
                onChange={(e) => setHideUnavailable(e.target.checked)}
                className="rounded"
              />
              Hide Unavailable
            </label>
            <div className="md:hidden">
              <Button onClick={() => (window.location.href = "/cart")} className="flex items-center gap-2">
                <ShoppingBag size={18} />
                Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Results meta */}
        <div className="mb-4 text-xs text-gray-400">
          Showing {filteredItems.length} of {totalInCategory} {activeCategory === "all" ? "items" : "in this category"}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const available = item.is_available !== false
              const image = item.image_url || "/placeholder.svg"

              return (
                <article
                  key={item.id}
                  className={`bg-darkBg/80 rounded-lg overflow-hidden shadow-lg border border-gray-800 group relative ${
                    !available ? "opacity-90" : ""
                  }`}
                >
                  <div className="h-64 relative overflow-hidden">
                    <ImageWithFallback
                      src={image || "/placeholder.svg"}
                      alt={item.name}
                      width={600}
                      height={400}
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                        !available ? "grayscale" : ""
                      }`}
                      fill
                    />

                    {/* Category Badge */}
                    {item.category ? (
                      <div className="absolute top-3 right-3 bg-gold/90 backdrop-blur-sm text-black text-xs md:text-sm font-medium px-3 py-1 rounded-full border border-gold z-10 shadow">
                        {item.category}
                      </div>
                    ) : null}

                    {/* Unavailable Badge */}
                    {!available && (
                      <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs md:text-sm font-medium px-3 py-1 rounded-full border border-red-600 z-10 shadow">
                        Unavailable
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-xl font-serif ${available ? "text-white" : "text-gray-400"}`}>
                        {item.name}
                      </h3>
                      <span className={`font-medium text-lg ${available ? "text-gold" : "text-gray-500"}`}>
                        BDT {formatBDT(item.price)}
                      </span>
                    </div>

                    <p className={`text-sm mb-4 line-clamp-2 ${available ? "text-gray-300" : "text-gray-500"}`}>
                      {item.description || "Delicious and freshly prepared."}
                    </p>

                    {available ? (
                      <OrderButton
                        item={{
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image,
                          description: item.description || undefined,
                          category: item.category || undefined,
                        }}
                        fullWidth
                        className="shadow"
                      />
                    ) : (
                      <Button disabled className="w-full bg-gray-700 text-gray-300 cursor-not-allowed">
                        Currently Unavailable
                      </Button>
                    )}
                  </div>
                </article>
              )
            })
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-gray-400">No menu items found.</p>
              <p className="text-sm text-gray-500 mt-2">
                {fetchFromDatabase
                  ? "Try adding items through the dashboard or check your filters."
                  : "Try clearing filters or check your data."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
