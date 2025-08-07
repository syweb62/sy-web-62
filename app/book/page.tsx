"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Clock, Users, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LocationData } from "@/hooks/use-location"

export default function BookTable() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    specialRequests: "",
    location: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Special validation for guests field
    if (name === "guests") {
      const numValue = Number.parseInt(value)
      if (value === "" || (numValue > 0 && numValue <= 20)) {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationUpdate = (location: LocationData) => {
    setFormData((prev) => ({
      ...prev,
      location: location.address || `${location.latitude}, ${location.longitude}`,
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "") // Remove non-digits
    if (value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Format phone number with Bangladesh country code
    const cleanPhone = formData.phone.replace(/\D/g, "").slice(-10) // Get last 10 digits only
    const formattedData = {
      ...formData,
      phone: `+880${cleanPhone}`,
    }

    // Simulate API call with formatted data
    console.log("Submitting reservation:", formattedData)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)

    // Reset form after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: "",
        specialRequests: "",
        location: "",
      })
    }, 5000)
  }

  if (isSubmitted) {
    return (
      <>
        {/* Hero Section */}
        <section className="hero-section min-h-[40vh] flex items-center justify-center relative">
          <div className="container mx-auto px-4 text-center z-10 pt-20">
            <div className="max-w-2xl mx-auto">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Reservation Confirmed!</h1>
              <p className="text-lg text-gray-200 mb-8">
                Thank you for your reservation. We've sent a confirmation email with all the details.
              </p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" size="lg">
                Make Another Reservation
              </Button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-[40vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Book a Table</h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            Reserve your table at Sushi Yaki and experience the finest Japanese cuisine in an elegant atmosphere.
          </p>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/30 rounded-lg border border-gray-800 p-8">
              <h2 className="text-2xl font-serif mb-8 text-center">Make a Reservation</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Essential Information - Simplified Layout */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gold mb-4">Your Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      label="Name"
                      required
                      leftIcon={<Mail className="w-4 h-4" />}
                      className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold"
                    />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      label="Email"
                      required
                      leftIcon={<Mail className="w-4 h-4" />}
                      className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium pointer-events-none z-10">
                        +880
                      </div>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="1234567890"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold pl-16 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        maxLength={10}
                        pattern="[0-9]{10}"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Enter your 10-digit mobile number (without country code)</p>
                  </div>
                </div>

                {/* Reservation Details - Enhanced UI */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gold mb-4">Reservation Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        <Calendar className="inline w-4 h-4 mr-2 text-gold" />
                        Date
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        <Clock className="inline w-4 h-4 mr-2 text-gold" />
                        Time
                      </label>
                      <Select onValueChange={(value) => handleSelectChange("time", value)} required>
                        <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {[
                            "17:00",
                            "17:30",
                            "18:00",
                            "18:30",
                            "19:00",
                            "19:30",
                            "20:00",
                            "20:30",
                            "21:00",
                            "21:30",
                          ].map((time) => (
                            <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                              {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        <Users className="inline w-4 h-4 mr-2 text-gold" />
                        Number of Guests
                      </label>
                      <Input
                        type="number"
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        placeholder="Enter number of guests"
                        required
                        min="1"
                        max="20"
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold"
                      />
                      <p className="text-xs text-gray-400">Maximum 20 guests per reservation</p>
                    </div>
                  </div>
                </div>

                {/* Optional Details - Collapsible */}
                <div className="space-y-4">
                  <details className="group">
                    <summary className="cursor-pointer text-gold hover:text-yellow-300 transition-colors duration-200 flex items-center gap-2">
                      <span className="text-sm font-medium">Additional Options (Optional)</span>
                      <svg
                        className="w-4 h-4 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>

                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-gold/30">
                      {/* Special Requests */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Special Requests</label>
                        <Textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleInputChange}
                          placeholder="Dietary restrictions, allergies, special occasions..."
                          rows={3}
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold/50 focus:border-gold bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </details>
                </div>

                {/* Enhanced Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-black font-semibold py-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gold/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Reserve Your Table
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    We'll send you a confirmation email with all the details
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
