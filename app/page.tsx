"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown, Search, Menu } from "lucide-react"
import { OptimizedImage } from "@/components/optimized-image"
import Image from "next/image"
import { OrderButton } from "@/components/ui/order-button"

// Define interfaces for data structures
interface MenuItem {
  id: string
  name: string
  price: number
  image: string
  description: string
}

interface GalleryImage {
  src: string
  alt: string
  title?: string
  description?: string
}

interface Testimonial {
  id: number
  name: string
  avatar: string
  rating: number
  text: string
}

// Optimized image URLs with WebP support
const MENU_ITEMS: MenuItem[] = [
  {
    id: "item-1",
    name: "Sushi Platter",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&h=400&auto=format&fit=crop&fm=webp",
    description: "Assortment of fresh nigiri and maki rolls with wasabi, ginger, and soy sauce.",
  },
  {
    id: "item-2",
    name: "Teriyaki Salmon",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&h=400&auto=format&fit=crop&fm=webp",
    description: "Grilled salmon glazed with our signature teriyaki sauce, served with steamed rice.",
  },
  {
    id: "item-3",
    name: "Ramen Bowl",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600&h=400&auto=format&fit=crop&fm=webp",
    description: "Rich broth with ramen noodles, soft-boiled egg, chashu pork, and fresh vegetables.",
  },
]

const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Fresh sushi selection showcasing our chef's expertise",
    title: "Chef's Selection",
    description: "A curated mix of fresh nigiri and maki.",
  },
  {
    src: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Elegant Japanese restaurant interior with traditional design",
    title: "Interior Ambience",
    description: "Traditional design with modern elegance.",
  },
  {
    src: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Premium sashimi platter with fresh fish",
    title: "Premium Sashimi",
    description: "Slices of seasonal, premium fish.",
  },
  {
    src: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Master chef preparing sushi with traditional techniques",
    title: "At The Counter",
    description: "Watch the craft up close.",
  },
  {
    src: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Colorful maki rolls arranged artistically",
    title: "Artful Rolls",
    description: "Colorful maki with balanced flavors.",
  },
  {
    src: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Traditional Japanese tea ceremony setting",
    title: "Tea Ceremony",
    description: "A quiet moment, perfectly brewed.",
  },
  {
    src: "https://images.unsplash.com/photo-1562158078713-fc5400e7fe10?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Crispy tempura vegetables and shrimp",
    title: "Crispy Tempura",
    description: "Light batter, golden crunch.",
  },
  {
    src: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Premium sake paired with fresh sushi",
    title: "Sake Pairing",
    description: "Curated pours to match your plate.",
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "The sushi here is absolutely amazing! Fresh ingredients and expert preparation. The ambiance is also perfect for both casual dining and special occasions.",
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "As someone who's traveled to Japan multiple times, I can confidently say that Sushi Yaki offers one of the most authentic Japanese dining experiences in the city.",
  },
  {
    id: 3,
    name: "Priya Sharma",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 5,
    text: "The service is impeccable, and the food is consistently excellent. Their ramen is a must-try, especially during colder months. Highly recommend!",
  },
]

