'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Send, Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000) // Show after 2 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  // Official Sushi yAki social media links
  const whatsappLink = "https://wa.me/message/J5JFSMILYBTQG1"
  const facebookLink = "https://www.facebook.com/yaki24sushipur"
  const instagramLink = "https://www.instagram.com/sushi_yaki_mohammadpur"

  const handleQuickMessage = (quickMsg: string) => {
    const url = `${whatsappLink}?text=${encodeURIComponent(quickMsg)}`
    window.open(url, '_blank')
    setIsOpen(false)
  }

  const handleCustomMessage = () => {
    if (message.trim()) {
      const url = `${whatsappLink}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
      setMessage('')
      setIsOpen(false)
    }
  }

  const handleSocialLink = (platform: string) => {
    let url = ''
    switch (platform) {
      case 'facebook':
        url = facebookLink
        break
      case 'instagram':
        url = instagramLink
        break
      case 'whatsapp':
        url = whatsappLink
        break
    }
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window - Positioned independently to not affect button position */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300 w-64 sm:w-72 max-w-[calc(100vw-2rem)] z-40">
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
          <div className="p-3 max-h-64 overflow-y-auto">
            {/* Welcome Message */}
            <div className="mb-3">
              <div className="bg-gray-100 rounded-lg p-2 max-w-[90%]">
                <p className="text-xs text-gray-800">
                  👋 Welcome to Sushi yAki Mohammadpur! How can we help?
                </p>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Follow Us</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSocialLink('facebook')}
                  className="flex-1 flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                  title="Follow us on Facebook"
                >
                  <Facebook className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                </button>
                <button
                  onClick={() => handleSocialLink('instagram')}
                  className="flex-1 flex items-center justify-center p-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors duration-200 group"
                  title="Follow us on Instagram"
                >
                  <Instagram className="h-4 w-4 text-pink-600 group-hover:text-pink-700" />
                </button>
                <button
                  onClick={() => handleSocialLink('whatsapp')}
                  className="flex-1 flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomMessage()}
              />
              <Button
                onClick={handleCustomMessage}
                disabled={!message.trim()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg disabled:opacity-50"
                size="sm"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              WhatsApp • Sushi yAki Mohammadpur
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
            width={100}
            height={80}
            className="w-20 h-16 sm:w-22 sm:h-17 md:w-24 md:h-19 lg:w-26 lg:h-20 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 rounded-lg"
            priority
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          
          {/* Single Live Dot Indicator */}
          <div className="absolute -top-1 -right-1">
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
              {/* Inner solid dot */}
              <div className="relative w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
