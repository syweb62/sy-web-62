"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ExternalLink, Home } from "lucide-react"
import Link from "next/link"

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  link?: string
  action?: string
}

export default function FinalChecklistPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "database",
      title: "Database Setup",
      description: "All tables created and sample data loaded",
      completed: true,
    },
    {
      id: "menu",
      title: "Menu System",
      description: "Test menu items, categories, and availability filter",
      completed: false,
      link: "/menu",
      action: "Test Menu",
    },
    {
      id: "cart",
      title: "Shopping Cart",
      description: "Test adding items, quantity changes, and checkout",
      completed: false,
      link: "/cart",
      action: "Test Cart",
    },
    {
      id: "auth",
      title: "User Authentication",
      description: "Test sign up, sign in, and user profiles",
      completed: false,
      link: "/signin",
      action: "Test Auth",
    },
    {
      id: "booking",
      title: "Table Reservations",
      description: "Test table booking system",
      completed: false,
      link: "/book",
      action: "Test Booking",
    },
    {
      id: "contact",
      title: "Contact & Social",
      description: "Verify contact information and social media links",
      completed: false,
      link: "/contact",
      action: "Check Contact",
    },
    {
      id: "responsive",
      title: "Mobile Responsiveness",
      description: "Test website on mobile devices",
      completed: false,
      action: "Test Mobile",
    },
    {
      id: "customize",
      title: "Customize Content",
      description: "Update restaurant info, menu items, and prices",
      completed: false,
      action: "Customize",
    },
  ])

  const toggleComplete = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const completedCount = checklist.filter((item) => item.completed).length
  const totalCount = checklist.length
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎉 Website Launch Checklist</h1>
          <p className="text-gray-400 mb-6">
            Your Sushi Yaki restaurant website is almost ready! Complete these final steps.
          </p>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Progress</span>
              <span className="text-gold">
                {completedCount}/{totalCount} Complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gold h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <Link href="/">
            <Button className="bg-gold text-black hover:bg-gold/90 mb-8">
              <Home className="mr-2 h-4 w-4" />
              View Your Website
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {checklist.map((item) => (
            <Card key={item.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleComplete(item.id)} className="text-2xl">
                      {item.completed ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : (
                        <Circle className="text-gray-400" size={24} />
                      )}
                    </button>
                    <div>
                      <CardTitle className={item.completed ? "line-through text-gray-500" : ""}>{item.title}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>

                  {item.link && (
                    <Link href={item.link}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {item.action}
                      </Button>
                    </Link>
                  )}

                  {item.id === "responsive" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        alert("Open your website on your phone or use browser dev tools (F12) to test mobile view")
                        toggleComplete("responsive")
                      }}
                    >
                      Test Mobile
                    </Button>
                  )}

                  {item.id === "customize" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open("https://supabase.com/dashboard/project/pjoelkxkcwtzmbyswfhu", "_blank")
                        toggleComplete("customize")
                      }}
                    >
                      Open Database
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {completedCount === totalCount && (
          <Card className="bg-green-900 border-green-700 mt-8">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-4">🚀 Congratulations! Your Website is Ready!</h2>
              <p className="text-green-200 mb-6">
                Your Sushi Yaki restaurant website is now fully functional and ready for customers!
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700">Launch Website</Button>
                </Link>
                <Button variant="outline" onClick={() => window.open("https://vercel.com/dashboard", "_blank")}>
                  Vercel Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle>🎯 Next Steps After Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-gold">Customize Your Content</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Update menu items and prices in Supabase</li>
                  <li>• Add your restaurant's real photos</li>
                  <li>• Update contact information</li>
                  <li>• Customize colors and branding</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gold">Marketing & SEO</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Set up Google Analytics</li>
                  <li>• Add your business to Google Maps</li>
                  <li>• Connect social media accounts</li>
                  <li>• Set up email notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
