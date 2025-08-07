import type React from "react"
import type { Metadata, Viewport } from "next"
import ClientComponent from "./client"

// Helper function to get a valid base URL
function getBaseUrl(): string {
  // In production, use VERCEL_URL or custom domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback to NEXT_PUBLIC_BASE_URL if set and valid
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl && baseUrl.startsWith("http")) {
    return baseUrl
  }

  // Development fallback
  return "http://localhost:3000"
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0f14" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f14" },
  ],
  colorScheme: "dark",
}

const baseUrl = getBaseUrl()

export const metadata: Metadata = {
  title: {
    default: "Sushi Yaki - Authentic Japanese Restaurant",
    template: "%s | Sushi Yaki",
  },
  description:
    "Experience the finest Japanese cuisine at Sushi Yaki. Fresh sushi, traditional dishes, and exceptional service in an elegant atmosphere.",
  keywords: ["sushi", "japanese restaurant", "authentic japanese food", "fresh sushi", "ramen", "teriyaki"],
  authors: [{ name: "Sushi Yaki Restaurant" }],
  creator: "Sushi Yaki",
  publisher: "Sushi Yaki",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Sushi Yaki",
    title: "Sushi Yaki - Authentic Japanese Restaurant",
    description:
      "Experience the finest Japanese cuisine at Sushi Yaki. Fresh sushi, traditional dishes, and exceptional service.",
    images: [
      {
        url: "/images/sushiyaki-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sushi Yaki Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sushi Yaki - Authentic Japanese Restaurant",
    description: "Experience the finest Japanese cuisine at Sushi Yaki.",
    images: ["/images/sushiyaki-og-image.jpg"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  generator: "Next.js",
  applicationName: "Sushi Yaki",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientComponent children={children} />
}


import './globals.css'
