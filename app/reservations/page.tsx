"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, Clock, Users, Phone, User } from "lucide-react"

export default function ReservationsPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    hour: "",
    minute: "",
    guests: 2,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const time = `${formData.hour}:${formData.minute}`

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          date: formData.date,
          time: time, // Use combined time
          guests: formData.guests,
        }),
      })

      if (response.ok) {
        setMessage("Reservation confirmed! We'll contact you soon.")
        setFormData({ name: "", phone: "", date: "", hour: "", minute: "", guests: 2 })
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || "Failed to make reservation. Please try again.")
      }
    } catch (error) {
      setMessage("Error making reservation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? Number.parseInt(value) : value,
    }))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-gold mb-2">Reserve Your Table</h1>
            <p className="text-gray-400 text-sm">Experience authentic Japanese cuisine</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Phone Number"
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                  <select
                    name="hour"
                    value={formData.hour}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">
                      Hour
                    </option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = String(i + 1).padStart(2, "0")
                      return (
                        <option key={hour} value={hour} className="bg-gray-900">
                          {hour} PM
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                  <select
                    name="minute"
                    value={formData.minute}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">
                      Minutes
                    </option>
                    <option value="00" className="bg-gray-900">
                      :00
                    </option>
                    <option value="30" className="bg-gray-900">
                      :30
                    </option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold w-5 h-5" />
                <input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  placeholder="Number of Guests"
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black py-4 rounded-lg font-medium hover:from-yellow-500 hover:to-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Confirming Reservation...
                </span>
              ) : (
                "Confirm Reservation"
              )}
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-center border ${
                message.includes("confirmed")
                  ? "bg-green-900/30 text-green-300 border-green-700"
                  : "bg-red-900/30 text-red-300 border-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
