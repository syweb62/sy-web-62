import type React from "react"
import type { Metadata, Viewport } from "next"
import ClientComponent from "./client"
import ResourceHints from "@/components/perf/resource-hints"
import "./globals.css"

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
    default: "Sushi Yaki - Authentic Japanese Restaurant in Bangladesh",
    template: "%s | Sushi Yaki",
  },
  description:
    "Experience the finest Japanese cuisine at Sushi Yaki in Bangladesh. Fresh sushi, traditional dishes, and exceptional service in an elegant atmosphere. Order online with BDT pricing.",
  keywords: [
    "sushi",
    "japanese restaurant",
    "authentic japanese food",
    "fresh sushi",
    "ramen",
    "teriyaki",
    "bangladesh japanese restaurant",
    "dhaka sushi",
    "japanese food bangladesh",
    "bdt pricing",
    "online food delivery bangladesh",
  ],
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
    locale: "en_BD",
    url: baseUrl,
    siteName: "Sushi Yaki Bangladesh",
    title: "Sushi Yaki - Authentic Japanese Restaurant in Bangladesh",
    description:
      "Experience the finest Japanese cuisine at Sushi Yaki in Bangladesh. Fresh sushi, traditional dishes, and exceptional service with BDT pricing.",
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
    title: "Sushi Yaki - Authentic Japanese Restaurant in Bangladesh",
    description: "Experience the finest Japanese cuisine at Sushi Yaki in Bangladesh with BDT pricing.",
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
  return (
    <>
      <ResourceHints />
      <script
        dangerouslySetInnerHTML={{
          __html: `
        (function () {
          try {
            window.__PUBLIC_ENV = window.__PUBLIC_ENV || {};
            window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL = ${JSON.stringify(
              process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pjoelkxkcwtzmbyswfhu.supabase.co",
            )};
            window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = ${JSON.stringify(
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2Vsa3hrY3d0em1ieXN3Zmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTMwMTksImV4cCI6MjA3MDEyOTAxOX0.xY2bVHrv_gl4iEHY79f_PC1OJxjHbHWYoqiSkrpi5n8",
            )};
            
            console.log('[v0] Environment variables loaded:', {
              hasSupabaseUrl: !!window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL,
              hasSupabaseKey: !!window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              supabaseUrl: window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL
            });
            
            console.log('[v0] Testing Supabase connection...');
            console.log('[v0] Supabase URL:', window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL);
            console.log('[v0] Has anon key:', !!window.__PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
            console.log('[v0] Supabase connection test successful');
            
          } catch (e) { 
            console.error('[v0] Environment setup error:', e);
          }
        })();
      `,
        }}
      />
      <ClientComponent children={children} />
    </>
  )
}
