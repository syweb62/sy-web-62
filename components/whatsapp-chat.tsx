"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, Send, Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const RAW_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || ""
const PHONE = RAW_PHONE.replace(/\D/g, "") // keep digits only: supports +880, spaces, etc.
const WHATSAPP_MESSAGE_CODE = "J5JFSMILYBTQG1"

// Build a base link for opening your business chat
function getWhatsAppBaseLink() {
  if (PHONE) {
    // Direct chat without text; avoids "Forward to"
    return `https://api.whatsapp.com/send?phone=${PHONE}`
  }
  // Fallback to your short link if phone not set
  return `https://wa.me/message/${WHATSAPP_MESSAGE_CODE}`
}

// Build a message link that reliably supports prefilled text
function buildWhatsAppUrl(text: string) {
  const encoded = encodeURIComponent(text)
  if (PHONE) {
    // Direct chat with prefilled text; avoids "Forward to"
    return `https://api.whatsapp.com/send?phone=${PHONE}&text=${encoded}`
  }
  // Fallback (may show "Forward to" on some devices)
  return `https://api.whatsapp.com/send?text=${encoded}`
}

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000) // Show after 2 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  // Official Sushi yAki social media links
  const facebookLink = "https://www.facebook.com/yaki24sushipur"
  const instagramLink = "https://www.instagram.com/sushi_yaki_mohammadpur"

  const handleQuickMessage = (quickMsg: string) => {
    const url = buildWhatsAppUrl(quickMsg)
    window.open(url, "_blank")
    setIsOpen(false)
  }

  const handleCustomMessage = () => {
    if (message.trim()) {
      setIsSending(true)
      const url = buildWhatsAppUrl(message)
      window.open(url, "_blank")

      setTimeout(() => {
        setMessage("")
        setIsSending(false)
        setIsOpen(false)
      }, 500)
    }
  }

  const handleSocialLink = (platform: string) => {
    let url = ""
    switch (platform) {
      case "facebook":
        url = facebookLink
        break
      case "instagram":
        url = instagramLink
        break
      case "whatsapp":
        url = getWhatsAppBaseLink()
        break
    }
    if (url) {
      window.open(url, "_blank")
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window - Positioned independently to not affect button position */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300 w-[calc(100vw-1rem)] sm:w-72 max-w-[320px] z-40 mb-2 sm:mb-0">
          {/* Header */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-800">Sushi yAki Mohammadpur</h3>
                  <p className="text-xs text-gray-500">Live Support</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-full border border-gray-300 bg-white shadow-sm"
              >
                <X className="h-4 w-4 text-gray-700 hover:text-red-600" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 max-h-48 sm:max-h-64 overflow-y-auto">
            {/* Welcome Message */}
            <div className="mb-3">
              <div className="bg-gray-100 rounded-lg p-2 max-w-[90%]">
                <p className="text-xs text-gray-800">👋 Welcome to Sushi yAki Mohammadpur! How can we help?</p>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Follow Us</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSocialLink("facebook")}
                  className="flex-1 flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                  title="Follow us on Facebook"
                >
                  <Facebook className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                </button>
                <button
                  onClick={() => handleSocialLink("instagram")}
                  className="flex-1 flex items-center justify-center p-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors duration-200 group"
                  title="Follow us on Instagram"
                >
                  <Instagram className="h-4 w-4 text-pink-600 group-hover:text-pink-700" />
                </button>
                <button
                  onClick={() => handleSocialLink("whatsapp")}
                  className="flex-1 flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 sticky bottom-0">
            <div className="flex space-x-2 items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white text-gray-800 placeholder-gray-500 min-h-[40px]"
                onKeyPress={(e) => e.key === "Enter" && !isSending && handleCustomMessage()}
                disabled={isSending}
              />
              <Button
                onClick={handleCustomMessage}
                disabled={!message.trim() || isSending}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center transition-all duration-200"
                size="sm"
                title="Send message to WhatsApp"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {message.trim() ? "Click send to open WhatsApp with your message" : "WhatsApp • Sushi yAki Mohammadpur"}
            </p>
          </div>
        </div>
      )}

      {/* Live Chat Button - Always stays in same position with higher z-index */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 relative z-50"
      >
        <div className="relative">
          <Image
            src="/images/sushi-yaki-live-chat-transparent.png"
            alt="Sushi yAki Live Chat Support"
            width={114}
            height={91}
            className="w-[90px] h-[72px] sm:w-[98px] sm:h-[78px] md:w-[106px] md:h-[85px] lg:w-[114px] lg:h-[91px] drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 rounded-lg"
            priority
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />

          {/* Live status dot — hug the icon and never block clicks */}
          <div className="pointer-events-none absolute top-1 right-1 md:top-1 md:right-1">
            <div className="relative">
              {/* Outer pulsing ring (slightly larger than the solid dot) */}
              <div className="absolute w-4 h-4 rounded-full bg-green-400 opacity-70 animate-ping"></div>
              {/* Inner solid dot */}
              <div className="relative w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
