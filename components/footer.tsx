"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react"

const Footer = () => {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hide footer on cart page
  if (!mounted || pathname === "/cart") {
    return null
  }

  return (
    <footer className="bg-darkBg text-white py-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/sushiyaki-logo.png"
                alt="Sushi Yaki"
                width={60}
                height={36}
                className="h-auto w-auto"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Experience authentic Japanese cuisine with the finest ingredients and traditional preparation methods.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/sushiyaki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com/sushiyaki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://twitter.com/sushiyaki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-gold transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-gold transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-gray-300 hover:text-gold transition-colors text-sm">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/book" className="text-gray-300 hover:text-gold transition-colors text-sm">
                  Reservations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-gold transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-gold mt-1 flex-shrink-0" />
                <p className="text-gray-300 text-sm">
                  123 Sushi Street
                  <br />
                  Tokyo District, City 12345
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-gold flex-shrink-0" />
                <p className="text-gray-300 text-sm">+1 (555) 123-4567</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gold flex-shrink-0" />
                <p className="text-gray-300 text-sm">info@sushiyaki.com</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold">Opening Hours</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock size={16} className="text-gold flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p className="font-medium">Mon - Thu</p>
                  <p>11:30 AM - 10:00 PM</p>
                </div>
              </div>
              <div className="text-gray-300 text-sm ml-7">
                <p className="font-medium">Fri - Sat</p>
                <p>11:30 AM - 11:00 PM</p>
              </div>
              <div className="text-gray-300 text-sm ml-7">
                <p className="font-medium">Sunday</p>
                <p>12:00 PM - 9:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">© 2024 Sushi Yaki. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-gold transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-gold transition-colors text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
