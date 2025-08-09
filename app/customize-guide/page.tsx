"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Database, ImageIcon, Mail, MapPin } from "lucide-react"
import { Palette } from "lucide-react" // Declare the Palette variable

export default function CustomizeGuidePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎨 Customize Your Restaurant</h1>
          <p className="text-gray-400 mb-6">
            Make your Sushi Yaki website truly yours with these customization options
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="text-blue-500" size={24} />
                Update Menu Items & Prices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Modify your menu items, prices, descriptions, and availability in your Supabase database.
              </p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  <li>Open Supabase Dashboard</li>
                  <li>Go to Table Editor → menu_items</li>
                  <li>Click on any row to edit name, price, description</li>
                  <li>Add new items by clicking "Insert" → "Insert row"</li>
                  <li>Upload images to your preferred hosting service</li>
                </ol>
              </div>
              <Button
                onClick={() =>
                  window.open("https://supabase.com/dashboard/project/pjoelkxkcwtzmbyswfhu/editor", "_blank")
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Database Editor
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="text-green-500" size={24} />
                Update Restaurant Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Replace placeholder images with your restaurant's actual photos.</p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Image Locations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>
                    <code>public/images/sushiyaki-logo.png</code> - Restaurant logo
                  </li>
                  <li>
                    <code>app/page.tsx</code> - Hero section images
                  </li>
                  <li>
                    <code>components/gallery-section.tsx</code> - Gallery images
                  </li>
                  <li>Menu item images - Update URLs in database</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Upload to Vercel Blob
                </Button>
                <Button variant="outline" size="sm">
                  Use Cloudinary
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="text-red-500" size={24} />
                Update Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Update your restaurant's address, phone number, and hours.</p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Files to Update:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>
                    <code>app/contact/page.tsx</code> - Contact page details
                  </li>
                  <li>
                    <code>components/footer.tsx</code> - Footer information
                  </li>
                  <li>
                    <code>lib/constants.ts</code> - Restaurant constants
                  </li>
                  <li>Supabase → social_media_links table</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="text-purple-500" size={24} />
                Customize Colors & Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Change colors, fonts, and styling to match your brand.</p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Customization Files:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>
                    <code>tailwind.config.ts</code> - Color scheme and fonts
                  </li>
                  <li>
                    <code>app/globals.css</code> - Global styles
                  </li>
                  <li>
                    <code>components/ui/</code> - Component styling
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-900 border border-yellow-700 p-3 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <strong>Current Colors:</strong> Gold (#D4AF37), Dark Gray (#1F2937), White (#FFFFFF)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="text-orange-500" size={24} />
                Set Up Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Configure email notifications for orders and reservations.</p>
              <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Recommended Services:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>Resend - Simple email API</li>
                  <li>SendGrid - Enterprise email service</li>
                  <li>Nodemailer - Self-hosted solution</li>
                </ul>
              </div>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Email Setup Guide
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-green-900 border-green-700 mt-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">🎯 Pro Tips for Success</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold mb-2 text-green-300">Performance</h3>
                <ul className="space-y-1 text-sm text-green-200">
                  <li>• Optimize images (WebP format)</li>
                  <li>• Use CDN for faster loading</li>
                  <li>• Monitor Core Web Vitals</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-green-300">SEO</h3>
                <ul className="space-y-1 text-sm text-green-200">
                  <li>• Add meta descriptions</li>
                  <li>• Set up Google Business Profile</li>
                  <li>• Create sitemap.xml</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