export default function Home() {
  const [branch, setBranch] = useState("")
  const [location, setLocation] = useState("")
  const [searchError, setSearchError] = useState("")
  const [openOverlay, setOpenOverlay] = useState<number | null>(null)
  const toggleOverlay = (index: number) => {
    setOpenOverlay((prev) => (prev === index ? null : index))
  }

  const galleryRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = galleryRef.current
    if (!container) return

    const items = Array.from(container.children) as HTMLElement[]

    // Staggered delay per item
    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`
    })

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.classList.add("reveal")
            obs.unobserve(el)
          }
        })
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    )

    items.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const handleBranchChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setBranch(e.target.value)
    setSearchError("")
  }, [])

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value)
    setSearchError("")
  }, [])

  const handleSearch = useCallback(() => {
    if (!branch.trim() || !location.trim()) {
      setSearchError("Please select both branch and location")
      return
    }

    setSearchError("")
  }, [branch, location])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch()
      }
    },
    [handleSearch],
  )

  // Memoized components for better performance
  const menuItems = useMemo(
    () =>
      MENU_ITEMS.map((item, index) => (
        <article key={item.id} className="menu-item bg-darkBg/80 rounded-lg overflow-hidden shadow-lg">
          <div className="h-64 relative">
            <OptimizedImage
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl">{item.name}</h3>
              <span className="text-gold font-medium" aria-label={`Price: ${item.price} BDT`}>
                BDT {item.price}
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-4">{item.description}</p>
            <OrderButton
              item={{
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
              }}
              size="sm"
              className="mt-4 rounded-full"
              aria-label={`Add ${item.name} to cart`}
            />
          </div>
        </article>
      )),
    [],
  )

  const galleryImages = useMemo(
    () =>
      GALLERY_IMAGES.map((item, index) => {
        const isOpen = openOverlay === index
        const detailsId = `gallery-details-${index}`

        return (
          <div
            key={`gallery-${index}`}
            className="gallery-image group relative overflow-hidden rounded-lg cursor-pointer will-change-transform"
          >
            <OptimizedImage
              src={item.src || "/placeholder.svg"}
              alt={item.alt}
              width={300}
              height={300}
              className="w-full h-64 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority={index < 4}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
            />

            {/* Gradient overlay */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent transition-opacity duration-300 ease-out
            ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}
              aria-hidden="true"
            />

            {/* Details content */}
            <div
              id={detailsId}
              className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 transition-all duration-300 ease-out
            ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"}`}
            >
              <h3 className="text-white text-sm sm:text-base font-medium line-clamp-1">
                {item.title || "Gallery Highlight"}
              </h3>
              <p className="text-gray-200 text-xs sm:text-sm mt-1 line-clamp-2">{item.description || item.alt}</p>
            </div>

            {/* Invisible button to support tap/focus toggle without affecting layout */}
            <button
              type="button"
              aria-label={`Show details: ${item.title || item.alt}`}
              aria-controls={detailsId}
              aria-expanded={isOpen}
              onClick={() => toggleOverlay(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleOverlay(index)
                }
              }}
              className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            />
          </div>
        )
      }),
    [openOverlay],
  )

  const testimonialCards = useMemo(
    () =>
      TESTIMONIALS.map((testimonial) => (
        <article key={testimonial.id} className="bg-darkBg/50 p-8 rounded-lg border border-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <OptimizedImage
              src={testimonial.avatar}
              alt={`${testimonial.name} profile picture`}
              width={60}
              height={60}
              className="rounded-full object-cover w-14 h-14"
              priority={false}
            />
            <div>
              <h4 className="font-medium">{testimonial.name}</h4>
              <div className="flex text-gold" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <span key={i} aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          <blockquote className="text-gray-300">"{testimonial.text}"</blockquote>
        </article>
      )),
    [],
  )

  const createEnhancedPetal = useCallback(
    (container: HTMLElement, centerX: number, centerY: number, fallDistance: number, waveIndex: number) => {
      const petal = document.createElement("div")
      petal.className = "cherry-petal absolute pointer-events-none z-10"

      // Optimized styling with CSS transforms
      const startX = centerX + (Math.random() - 0.5) * 200
      const startY = centerY + (Math.random() - 0.5) * 100
      const size = Math.random() * 8 + 6
      const rotation = Math.random() * 360
      const duration = Math.random() * 3 + 4

      petal.style.cssText = `
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(45deg, #ff69b4, #ffb6c1, #ffc0cb);
      border-radius: 50% 10% 50% 10%;
      transform: rotate(${rotation}deg);
      opacity: 0.8;
      will-change: transform, opacity;
    `

      container.appendChild(petal)

      // Enhanced realistic motion with better performance
      const swayAmount = Math.random() * 150 + 50
      const swayDirection = Math.random() > 0.5 ? 1 : -1
      const finalX = startX + swayAmount * swayDirection + (Math.random() - 0.5) * 100
      const finalRotation = rotation + 360 + Math.random() * 720

      requestAnimationFrame(() => {
        petal.style.transition = `all ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        petal.style.transform = `
        translateY(${fallDistance}px) 
        translateX(${finalX - startX}px) 
        rotate(${finalRotation}deg) 
        scale(0.6)
      `
        petal.style.opacity = "0"
      })

      setTimeout(
        () => {
          if (petal.parentNode) {
            petal.remove()
          }
        },
        duration * 1000 + 200,
      )
    },
    [],
  )

  const createRealisticLeaf = useCallback(
    (container: HTMLElement, centerX: number, centerY: number, fallDistance: number, waveIndex: number) => {
      const leaf = document.createElement("div")
      leaf.className = "cherry-leaf absolute pointer-events-none z-10"

      const startX = centerX + (Math.random() - 0.5) * 180
      const startY = centerY + (Math.random() - 0.5) * 80
      const size = Math.random() * 6 + 8
      const rotation = Math.random() * 360
      const duration = Math.random() * 2.5 + 3.5

      leaf.style.cssText = `
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size * 1.4}px;
      background: linear-gradient(45deg, #228b22, #32cd32, #90ee90);
      border-radius: 0% 100% 0% 100%;
      transform: rotate(${rotation}deg);
      opacity: 0.7;
      will-change: transform, opacity;
    `

      container.appendChild(leaf)

      const swayAmount = Math.random() * 120 + 40
      const swayDirection = Math.random() > 0.5 ? 1 : -1
      const finalX = startX + swayAmount * swayDirection + (Math.random() - 0.5) * 120
      const finalRotation = rotation + 180 + Math.random() * 540

      requestAnimationFrame(() => {
        leaf.style.transition = `all ${duration}s cubic-bezier(0.23, 1, 0.32, 1)`
        leaf.style.transform = `
        translateY(${fallDistance}px) 
        translateX(${finalX - startX}px) 
        rotate(${finalRotation}deg) 
        scale(0.7)
      `
        leaf.style.opacity = "0"
      })

      setTimeout(
        () => {
          if (leaf.parentNode) {
            leaf.remove()
          }
        },
        duration * 1000 + 300,
      )
    },
    [],
  )

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-screen flex items-center justify-center relative" role="banner">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <div className="mb-16 flex justify-center">
            <div className="relative group">
              <Image
                src="/images/sushiyaki-logo.png"
                alt="Sushi Yaki - すしやき Restaurant Logo"
                width={400}
                height={200}
                className="relative z-10 h-auto w-auto max-w-[200px] sm:max-w-[250px] md:max-w-[280px] lg:max-w-[320px] transition-all duration-500 group-hover:scale-105 animate-fade-in"
                priority
                sizes="(max-width: 640px) 250px, (max-width: 768px) 300px, (max-width: 1024px) 350px, 400px"
                fetchPriority="high"
              />
              {/* Animated glow effect */}
              <div
                className="hidden sm:block absolute inset-0 pointer-events-none -z-10 bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-lg sm:blur-xl sm:opacity-60 animate-pulse"
                aria-hidden="true"
              ></div>
              {/* Cherry blossom animation container */}
              <div
                className="absolute inset-0 z-20 overflow-visible cursor-pointer flex items-center justify-center"
                onClick={(e) => {
                  // Get the center point of the logo
                  const rect = e.currentTarget.getBoundingClientRect()
                  const centerX = rect.width / 2
                  const centerY = rect.height / 2

                  // Calculate distance to middle of hero text
                  const heroSection = document.querySelector(".hero-section")
                  const heroTitle = document.querySelector("h1")
                  const logoContainer = e.currentTarget.closest(".mb-16")

                  let fallDistance = 400 // Default fallback

                  if (heroSection && heroTitle && logoContainer) {
                    const heroSectionRect = heroSection.getBoundingClientRect()
                    const heroTitleRect = heroTitle.getBoundingClientRect()
                    const logoRect = logoContainer.getBoundingClientRect()

                    // Calculate distance from logo center to middle of hero title
                    const logoBottom = logoRect.bottom
                    const heroTitleMiddle = heroTitleRect.top + heroTitleRect.height / 2
                    fallDistance = Math.max(300, heroTitleMiddle - logoBottom + centerY)
                  }

                  // Create multiple realistic cherry blossom petals and leaves
                  const container = e.currentTarget

                  // Clear excessive elements for performance
                  const existingElements = container.querySelectorAll(".cherry-petal, .cherry-leaf")
                  if (existingElements.length > 40) {
                    existingElements.forEach((element, index) => {
                      if (index < 20) element.remove()
                    })
                  }

                  // Create cascading waves of petals and leaves
                  const createMixedWave = (waveIndex: number, elementsInWave: number) => {
                    for (let i = 0; i < elementsInWave; i++) {
                      setTimeout(
                        () => {
                          // Mix petals and leaves randomly (70% petals, 30% leaves)
                          if (Math.random() > 0.3) {
                            createEnhancedPetal(container, centerX, centerY, fallDistance, waveIndex)
                          } else {
                            createRealisticLeaf(container, centerX, centerY, fallDistance, waveIndex)
                          }
                        },
                        waveIndex * 200 + i * 80,
                      )
                    }
                  }

                  // Create 4 waves of mixed elements for enhanced cascading effect
                  createMixedWave(0, 10) // First wave
                  createMixedWave(1, 8) // Second wave
                  createMixedWave(2, 6) // Third wave
                  createMixedWave(3, 4) // Fourth wave
                }}
                id="cherry-blossom-container"
                aria-hidden="true"
              >
                <span className="sr-only">Click for cherry blossom effect</span>
              </div>
            </div>
          </div>

          <header>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold mb-6 leading-tight">
              THE PLEASURE OF <br /> VARIETY ON YOUR PLATE
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-12 text-gray-200">
              Craving some delicious Japanese food? Maybe you're in the mood for a fresh sushi platter? No matter what
              kind of meal you have in mind, Sushi Yaki has something to delight your palate.
            </p>
          </header>

          {/* Prominent Menu Option */}
          <div className="mb-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 mb-4 text-lg">Explore our carefully crafted Japanese dishes</p>
                <Link
                  href="/menu"
                  prefetch
                  className="inline-block px-6 py-3 bg-gold text-black font-semibold uppercase tracking-wider rounded-md hover:bg-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 flex items-center gap-2 justify-center"
                  aria-label="View our complete menu"
                >
                  <Menu size={18} aria-hidden="true" />
                  View Menu
                </Link>
              </div>
            </div>
          </div>

          {/* Location Selector */}
          <div className="max-w-3xl mx-auto bg-black/10 p-8 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-sans mb-6">Choose your location to see available restaurants</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
              }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                {/* Single Branch: Sushi Yaki */}
                <div className="relative flex-1">
                  <label htmlFor="branch-select" className="sr-only">
                    Select Branch
                  </label>
                  <select
                    id="branch-select"
                    className="location-dropdown w-full py-3 px-4 pr-10 rounded-md text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold"
                    value={branch || "sushi-yaki"}
                    onChange={handleBranchChange}
                    onKeyDown={handleKeyDown}
                    aria-describedby="branch-help"
                  >
                    <option value="sushi-yaki">Sushi Yaki</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"
                    size={20}
                    aria-hidden="true"
                  />
                  <div id="branch-help" className="sr-only">
                    Only branch available: Sushi Yaki
                  </div>
                </div>

                {/* Single Location: Mohammadpur */}
                <div className="relative flex-1">
                  <label htmlFor="location-select" className="sr-only">
                    Select Location
                  </label>
                  <select
                    id="location-select"
                    className="location-dropdown w-full py-3 px-4 pr-10 rounded-md text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold"
                    value={location || "mohammadpur"}
                    onChange={handleLocationChange}
                    onKeyDown={handleKeyDown}
                    aria-describedby="location-help"
                  >
                    <option value="mohammadpur">Mohammadpur</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"
                    size={20}
                    aria-hidden="true"
                  />
                  <div id="location-help" className="sr-only">
                    Only location available: Mohammadpur
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="search-btn py-3 px-8 rounded-md font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  aria-describedby="search-help"
                >
                  <Search size={18} aria-hidden="true" />
                  SEARCH
                </button>
                <div id="search-help" className="sr-only">
                  Search for restaurants in Mohammadpur, Sushi Yaki
                </div>
              </div>

              {searchError && (
                <div className="text-red-400 text-sm mt-2" role="alert" aria-live="polite">
                  {searchError}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-black" aria-labelledby="gallery-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="gallery-heading" className="text-3xl md:text-4xl font-sans mb-2">
              Our Gallery
            </h2>
            <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true"></div>
            <p className="text-gray-300 max-w-2xl mx-auto mt-6">
              Take a visual journey through our culinary creations and elegant dining spaces.
            </p>
          </header>

          <div
            ref={galleryRef}
            className="gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Restaurant gallery"
          >
            {galleryImages}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-black to-darkBg" aria-labelledby="testimonials-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-sans mb-2">
              What Our Customers Say
            </h2>
            <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true"></div>
          </header>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
            aria-label="Customer testimonials"
          >
            {testimonialCards}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-darkBg relative" aria-labelledby="cta-heading">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=1920&h=1080&auto=format&fit=crop&fm=webp')] opacity-10 bg-cover bg-center"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-sans mb-6">
              Ready to Experience Authentic Japanese Cuisine?
            </h2>
            <p className="text-gray-300 mb-8">
              Book your table now and embark on a culinary journey that will tantalize your taste buds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="book-table-btn px-8 py-3 text-gold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gold"
                aria-label="Book a table at Sushi Yaki"
              >
                Book a Table
              </Link>
              <Link
                href="/menu"
                className="px-8 py-3 bg-gold text-black uppercase tracking-wider hover:bg-gold/80 transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
                aria-label="View our complete menu"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
        onMouseMove={(e) => {
          const container = e.currentTarget
          const rect = container.getBoundingClientRect()
          const centerX = e.clientX - rect.left
          const centerY = e.clientY - rect.top
          const fallDistance = window.innerHeight - centerY + 100

          const existingElements = container.querySelectorAll(".cherry-petal, .cherry-leaf")
          if (existingElements.length > 30) {
            existingElements.forEach((element, index) => {
              if (index < 15) element.remove()
            })
          }

          if (Math.random() > 0.7) {
            if (Math.random() > 0.3) {
              createEnhancedPetal(container, centerX, centerY, fallDistance, 0)
            } else {
              createRealisticLeaf(container, centerX, centerY, fallDistance, 0)
            }
          }
        }}
      />

      <style jsx global>{`
      .gallery-grid .gallery-image {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
        transition:
          opacity 500ms ease,
          transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      .gallery-grid .gallery-image.reveal {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .cherry-petal {
        animation-timing-function: ease-in-out;
        animation-fill-mode: forwards;
        will-change: transform, opacity;
        filter: blur(0.5px);
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
      }

      #cherry-blossom-container:active::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, rgba(255, 207, 224, 0.2) 0%, transparent 70%);
        animation: pulse 0.5s ease-out;
      }

      @keyframes pulse {
        0% {
          opacity: 0.5;
          transform: scale(0.8);
        }
        100% {
          opacity: 0;
          transform: scale(1.5);
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .gallery-grid .gallery-image {
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }

        .animate-float,
        .animate-fade-in,
        .animate-pulse,
        .cherry-petal {
          animation: none;
        }
        .transition-all,
        .transition-colors,
        .transition-transform {
          transition: none;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .text-gold {
          color: #ffff00;
        }
        .bg-gold {
          background-color: #ffff00;
        }
        .border-gold {
          border-color: #ffff00;
        }
      }
    `}</style>
    </>
  )
}
