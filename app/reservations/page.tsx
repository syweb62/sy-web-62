"use client"

import type React from "react"

import { useState } from "react"

export default function ReservationsPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

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
          time: formData.time,
          people_count: formData.guests,
        }),
      })

      if (response.ok) {
        setMessage("Reservation confirmed! We'll contact you soon.")
        setFormData({ name: "", phone: "", date: "", time: "", guests: 2 })
      } else {
        setMessage("Failed to make reservation. Please try again.")
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
    <div className="min-h-screen bg-darkBg text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gold text-center mb-8">Book a Table</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of Guests</label>
              <select
                name="guests"
                value={formData.guests}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-gold focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold text-black py-3 rounded font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Booking..." : "Book Table"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded text-center ${
                message.includes("confirmed") ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"
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
