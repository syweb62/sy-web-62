"use client"

import { MapPin, Phone, Clock } from 'lucide-react'

export default function Contact() {
  const handleLocationClick = () => {
    document.getElementById("live-map")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/message/J5JFSMILYBTQG1", "_blank")
  }

  const handleFacebookClick = () => {
    window.open("https://www.facebook.com/yaki24sushipur", "_blank")
  }

  const handleInstagramClick = () => {
    window.open("https://www.instagram.com/sushi_yaki_mohammadpur", "_blank")
  }

  const handlePhoneClick = () => {
    window.location.href = "tel:+8801234567890"
  }

  return (
    <div className="min-h-screen bg-darkBg py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4 text-white">Contact Us</h1>
          <div className="w-20 h-1 bg-gold mx-auto"></div>
        </div>

        {/* First Line - Essential Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Location */}
          <div
            onClick={handleLocationClick}
            className="bg-black/40 rounded-xl p-6 text-center cursor-pointer hover:bg-black/60 transition-all duration-300"
          >
            <MapPin className="text-gold mx-auto mb-3" size={24} />
            <h3 className="font-semibold text-white mb-2">Our Location</h3>
            <p className="text-gray-300 text-sm">123 Sushi Street, Gulshan</p>
          </div>

          {/* Phone */}
          <div
            onClick={handlePhoneClick}
            className="bg-black/40 rounded-xl p-6 text-center cursor-pointer hover:bg-black/60 transition-all duration-300"
          >
            <Phone className="text-gold mx-auto mb-3" size={24} />
            <h3 className="font-semibold text-white mb-2">Phone</h3>
            <p className="text-gray-300 text-sm">+880 1234 567890</p>
          </div>

          {/* Hours */}
          <div className="bg-black/40 rounded-xl p-6 text-center">
            <Clock className="text-gold mx-auto mb-3" size={24} />
            <h3 className="font-semibold text-white mb-2">Hours</h3>
            <p className="text-gray-300 text-sm">11:00 AM - 10:00 PM</p>
          </div>
        </div>

        {/* Second Line - Social Media (Enhanced Highlights) */}
        <div className="flex justify-center gap-4 mb-12">
          {/* WhatsApp */}
          <div
            onClick={handleWhatsAppClick}
            className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-full cursor-pointer hover:from-green-400 hover:to-green-600 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-500/60 ring-4 ring-green-500/20 hover:ring-green-400/40 flex items-center justify-center group"
            title="WhatsApp"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            <svg
              className="w-7 h-7 text-white relative z-10 group-hover:scale-110 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
            </svg>
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>

          {/* Facebook */}
          <div
            onClick={handleFacebookClick}
            className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full cursor-pointer hover:from-blue-400 hover:to-blue-600 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/60 ring-4 ring-blue-500/20 hover:ring-blue-400/40 flex items-center justify-center group"
            title="Facebook"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            <svg
              className="w-7 h-7 text-white relative z-10 group-hover:scale-110 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>

          {/* Instagram */}
          <div
            onClick={handleInstagramClick}
            className="relative w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full cursor-pointer hover:from-purple-400 hover:via-pink-400 hover:to-orange-400 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/60 ring-4 ring-purple-500/20 hover:ring-purple-400/40 flex items-center justify-center group"
            title="Instagram"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            <svg
              className="w-7 h-7 text-white relative z-10 group-hover:scale-110 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Live Map */}
        <div id="live-map" className="rounded-xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14602.254272231177!2d90.41279442466389!3d23.796339678132554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7a0f96fcc59%3A0x92c9a8c494f78f2a!2sGulshan%2C%20Dhaka%2C%20Bangladesh!5e0!3m2!1sen!2sus!4v1653047725179!5m2!1sen!2sus"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Sushi Yaki Location"
          />
        </div>
      </div>
    </div>
  )
}
