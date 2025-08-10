"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, X, ShoppingCart, User, LogOut, Facebook, Instagram, MessageCircle, History } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { ImageFallback } from "@/components/image-fallback"
import { useScrollManager } from "@/lib/scroll-manager"

// Preload critical navigation routes
const preloadRoutes = ["/", "/about", "/menu", "/contact", "/blog"]

// Memoized navigation items for performance
const navigationItems = [
  { href: "/", label: "HOME", id: "home" },
  { href: "/about", label: "ABOUT US", id: "about" },
  { href: "/menu", label: "MENU", id: "menu" },
  { href: "/contact", label: "CONTACT US", id: "contact" },
  { href: "/blog", label: "BLOG", id: "blog" },
] as const

// Social media links with colorful styling
const socialMediaLinks = [
  {
    name: "Facebook",
    url: "https://facebook.com/sushiyaki",
    icon: Facebook,
    bgColor: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
    shadowColor: "shadow-blue-500/30",
  },
  {
    name: "WhatsApp",
    url: "https://wa.me/1234567890",
    icon: MessageCircle,
    bgColor: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    shadowColor: "shadow-green-500/30",
  },
  {
    name: "Instagram",
    url: "https://instagram.com/sushiyaki",
    icon: Instagram,
    bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    hoverColor: "hover:from-purple-600 hover:via-pink-600 hover:to-orange-500",
    shadowColor: "shadow-pink-500/30",
  },
]

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [menuReady, setMenuReady] = useState(false)
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 })
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const { cartItems, totalItems } = useCart()
  const { user, signOut } = useAuth()
  const scrollManager = useScrollManager()
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const navigationEndRef = useRef<(() => void) | null>(null)
  const cleanupFunctionsRef = useRef<(() => void)[]>([])

  // Dynamic logo dimensions based on screen size and orientation
  const logoConfig = useMemo(() => {
    const { width, height } = screenDimensions

    // Default config - adjusted for the new logo aspect ratio
    // Slightly larger mobile logo for the mobile overlay menu only
    let config = {
      navbar: { width: 110, height: 44 },
      mobile: { width: 98, height: 38 }, // was 90 x 36
      skeleton: { width: 110, height: 44 },
    }

    if (width === 0) return config // Initial state

    // Portrait orientation adjustments
    if (orientation === "portrait") {
      if (width <= 320) {
        // Very small phones
        config = {
          navbar: { width: 80, height: 32 },
          mobile: { width: 78, height: 31 }, // was 70 x 28
          skeleton: { width: 80, height: 32 },
        }
      } else if (width <= 375) {
        // Small phones
        config = {
          navbar: { width: 90, height: 36 },
          mobile: { width: 88, height: 35 }, // was 80 x 32
          skeleton: { width: 90, height: 36 },
        }
      } else if (width <= 414) {
        // Medium phones
        config = {
          navbar: { width: 100, height: 40 },
          mobile: { width: 96, height: 38 }, // was 85 x 34
          skeleton: { width: 100, height: 40 },
        }
      } else if (width <= 768) {
        // Large phones and small tablets
        config = {
          navbar: { width: 110, height: 44 },
          mobile: { width: 104, height: 42 }, // was 90 x 36
          skeleton: { width: 110, height: 44 },
        }
      }
    } else {
      // Landscape orientation adjustments
      if (width <= 667) {
        // Small phones in landscape
        config = {
          navbar: { width: 70, height: 28 },
          mobile: { width: 66, height: 26 }, // was 60 x 24
          skeleton: { width: 70, height: 28 },
        }
      } else if (width <= 736) {
        // Medium phones in landscape
        config = {
          navbar: { width: 80, height: 32 },
          mobile: { width: 78, height: 31 }, // was 70 x 28
          skeleton: { width: 80, height: 32 },
        }
      } else if (width <= 1024) {
        // Large phones and tablets in landscape
        config = {
          navbar: { width: 100, height: 40 },
          mobile: { width: 92, height: 37 }, // was 85 x 34
          skeleton: { width: 100, height: 40 },
        }
      }
    }

    return config
  }, [screenDimensions, orientation])

  // Update screen dimensions and orientation
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setScreenDimensions({ width, height })
      setOrientation(width > height ? "landscape" : "portrait")
    }

    updateDimensions()

    const handleResize = () => updateDimensions()
    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 100) // Delay to ensure orientation change is complete
    }

    window.addEventListener("resize", handleResize, { passive: true })
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true })

    cleanupFunctionsRef.current.push(() => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
    })

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
    }
  }, [])

  // Optimized close menu function with immediate state reset
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)

    // Immediate style reset for better performance
    const body = document.body
    body.style.overflow = ""
    body.style.position = ""
    body.style.width = ""
    body.style.height = ""
    body.style.top = ""
    body.classList.remove("mobile-menu-open")
  }, [])

  // Enhanced navigation handler with scroll reset
  const handleNavigation = useCallback(
    (href: string) => {
      // Don't navigate if already on the same page
      if (pathname === href) {
        closeMenu()
        // Still scroll to top even if on same page
        scrollManager.scrollToTop(true)
        return
      }

      setIsNavigating(true)

      // Start global loading indicator if available
      if (typeof window !== "undefined" && (window as any).startNavigation) {
        navigationEndRef.current = (window as any).startNavigation()
      }

      // Close menu first
      closeMenu()

      // Handle navigation with scroll reset
      scrollManager.handleNavigation(href, true)

      // Use Next.js router for client-side navigation
      const timeoutId = setTimeout(() => {
        router.push(href)
      }, 50)

      cleanupFunctionsRef.current.push(() => clearTimeout(timeoutId))
    },
    [closeMenu, pathname, router, scrollManager],
  )

  // Reset navigation state when route changes
  useEffect(() => {
    setIsNavigating(false)

    // Ensure we're at the top after navigation
    const timer = setTimeout(() => {
      scrollManager.scrollToTop(false)
    }, 100)

    // Clean up navigation end callback
    if (navigationEndRef.current) {
      navigationEndRef.current()
      navigationEndRef.current = null
    }

    cleanupFunctionsRef.current.push(() => clearTimeout(timer))

    return () => clearTimeout(timer)
  }, [pathname, scrollManager])

  // Memoized toggle functions
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
    setMenuReady(true)
  }, [])

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev)
  }, [])

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 50
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled)
    }
  }, [isScrolled])

  // Throttled scroll event
  useEffect(() => {
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", throttledScroll, { passive: true })

    cleanupFunctionsRef.current.push(() => {
      window.removeEventListener("scroll", throttledScroll)
    })

    return () => window.removeEventListener("scroll", throttledScroll)
  }, [handleScroll])

  // Optimized outside click handler
  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(target)
      ) {
        closeMenu()
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false)
      }
    },
    [closeMenu],
  )

  // Optimized keyboard handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu()
        setIsUserMenuOpen(false)
      }
    },
    [closeMenu],
  )

  // Optimized resize handler
  const handleResize = useCallback(() => {
    if (window.innerWidth >= 1024) {
      closeMenu()
    }
  }, [closeMenu])

  // Event listeners with cleanup
  useEffect(() => {
    const handleOutsideClickPassive = (e: MouseEvent) => handleOutsideClick(e)
    const handleKeyDownPassive = (e: KeyboardEvent) => handleKeyDown(e)
    const handleResizePassive = () => handleResize()

    document.addEventListener("mousedown", handleOutsideClickPassive, { passive: true })
    document.addEventListener("keydown", handleKeyDownPassive)
    window.addEventListener("resize", handleResizePassive, { passive: true })

    cleanupFunctionsRef.current.push(() => {
      document.removeEventListener("mousedown", handleOutsideClickPassive)
      document.removeEventListener("keydown", handleKeyDownPassive)
      window.removeEventListener("resize", handleResizePassive)
    })

    return () => {
      document.removeEventListener("mousedown", handleOutsideClickPassive)
      document.removeEventListener("keydown", handleKeyDownPassive)
      window.removeEventListener("resize", handleResizePassive)
    }
  }, [handleOutsideClick, handleKeyDown, handleResize])

  // Preload critical routes on component mount
  useEffect(() => {
    const preloadLinks = () => {
      preloadRoutes.forEach((route) => {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = route
        document.head.appendChild(link)
      })
    }

    // Preload after initial render
    const timer = setTimeout(preloadLinks, 100)
    cleanupFunctionsRef.current.push(() => clearTimeout(timer))

    return () => clearTimeout(timer)
  }, [])

  // Optimized loading state management
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    cleanupFunctionsRef.current.push(() => clearTimeout(timer))

    return () => clearTimeout(timer)
  }, [])

  // Focus management for accessibility
  useEffect(() => {
    if (isMenuOpen && menuRef.current && menuReady) {
      const focusableElements = menuRef.current.querySelectorAll('button[type="button"]:not([disabled])')
      const firstElement = focusableElements[0] as HTMLElement

      if (firstElement) {
        requestAnimationFrame(() => {
          firstElement.focus()
        })
      }
    }
  }, [isMenuOpen, menuReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const body = document.body
      body.style.overflow = ""
      body.style.position = ""
      body.style.width = ""
      body.style.height = ""
      body.classList.remove("mobile-menu-open")

      // Clean up navigation end callback
      if (navigationEndRef.current) {
        navigationEndRef.current()
      }

      // Run all cleanup functions
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup())
      cleanupFunctionsRef.current = []
    }
  }, [])

  // Memoized user display name
  const userDisplayName = useMemo(() => {
    return user?.name || user?.full_name?.split(" ")[0] || "User"
  }, [user?.name, user?.full_name])

  // Dynamic navbar height based on orientation
  const navbarHeight = orientation === "landscape" && screenDimensions.width <= 736 ? 54 : 76
  const contentHeight = navbarHeight - 24 // Accounting for padding

  // Optimized loading skeleton
  if (isLoading) {
    return (
      <header
        className="fixed w-full z-50 bg-darkBg/95 backdrop-blur-md"
        style={{
          height: `${navbarHeight}px`,
          minHeight: `${navbarHeight}px`,
          padding: "12px 16px",
        }}
      >
        <div className="section-container flex justify-between items-center h-full">
          <div
            className="bg-gray-700/50 animate-pulse rounded"
            style={{
              height: `${logoConfig.skeleton.height}px`,
              width: `${logoConfig.skeleton.width}px`,
            }}
          />
          <div className="flex gap-3">
            <div className="bg-gray-700/50 animate-pulse rounded-full" style={{ height: "48px", width: "48px" }} />
            <div className="bg-gray-700/50 animate-pulse rounded-full" style={{ height: "48px", width: "48px" }} />
            <div className="bg-gray-700/50 animate-pulse rounded-full" style={{ height: "48px", width: "48px" }} />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`navbar-container fixed w-full z-[100] transition-all duration-300 ${
        isScrolled ? "bg-darkBg/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
      style={{
        height: `${navbarHeight}px`,
        minHeight: `${navbarHeight}px`,
        maxHeight: `${navbarHeight}px`,
        padding: "12px 16px",
      }}
      role="banner"
    >
      <div
        className="section-container flex justify-between items-center h-full"
        style={{
          height: `${contentHeight}px`,
          minHeight: `${contentHeight}px`,
          maxHeight: `${contentHeight}px`,
        }}
      >
        {/* Logo with responsive dimensions */}
        <Link href="/" className="relative z-10 flex items-center touch-manipulation" aria-label="Sushi Yaki Home">
          <div
            className="relative logo-container flex items-center justify-center"
            style={{
              height: `${logoConfig.navbar.height}px`,
              width: `${logoConfig.navbar.width}px`,
              minHeight: `${logoConfig.navbar.height}px`,
              minWidth: `${logoConfig.navbar.width}px`,
            }}
          >
            <Image
              src="/images/sushiyaki-logo.png"
              alt="Sushi Yaki - すしやき Restaurant Logo"
              width={logoConfig.navbar.width}
              height={logoConfig.navbar.height}
              className="h-auto w-auto object-contain transition-all duration-300 hover:scale-105"
              style={{
                maxHeight: `${logoConfig.navbar.height}px`,
                maxWidth: `${logoConfig.navbar.width}px`,
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
              }}
              priority
              loading="eager"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div
                className="absolute inset-0 bg-gray-700/30 animate-pulse rounded"
                style={{
                  height: `${logoConfig.navbar.height}px`,
                  width: `${logoConfig.navbar.width}px`,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8" role="navigation" aria-label="Main navigation">
          {navigationItems.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link relative transition-all duration-300 py-2 px-3 rounded-md ${
                  isActive
                    ? "text-gold bg-gold/10 shadow-lg shadow-gold/20 border border-gold/30"
                    : "text-white hover:text-gold hover:bg-white/5 hover:shadow-md"
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigation(href)
                }}
              >
                {label}
              </Link>
            )
          })}

          <div className="h-6 w-px bg-white/30 mx-2" aria-hidden="true"></div>

          {/* Cart Icon with Counter */}
          <Link
            href="/cart"
            className="relative p-2.5 touch-manipulation"
            aria-label={`Shopping cart with ${totalItems} items`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation("/cart")
            }}
          >
            <ShoppingCart className="text-white group-hover:text-gold transition-colors duration-200" size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-black text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* User Account */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 text-white hover:text-gold transition-colors duration-200 p-2 touch-manipulation"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label={`User menu for ${user.name}`}
              >
                <span className="hidden xl:inline-block text-sm">{userDisplayName}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-gold transition-colors">
                  <ImageFallback
                    src={user?.avatar_url || user?.avatar || "/placeholder.svg"}
                    alt={`${user.name || user.full_name || "User"} profile picture`}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    fallbackIcon={<User size={20} />}
                  />
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-darkBg/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/account/profile"
                    className="block px-4 py-3 text-sm text-white hover:bg-black/30 hover:text-gold transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsUserMenuOpen(false)
                      handleNavigation("/account/profile")
                    }}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-3 text-sm text-white hover:bg-black/30 hover:text-gold transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsUserMenuOpen(false)
                      handleNavigation("/account/orders")
                    }}
                  >
                    Order History
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setIsUserMenuOpen(false)
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-white hover:bg-black/30 hover:text-gold transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="text-white hover:text-gold flex items-center gap-2 p-2 touch-manipulation transition-colors duration-200"
              aria-label="Sign in to your account"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("/signin")
              }}
            >
              <User size={18} />
              <span className="hidden xl:inline">SIGN IN</span>
            </Link>
          )}

          <Link
            href="/book"
            className="book-table-btn px-4 py-2 text-gold uppercase tracking-wider border-2 border-gold hover:bg-gold hover:text-black transition-all duration-200 rounded touch-manipulation"
            aria-label="Book a table at Sushi Yaki"
            onClick={(e) => {
              e.preventDefault()
              handleNavigation("/book")
            }}
          >
            Book a Table
          </Link>
        </nav>

        {/* Mobile Navigation Icons */}
        <div className="flex items-center gap-2.5 lg:hidden">
          {/* Cart Icon with Counter */}
          <Link
            href="/cart"
            className="relative p-2.5 touch-manipulation"
            aria-label={`Shopping cart with ${totalItems} items`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation("/cart")
            }}
          >
            <ShoppingCart className="text-white hover:text-gold transition-colors duration-200" size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-black text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Order History */}
          <Link
            href="/account/orders"
            className="text-white hover:text-gold p-2.5 touch-manipulation transition-colors duration-200"
            aria-label="View order history"
            onClick={(e) => {
              e.preventDefault()
              handleNavigation("/account/orders")
            }}
          >
            <History size={22} />
          </Link>

          {/* User Account (show avatar on mobile when logged in) */}
          <Link
            href={user ? "/account/profile" : "/signin"}
            className="text-white hover:text-gold p-2.5 touch-manipulation transition-colors duration-200"
            aria-label={user ? `Go to ${userDisplayName}'s profile` : "Sign in to your account"}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation(user ? "/account/profile" : "/signin")
            }}
          >
            {user ? (
              <div
                className="w-7 h-7 rounded-full overflow-hidden border border-white/20 hover:border-gold transition-colors duration-200"
                aria-hidden="false"
              >
                <ImageFallback
                  src={user?.avatar_url || user?.avatar || "/placeholder.svg"}
                  alt={`${userDisplayName} profile picture`}
                  width={28}
                  height={28}
                  className="w-7 h-7 object-cover rounded-full"
                  fallbackIcon={<User size={22} />}
                />
              </div>
            ) : (
              <User size={22} />
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            className="text-white z-20 p-2.5 touch-manipulation transition-colors duration-200 hover:text-gold"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="true"
            disabled={isNavigating}
          >
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation Menu with responsive logo */}
        {isMenuOpen && (
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/95 backdrop-blur-md z-[9999] lg:hidden"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              overflow: "hidden",
              willChange: "transform, opacity",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={closeMenu}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Menu Content Container */}
            <div
              className="flex flex-col items-center justify-center w-full h-full px-4"
              onClick={(e) => e.stopPropagation()}
              ref={menuRef}
              style={{
                willChange: "transform",
                animation: "slideIn 0.3s ease-out",
              }}
            >
              {/* Close Button */}
              <button
                onClick={closeMenu}
                className="absolute top-6 right-6 text-white hover:text-gold z-[10000] p-2 transition-colors duration-200"
                aria-label="Close menu"
                disabled={isNavigating}
              >
                <X size={26} />
              </button>

              {/* Responsive Logo in Mobile Menu */}
              <div
                className="absolute top-6 left-6 z-[10000] flex items-center justify-center"
                style={{
                  height: `${logoConfig.mobile.height}px`,
                  width: `${logoConfig.mobile.width}px`,
                }}
              >
                <Image
                  src="/images/sushiyaki-logo.png"
                  alt="Sushi Yaki - すしやき Restaurant Logo"
                  width={logoConfig.mobile.width}
                  height={logoConfig.mobile.height}
                  className="h-auto w-auto object-contain"
                  style={{
                    maxHeight: `${logoConfig.mobile.height}px`,
                    maxWidth: `${logoConfig.mobile.width}px`,
                    animation: "fadeIn 0.5s ease-out 0.2s both",
                  }}
                />
              </div>

              {/* Navigation Links - Reduced text size */}
              <nav
                className="flex flex-col items-center gap-4 w-full max-w-sm"
                role="navigation"
                aria-label="Mobile navigation"
              >
                {navigationItems.map(({ href, label, id }, index) => {
                  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
                  return (
                    <button
                      key={id}
                      onClick={() => handleNavigation(href)}
                      className={`text-[15px] font-medium transition-all duration-300 py-3.5 px-5 w-full text-center border rounded-lg touch-manipulation disabled:opacity-50 relative ${
                        isActive
                          ? "text-gold bg-gold/15 border-gold/40 shadow-lg shadow-gold/25"
                          : "text-white hover:text-gold hover:bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                      disabled={isNavigating}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: "slideInUp 0.3s ease-out both",
                      }}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {isNavigating ? (
                        <span className="flex items-center justify-center gap-2">
                          <span
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            aria-hidden="true"
                          ></span>
                          {label}
                        </span>
                      ) : (
                        <>{label}</>
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Action Buttons - Reduced text size */}
              <div className="flex flex-col items-center gap-4 mt-8">
                <button
                  onClick={() => handleNavigation("/book")}
                  className="px-5 py-2.5 text-gold text-[15px] uppercase tracking-wider border-2 border-gold hover:bg-gold hover:text-black transition-all duration-200 rounded touch-manipulation disabled:opacity-50"
                  disabled={isNavigating}
                  style={{
                    animationDelay: "300ms",
                    animation: "slideInUp 0.3s ease-out both",
                  }}
                  aria-label="Book a table at Sushi Yaki"
                >
                  {isNavigating ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin"
                        aria-hidden="true"
                      ></span>
                      Book a Table
                    </span>
                  ) : (
                    "Book a Table"
                  )}
                </button>
              </div>

              {/* Colorful Social Media Icons */}
              <div className="flex items-center gap-3 mt-6">
                {socialMediaLinks.map(({ name, url, icon: Icon, bgColor, hoverColor, shadowColor }, index) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${bgColor} ${hoverColor} text-white p-3 rounded-full shadow-lg ${shadowColor} transition-all duration-300 transform hover:scale-110 hover:shadow-xl touch-manipulation`}
                    aria-label={`Follow us on ${name}`}
                    style={{
                      animationDelay: `${400 + index * 50}ms`,
                      animation: "slideInUp 0.3s ease-out both",
                    }}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>

              {/* Social Media Text */}
              <p
                className="text-white/70 text-sm mt-2 font-medium"
                style={{
                  animationDelay: "500ms",
                  animation: "slideInUp 0.3s ease-out both",
                }}
              >
                Follow us on social media
              </p>

              {user && (
                <button
                  onClick={() => {
                    signOut()
                    closeMenu()
                  }}
                  className="flex items-center gap-3 text-white hover:text-gold text-[15px] touch-manipulation transition-colors duration-200 disabled:opacity-50 mt-4"
                  disabled={isNavigating}
                  style={{
                    animationDelay: "550ms",
                    animation: "slideInUp 0.3s ease-out both",
                  }}
                  aria-label="Sign out of your account"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CSS Animations and Responsive Styles */}
      <style jsx>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes slideInUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Responsive logo adjustments */
    .logo-container {
      transition: all 0.3s ease-in-out;
    }

    /* Portrait orientation specific styles */
    @media screen and (orientation: portrait) {
      @media (max-width: 320px) {
        .navbar-container {
          height: 70px !important;
          min-height: 70px !important;
        }
      }
      
      @media (max-width: 375px) {
        .navbar-container {
          height: 75px !important;
          min-height: 75px !important;
        }
      }
    }

    /* Landscape orientation specific styles */
    @media screen and (orientation: landscape) {
      @media (max-height: 500px) {
        .navbar-container {
          height: 60px !important;
          min-height: 60px !important;
        }
        
        .logo-container img {
          transform: scale(0.9);
        }
      }
      
      @media (max-height: 400px) {
        .navbar-container {
          height: 50px !important;
          min-height: 50px !important;
        }
        
        .logo-container img {
          transform: scale(0.8);
        }
      }
    }

    /* High DPI displays */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .logo-container img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
    }

    /* Touch device optimizations */
    @media (hover: none) and (pointer: coarse) {
      .logo-container {
        touch-action: manipulation;
      }
    }

    /* Remove focus outlines for navigation links */
    .nav-link:focus,
    .book-table-btn:focus {
      outline: none;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .logo-container,
      .nav-link,
      .book-table-btn {
        transition: none;
      }
      
      .animate-pulse,
      .animate-spin {
        animation: none;
      }
    }
  `}</style>
    </header>
  )
}

export default Navbar
