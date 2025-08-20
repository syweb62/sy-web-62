"use client"

import type React from "react"
import { Playfair_Display, Poppins } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import SmokeCursor from "@/components/smoke-cursor"
import ErrorBoundary from "@/components/error-boundary"
import ErrorFallback from "@/components/error-fallback"
import { AuthProvider } from "@/hooks/use-auth"
import { CartProvider } from "@/hooks/use-cart"
import { NotificationProvider } from "@/context/notification-context"
import { RestaurantInfoProvider } from "@/context/restaurant-info-context"
import { GlobalLoadingIndicator } from "@/components/global-loading-indicator"
import WhatsAppChat from "@/components/whatsapp-chat"
import { ScrollToTop } from "@/components/scroll-to-top"
import { TestTrigger } from "@/components/testing/test-trigger"
import { Suspense, useEffect } from "react"
import LoadingFallback from "@/components/loading-fallback"
import { performanceMonitor } from "@/lib/performance-monitor"
import { Toaster } from "sonner"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  fallback: ["serif"],
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  fallback: ["sans-serif"],
})

export default function ClientComponent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.init()

    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy()
    }
  }, [])

  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable} scroll-smooth`}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://randomuser.me" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://randomuser.me" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Mobile-specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sushi Yaki" />
        <meta name="msapplication-TileColor" content="#ffd700" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased touch-manipulation">
        <ErrorBoundary fallback={ErrorFallback}>
          <Suspense fallback={<LoadingFallback message="Loading application..." />}>
            <AuthProvider>
              <CartProvider>
                <NotificationProvider>
                  <RestaurantInfoProvider>
                    <SmokeCursor />
                    <GlobalLoadingIndicator />
                    <div className="flex flex-col min-h-screen min-h-[100dvh]">
                      {/* Skip to main content for accessibility */}
                      <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-gold text-black px-4 py-2 rounded z-50 touch-manipulation focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                      >
                        Skip to main content
                      </a>

                      <Suspense fallback={<div className="h-16 bg-slate-900" />}>
                        <Navbar />
                      </Suspense>

                      <main className="flex-1" id="main-content" role="main">
                        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
                      </main>

                      <Suspense fallback={<div className="h-32 bg-slate-900" />}>
                        <Footer />
                      </Suspense>
                    </div>

                    {/* Scroll to Top Button */}
                    <ScrollToTop />

                    {/* WhatsApp Chat Widget - Available on all pages */}
                    <WhatsAppChat
                      phoneNumber="+8801234567890"
                      message="Hello! I'm interested in ordering from Sushi Yaki."
                      businessName="Sushi Yaki"
                      supportText="সাহায্য লাগবে ?"
                    />

                    {/* Testing Dashboard Trigger */}
                    <TestTrigger />

                    {/* Toaster component for toast notifications */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        style: {
                          background: "rgb(17 24 39)",
                          border: "1px solid rgb(75 85 99)",
                          color: "rgb(243 244 246)",
                        },
                      }}
                      theme="dark"
                      richColors
                    />
                  </RestaurantInfoProvider>
                </NotificationProvider>
              </CartProvider>
            </AuthProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  )
}
