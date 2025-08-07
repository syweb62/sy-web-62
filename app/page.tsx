"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
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
  },
  {
    src: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Elegant Japanese restaurant interior with traditional design",
  },
  {
    src: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Premium sashimi platter with fresh fish",
  },
  {
    src: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Master chef preparing sushi with traditional techniques",
  },
  {
    src: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Colorful maki rolls arranged artistically",
  },
  {
    src: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Traditional Japanese tea ceremony setting",
  },
  {
    src: "https://images.unsplash.com/photo-1562158078-ef0fc409efce?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Crispy tempura vegetables and shrimp",
  },
  {
    src: "https://images.unsplash.com/photo-1554502078-ef0fc409efce?q=80&w=300&h=300&auto=format&fit=crop&fm=webp",
    alt: "Premium sake paired with fresh sushi",
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

  const handleBranchChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setBranch(e.target.value)
    setSearchError("")
  }, [])

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value)
    setSearchError("")
  }, [])

  const handleSearch = useCallback(() => {
    if (!branch || !location) {
      setSearchError("Please select both branch and location")
      return
    }

    // In a real app, this would navigate to search results
    console.log(`Searching for restaurants in ${location}, ${branch}`)
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
              <h3 className="text-xl font-serif">{item.name}</h3>
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
      GALLERY_IMAGES.map((item, index) => (
        <div key={`gallery-${index}`} className="gallery-image rounded-lg overflow-hidden">
          <OptimizedImage
            src={item.src}
            alt={item.alt}
            width={300}
            height={300}
            className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105 animate-fade-in"
            priority={index < 4}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
          />
        </div>
      )),
    [],
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

  // Enhanced cherry blossom petal creation function
  const createEnhancedPetal = (container, centerX, centerY, fallDistance, waveIndex = 0) => {
    const petal = document.createElement("div")

    // Enhanced petal properties
    const size = 14 + Math.random() * 10 // Size between 14-24px
    const spreadX = (Math.random() - 0.5) * 150 // Horizontal spread from center
    const spreadY = (Math.random() - 0.5) * 50 // Vertical spread from center
    const startX = centerX + spreadX
    const startY = centerY + spreadY
    const duration = 5 + Math.random() * 3 + waveIndex * 0.5 // Longer duration 5-8s
    const rotation = Math.random() * 360
    const swayAmount = 60 + Math.random() * 80 // Increased sway
    const swayFrequency = 2 + Math.random() * 2 // Sway frequency

    // Premium petal colors with more variation
    const petalColors = [
      "#ffb3d1", // Light pink
      "#ffc0cb", // Pink
      "#ffcccb", // Light coral
      "#ffd1dc", // Thistle
      "#ffe4e1", // Misty rose
      "#fff0f5", // Lavender blush
      "#ffeef0", // Very light pink
      "#ffb6c1", // Light pink
    ]
    const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)]
    const petalColorDark = petalColors[Math.floor(Math.random() * petalColors.length)]

    // Create enhanced realistic petal shape
    petal.className = "cherry-petal absolute"
    petal.style.cssText = `
      width: ${size}px;
      height: ${size * 1.3}px;
      left: ${startX}px;
      top: ${startY}px;
      background: radial-gradient(ellipse at 30% 20%, ${petalColor} 0%, ${petalColorDark}dd 60%, ${petalColor}aa 100%);
      border-radius: 50% 10% 50% 10%;
      transform: rotate(${rotation}deg);
      opacity: 0.85;
      box-shadow: 
        0 3px 8px rgba(255, 182, 193, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.5),
        inset 0 -2px 3px rgba(255, 182, 193, 0.3),
        0 0 15px rgba(255, 192, 203, 0.2);
      filter: blur(0.2px) drop-shadow(0 2px 4px rgba(255, 182, 193, 0.3));
      z-index: 1000;
      pointer-events: none;
      transition: all 0.1s ease-out;
    `

    // Add enhanced petal texture and veins
    petal.innerHTML = `
      <div style="
        position: absolute;
        top: 15%;
        left: 25%;
        width: 50%;
        height: 70%;
        background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,182,193,0.2) 100%);
        border-radius: 50% 10% 50% 10%;
        transform: rotate(-15deg);
      "></div>
      <div style="
        position: absolute;
        top: 30%;
        left: 40%;
        width: 2px;
        height: 40%;
        background: linear-gradient(to bottom, rgba(255,182,193,0.3) 0%, transparent 100%);
        transform: rotate(10deg);
      "></div>
    `

    container.appendChild(petal)

    // Enhanced realistic motion with complex physics
    const swayDirection = Math.random() > 0.5 ? 1 : -1
    const finalX = startX + swayAmount * swayDirection + (Math.random() - 0.5) * 100
    const finalRotation = rotation + 360 + Math.random() * 720

    // Apply enhanced realistic motion with keyframe animation
    setTimeout(() => {
      petal.style.transition = `all ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      petal.style.transform = `
        translateY(${fallDistance}px) 
        translateX(${finalX - startX}px) 
        rotate(${finalRotation}deg) 
        scale(0.6)
      `
      petal.style.opacity = "0"

      // Add swaying motion during fall
      const swayKeyframes = `
        @keyframes sway-${Date.now()}-${Math.random()} {
          0% { transform: translateY(0px) translateX(0px) rotate(${rotation}deg) scale(1); }
          25% { transform: translateY(${fallDistance * 0.25}px) translateX(${(finalX - startX) * 0.3}px) rotate(${rotation + 90}deg) scale(0.9); }
          50% { transform: translateY(${fallDistance * 0.5}px) translateX(${(finalX - startX) * 0.6}px) rotate(${rotation + 180}deg) scale(0.8); }
          75% { transform: translateY(${fallDistance * 0.75}px) translateX(${(finalX - startX) * 0.8}px) rotate(${rotation + 270}deg) scale(0.7); }
          100% { transform: translateY(${fallDistance}px) translateX(${finalX - startX}px) rotate(${finalRotation}deg) scale(0.6); opacity: 0; }
        }
      `

      // Apply the swaying animation
      const style = document.createElement("style")
      style.textContent = swayKeyframes
      document.head.appendChild(style)

      setTimeout(() => {
        if (style.parentNode) {
          style.remove()
        }
      }, duration * 1000)
    }, 100)

    // Remove petal after animation with cleanup
    setTimeout(
      () => {
        if (petal.parentNode) {
          petal.remove()
        }
      },
      duration * 1000 + 200,
    )
  }

  // Realistic leaf creation function
  const createRealisticLeaf = (container, centerX, centerY, fallDistance, waveIndex = 0) => {
    const leaf = document.createElement("div")

    // Realistic leaf properties
    const size = 16 + Math.random() * 12 // Size between 16-28px
    const spreadX = (Math.random() - 0.5) * 180 // Horizontal spread from center
    const spreadY = (Math.random() - 0.5) * 60 // Vertical spread from center
    const startX = centerX + spreadX
    const startY = centerY + spreadY
    const duration = 6 + Math.random() * 4 + waveIndex * 0.3 // Longer duration 6-10s
    const rotation = Math.random() * 360
    const swayAmount = 80 + Math.random() * 100 // More pronounced sway for leaves
    const swayFrequency = 1.5 + Math.random() * 1.5 // Slower sway frequency

    // Realistic leaf colors (various green shades and autumn colors)
    const leafColors = [
      "#228B22", // Forest green
      "#32CD32", // Lime green
      "#90EE90", // Light green
      "#9ACD32", // Yellow green
      "#8FBC8F", // Dark sea green
      "#98FB98", // Pale green
      "#ADFF2F", // Green yellow
      "#7CFC00", // Lawn green
      "#00FF7F", // Spring green
      "#3CB371", // Medium sea green
    ]

    const autumnColors = [
      "#FF6347", // Tomato
      "#FF4500", // Orange red
      "#FFD700", // Gold
      "#FFA500", // Orange
      "#FF8C00", // Dark orange
      "#DAA520", // Goldenrod
    ]

    // Mix of green and autumn colors (80% green, 20% autumn)
    const colorPalette = Math.random() > 0.2 ? leafColors : autumnColors
    const leafColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    const leafColorDark = colorPalette[Math.floor(Math.random() * colorPalette.length)]

    // Create realistic leaf shape
    leaf.className = "cherry-leaf absolute"
    leaf.style.cssText = `
      width: ${size}px;
      height: ${size * 1.4}px;
      left: ${startX}px;
      top: ${startY}px;
      background: linear-gradient(135deg, ${leafColor} 0%, ${leafColorDark}dd 40%, ${leafColor}aa 100%);
      border-radius: 0% 100% 0% 100%;
      transform: rotate(${rotation}deg);
      opacity: 0.9;
      box-shadow: 
        0 2px 6px rgba(0, 100, 0, 0.3),
        inset 0 1px 3px rgba(255, 255, 255, 0.4),
        inset 0 -1px 2px rgba(0, 100, 0, 0.2),
        0 0 10px rgba(0, 150, 0, 0.15);
      filter: blur(0.1px) drop-shadow(0 1px 3px rgba(0, 100, 0, 0.2));
      z-index: 999;
      pointer-events: none;
      transition: all 0.1s ease-out;
    `

    // Add realistic leaf texture and veins
    leaf.innerHTML = `
      <div style="
        position: absolute;
        top: 10%;
        left: 20%;
        width: 60%;
        height: 80%;
        background: linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 30%, rgba(0,100,0,0.1) 100%);
        border-radius: 0% 100% 0% 100%;
        transform: rotate(-10deg);
      "></div>
      <div style="
        position: absolute;
        top: 20%;
        left: 50%;
        width: 1px;
        height: 60%;
        background: linear-gradient(to bottom, rgba(0,80,0,0.4) 0%, transparent 100%);
        transform: translateX(-50%);
      "></div>
      <div style="
        position: absolute;
        top: 35%;
        left: 30%;
        width: 40%;
        height: 1px;
        background: linear-gradient(to right, rgba(0,80,0,0.3) 0%, transparent 100%);
        transform: rotate(25deg);
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 30%;
        width: 35%;
        height: 1px;
        background: linear-gradient(to right, rgba(0,80,0,0.3) 0%, transparent 100%);
        transform: rotate(-25deg);
      "></div>
    `

    container.appendChild(leaf)

    // Enhanced realistic motion with leaf-specific physics
    const swayDirection = Math.random() > 0.5 ? 1 : -1
    const finalX = startX + swayAmount * swayDirection + (Math.random() - 0.5) * 120
    const finalRotation = rotation + 180 + Math.random() * 540 // Less rotation than petals

    // Apply enhanced realistic motion
    setTimeout(() => {
      leaf.style.transition = `all ${duration}s cubic-bezier(0.23, 1, 0.32, 1)`
      leaf.style.transform = `
        translateY(${fallDistance}px) 
        translateX(${finalX - startX}px) 
        rotate(${finalRotation}deg) 
        scale(0.7)
      `
      leaf.style.opacity = "0"
    }, 120)

    // Remove leaf after animation with cleanup
    setTimeout(
      () => {
        if (leaf.parentNode) {
          leaf.remove()
        }
      },
      duration * 1000 + 300,
    )
  }

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
                className="h-auto w-auto max-w-[200px] sm:max-w-[250px] md:max-w-[280px] lg:max-w-[320px] transition-all duration-500 group-hover:scale-105 animate-fade-in"
                priority
                sizes="(max-width: 640px) 250px, (max-width: 768px) 300px, (max-width: 1024px) 350px, 400px"
              />
              {/* Animated glow effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-lg blur-xl opacity-60 animate-pulse"
                aria-hidden="true"
              ></div>
              {/* Cherry blossom animation container */}
              <div
                className="absolute inset-0 overflow-visible cursor-pointer flex items-center justify-center"
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
                  const createMixedWave = (waveIndex, elementsInWave) => {
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
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
              <div className="bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 mb-4 text-lg">Explore our carefully crafted Japanese dishes</p>
                <Link
                  href="/menu"
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
          <div className="max-w-3xl mx-auto bg-black/20 p-8 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-serif mb-6">Choose your location to see available restaurants</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
              }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <div className="relative flex-1">
                  <label htmlFor="branch-select" className="sr-only">
                    Select Branch
                  </label>
                  <select
                    id="branch-select"
                    className="location-dropdown w-full py-3 px-4 pr-10 rounded-md text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold"
                    value={branch}
                    onChange={handleBranchChange}
                    onKeyDown={handleKeyDown}
                    aria-describedby="branch-help"
                  >
                    <option value="">Select Branch...</option>
                    <option value="dhaka">Dhaka</option>
                    <option value="chittagong">Chittagong</option>
                    <option value="sylhet">Sylhet</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"
                    size={20}
                    aria-hidden="true"
                  />
                  <div id="branch-help" className="sr-only">
                    Choose your preferred city branch
                  </div>
                </div>

                <div className="relative flex-1">
                  <label htmlFor="location-select" className="sr-only">
                    Select Location
                  </label>
                  <select
                    id="location-select"
                    className="location-dropdown w-full py-3 px-4 pr-10 rounded-md text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold"
                    value={location}
                    onChange={handleLocationChange}
                    onKeyDown={handleKeyDown}
                    aria-describedby="location-help"
                  >
                    <option value="">Select Location...</option>
                    <option value="gulshan">Gulshan</option>
                    <option value="banani">Banani</option>
                    <option value="dhanmondi">Dhanmondi</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"
                    size={20}
                    aria-hidden="true"
                  />
                  <div id="location-help" className="sr-only">
                    Choose your specific area location
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
                  Search for restaurants in your selected location
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

      {/* About Section */}
      <section className="py-20 bg-darkBg" aria-labelledby="about-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="about-heading" className="text-3xl md:text-4xl font-serif mb-2">
              About Us
            </h2>
            <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true"></div>
            <p className="text-gray-300 max-w-2xl mx-auto mt-6">
              Learn more about our restaurant and our commitment to providing the best Japanese dining experience.
            </p>
          </header>
        </div>
      </section>

      {/* Popular Menu Section */}
      <section className="py-20 bg-gradient-to-b from-darkBg to-black" aria-labelledby="menu-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="menu-heading" className="text-3xl md:text-4xl font-serif mb-2">
              Our Popular Menu
            </h2>
            <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true"></div>
            <p className="text-gray-300 max-w-2xl mx-auto mt-6">
              Discover our chef's selection of the most beloved dishes that have captivated our guests' palates.
            </p>
          </header>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
            aria-label="Popular menu items"
          >
            {menuItems}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/menu"
              className="inline-block book-table-btn px-8 py-3 text-gold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label="View our complete menu"
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-black" aria-labelledby="gallery-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="gallery-heading" className="text-3xl md:text-4xl font-serif mb-2">
              Our Gallery
            </h2>
            <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true"></div>
            <p className="text-gray-300 max-w-2xl mx-auto mt-6">
              Take a visual journey through our culinary creations and elegant dining spaces.
            </p>
          </header>

          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
            <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-serif mb-2">
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
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=1920&h=1080&auto=format&fit=crop&fm=webp')] opacity-20 bg-cover bg-center"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-serif mb-6">
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

      <style jsx global>{`
        .cherry-petal {
          animation-timing-function: ease-in-out;
          animation-fill-mode: forwards;
          will-change: transform, opacity;
          filter: blur(0.5px);
        }

        @keyframes float {
          0%, 100% {
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
