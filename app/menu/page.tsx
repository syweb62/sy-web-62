"use client"

import { useMemo, useState } from "react"
import { Search, ShoppingBag } from "lucide-react"
import ImageWithFallback from "@/components/image-fallback"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { OrderButton } from "@/components/ui/order-button"

function normalizeCategory(value?: string | null) {
  return (value ?? "").toString().trim().toLowerCase().replace(/\s+/g, "-")
}

function toTitle(label: string) {
  return label
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// Mock menu data with availability status
// Added demo items to create more categories (total 25 categories derived automatically)
const menuItems = [
  {
    id: "item-1",
    name: "Sushi Platter",
    category: "sushi",
    price: 24.99,
    description: "Assortment of fresh nigiri and maki rolls with wasabi, ginger, and soy sauce.",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-2",
    name: "Teriyaki Salmon",
    category: "bento",
    price: 22.99,
    description: "Grilled salmon glazed with our signature teriyaki sauce, served with steamed rice.",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: false,
  },
  {
    id: "item-3",
    name: "Tonkotsu Ramen",
    category: "ramen",
    price: 18.99,
    description: "Rich pork broth with ramen noodles, soft-boiled egg, chashu pork, and fresh vegetables.",
    image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-4",
    name: "Gyoza",
    category: "appetizers",
    price: 8.99,
    description: "Pan-fried dumplings filled with seasoned ground pork and vegetables.",
    image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-5",
    name: "Dragon Roll",
    category: "sushi",
    price: 16.99,
    description: "Eel and cucumber inside, avocado and tobiko on top, drizzled with eel sauce.",
    image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: false,
  },
  {
    id: "item-6",
    name: "Miso Soup",
    category: "appetizers",
    price: 4.99,
    description: "Traditional Japanese soup with tofu, seaweed, and green onions.",
    image: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-7",
    name: "Chicken Katsu Bento",
    category: "bento",
    price: 19.99,
    description: "Crispy breaded chicken cutlet served with rice, salad, and miso soup.",
    image: "https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-8",
    name: "Matcha Green Tea Ice Cream",
    category: "desserts",
    price: 6.99,
    description: "Creamy ice cream infused with premium matcha green tea.",
    image: "https://images.unsplash.com/photo-1561845730-208ad5910553?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: false,
  },
  {
    id: "item-9",
    name: "Sake",
    category: "drinks",
    price: 12.99,
    description: "Traditional Japanese rice wine, served warm or cold.",
    image: "https://images.unsplash.com/photo-1627042633145-b780d842ba0a?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-10",
    name: "Mochi Ice Cream",
    category: "desserts",
    price: 7.99,
    description: "Sweet rice dough filled with ice cream in various flavors.",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-11",
    name: "Spicy Tuna Roll",
    category: "sushi",
    price: 14.99,
    description: "Fresh tuna mixed with spicy mayo and cucumber, wrapped in seaweed and rice.",
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-12",
    name: "Japanese Green Tea",
    category: "drinks",
    price: 3.99,
    description: "Traditional Japanese green tea, served hot.",
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },

  // New demo categories below (one item each)
  {
    id: "item-13",
    name: "Salmon Sashimi",
    category: "sashimi",
    price: 17.99,
    description: "Freshly sliced salmon sashimi served with wasabi and soy sauce.",
    image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-14",
    name: "Beef Udon",
    category: "udon",
    price: 15.99,
    description: "Thick udon noodles in savory broth with tender beef and scallions.",
    image: "https://images.unsplash.com/photo-1625944528146-67a5bf02a43e?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-15",
    name: "Shrimp Tempura",
    category: "tempura",
    price: 13.99,
    description: "Crispy battered shrimp served with tentsuyu dipping sauce.",
    image: "https://images.unsplash.com/photo-1604908554035-2bd3f2b5a726?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: false,
  },
  {
    id: "item-16",
    name: "Seaweed Salad",
    category: "salads",
    price: 6.49,
    description: "Refreshing wakame seaweed salad with sesame dressing.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-17",
    name: "Chicken Teriyaki Don",
    category: "donburi",
    price: 12.99,
    description: "Teriyaki-glazed chicken over steamed rice with pickled ginger.",
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb36?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-18",
    name: "Yakitori Skewers",
    category: "yakitori",
    price: 11.99,
    description: "Charcoal-grilled chicken skewers brushed with tare sauce.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-19",
    name: "Vegan Tofu Bowl",
    category: "vegan",
    price: 12.49,
    description: "Marinated tofu with seasonal veggies over rice and sesame sauce.",
    image: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-20",
    name: "Onigiri",
    category: "onigiri",
    price: 4.49,
    description: "Hand-pressed rice balls with tuna mayo filling and nori wrap.",
    image: "https://images.unsplash.com/photo-1636211991121-75667f182947?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-21",
    name: "Okonomiyaki",
    category: "okonomiyaki",
    price: 14.49,
    description: "Savory cabbage pancake with okonomiyaki sauce and bonito flakes.",
    image: "https://images.unsplash.com/photo-1625943863923-03398ec6053e?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: false,
  },
  {
    id: "item-22",
    name: "Teppanyaki Beef",
    category: "teppanyaki",
    price: 21.99,
    description: "Seared beef and vegetables cooked on a hot iron griddle.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-23",
    name: "Cold Soba",
    category: "soba",
    price: 10.99,
    description: "Chilled buckwheat noodles served with dipping sauce and scallions.",
    image: "https://images.unsplash.com/photo-1576458088443-04a19bb13da6?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-24",
    name: "Katsu Curry",
    category: "curry",
    price: 16.49,
    description: "Crispy pork cutlet with rich Japanese curry over rice.",
    image: "https://images.unsplash.com/photo-1604908553924-5d5a7bde8b2e?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
  {
    id: "item-25",
    name: "Assorted Nigiri Set",
    category: "nigiri",
    price: 23.99,
    description: "Chef’s selection of fresh nigiri sushi, served with soy and wasabi.",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600&h=400&auto=format&fit=crop",
    is_available: true,
  },
]

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  // Default to hide unavailable items only when the checkbox is checked.
  const [showUnavailable, setShowUnavailable] = useState(false)
  const { addItem, totalItems } = useCart()
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})

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
  }, [])

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || normalizeCategory(item.category) === activeCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Hide unavailable items when the toggle is ON
    const matchesAvailability = showUnavailable || item.is_available

    return matchesCategory && matchesSearch && matchesAvailability
  })

  const handleAddToCart = (item: (typeof menuItems)[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description,
      category: item.category,
    })

    setAddedItems((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }))
    }, 1500)
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
                  checked={!showUnavailable}
                  onChange={(e) => setShowUnavailable(!e.target.checked)}
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
                  key={item.id}
                  className={`menu-item bg-darkBg/80 rounded-lg overflow-hidden shadow-lg border border-gray-800 group relative ${
                    !item.is_available ? "opacity-60" : ""
                  }`}
                >
                  <div className="h-64 relative overflow-hidden group">
                    <ImageWithFallback
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={600}
                      height={400}
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                        !item.is_available ? "grayscale" : ""
                      }`}
                      fill
                    />
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 bg-gold/90 backdrop-blur-sm text-black text-sm font-medium px-3 py-1 rounded-full border border-gold z-20 shadow-lg">
                      {item.category}
                    </div>

                    {/* Unavailable Badge */}
                    {!item.is_available && (
                      <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full border border-red-600 z-20 shadow-lg">
                        Unavailable
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-xl font-serif ${item.is_available ? "text-white" : "text-gray-400"}`}>
                        {item.name}
                      </h3>
                      <span className={`font-medium text-lg ${item.is_available ? "text-gold" : "text-gray-500"}`}>
                        BDT {item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-sm mb-4 line-clamp-2 ${item.is_available ? "text-gray-300" : "text-gray-500"}`}>
                      {item.description}
                    </p>

                    {/* Order Button - Disabled if unavailable */}
                    {item.is_available ? (
                      <OrderButton
                        item={{
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                          description: item.description,
                          category: item.category,
                        }}
                        fullWidth
                        className="shadow-lg"
                        onOrderComplete={() => {
                          setAddedItems((prev) => ({ ...prev, [item.id]: true }))
                          setTimeout(() => {
                            setAddedItems((prev) => ({ ...prev, [item.id]: false }))
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
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
