"use client"

import { useEffect } from "react"

type LinkAttrs = Partial<HTMLLinkElement> & {
  rel: string
  href?: string
}

function appendLinkOnce(id: string, attrs: LinkAttrs) {
  if (typeof document === "undefined") return
  if (document.getElementById(id)) return

  const link = document.createElement("link")
  link.id = id
  Object.entries(attrs).forEach(([key, value]) => {
    try {
      if (value !== undefined && value !== null) {
        // @ts-ignore - dynamic assignment for link attributes
        link[key] = value
      }
    } catch {
      // Fallback for attributes that must be set via setAttribute
      link.setAttribute(key, String(value))
    }
  })
  document.head.appendChild(link)
}

export function ResourceHints() {
  useEffect(() => {
    // DNS Prefetch and Preconnect for external domains
    appendLinkOnce("dns-unsplash", { rel: "dns-prefetch", href: "https://images.unsplash.com" })
    appendLinkOnce("preconnect-unsplash", { rel: "preconnect", href: "https://images.unsplash.com", crossOrigin: "" })

    appendLinkOnce("dns-randomuser", { rel: "dns-prefetch", href: "https://randomuser.me" })
    appendLinkOnce("preconnect-randomuser", { rel: "preconnect", href: "https://randomuser.me", crossOrigin: "" })

    appendLinkOnce("dns-fonts-googleapis", { rel: "dns-prefetch", href: "https://fonts.googleapis.com" })
    appendLinkOnce("preconnect-fonts-googleapis", { rel: "preconnect", href: "https://fonts.googleapis.com" })

    appendLinkOnce("dns-fonts-gstatic", { rel: "dns-prefetch", href: "https://fonts.gstatic.com" })
    appendLinkOnce("preconnect-fonts-gstatic", {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    })

    // Preload critical images
    // 1) Site logo (local)
    appendLinkOnce("preload-logo", {
      rel: "preload",
      as: "image",
      href: "/images/sushiyaki-logo.png",
      // @ts-ignore - some browsers use fetchpriority (lowercase)
      fetchpriority: "high",
      crossOrigin: "",
    })

    // 2) Hero background (used in CSS in .hero-section)
    appendLinkOnce("preload-hero-bg", {
      rel: "preload",
      as: "image",
      href: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1920&h=1080&auto=format&fit=crop",
      // @ts-ignore
      fetchpriority: "high",
      crossOrigin: "anonymous",
    })
  }, [])

  return null
}

export default ResourceHints
