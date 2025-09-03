"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Settings, Store, Mail, Phone, Bell, Save, RefreshCw, Truck, Volume2, Percent, Receipt } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface RestaurantSettings {
  name: string
  description: string
  phone: string
  email: string
  address: string
  website: string
  openingHours: string
  deliveryArea: string
  socialLinks: {
    facebook: string
    instagram: string
    twitter: string
  }
  liveChatLink: string
  homePageHeadline: string
  homePageSubtext: string
}

interface DeliverySettings {
  vatRate: number
  vatEnabled: boolean
  discountEnabled: boolean
  discountPercentage: number
  discountHeadline: string
  newOrderSound: boolean
  newReservationSound: boolean
  soundVolume: number
}

const defaultRestaurantSettings: RestaurantSettings = {
  name: "Sushi Yaki",
  description: "Authentic Japanese Restaurant serving fresh sushi and traditional dishes",
  phone: "+880 1712-345678",
  email: "info@sushiyaki.com",
  address: "123 Main Street, Dhaka, Bangladesh",
  website: "https://sushiyaki.com",
  openingHours: "12:00 PM - 11:00 PM (Everyday)",
  deliveryArea: "3KM to Mohammadpur",
  socialLinks: {
    facebook: "https://facebook.com/sushiyaki",
    instagram: "https://instagram.com/sushiyaki",
    twitter: "https://twitter.com/sushiyaki",
  },
  liveChatLink: "https://tawk.to/sushiyaki",
  homePageHeadline: "Authentic Japanese Cuisine",
  homePageSubtext: "Experience the finest sushi and traditional Japanese dishes",
}

const defaultDeliverySettings: DeliverySettings = {
  vatRate: 15,
  vatEnabled: true,
  discountEnabled: true,
  discountPercentage: 15,
  discountHeadline: "Special 15% Off on All Orders!",
  newOrderSound: true,
  newReservationSound: true,
  soundVolume: 80,
}

export default function SettingsPage() {
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(defaultRestaurantSettings)
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(defaultDeliverySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log("[v0] Loading settings from database...")

      const { data: settings, error } = await supabase.from("website_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (settings) {
        console.log("[v0] Settings loaded successfully:", settings)
        setRestaurantSettings({
          ...defaultRestaurantSettings,
          ...settings.restaurant_settings,
        })
        setDeliverySettings({
          ...defaultDeliverySettings,
          ...settings.delivery_settings,
        })
      } else {
        console.log("[v0] No settings found, using defaults")
      }

      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      console.log("[v0] Saving settings to database...")

      const settingsData = {
        id: 1, // Single settings record
        restaurant_settings: restaurantSettings,
        delivery_settings: deliverySettings,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("website_settings").upsert(settingsData)

      if (error) throw error

      console.log("[v0] Settings saved successfully")
      toast({
        title: "Success",
        description: "Settings saved successfully and will be reflected on the website",
      })
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateRestaurantSetting = (key: keyof RestaurantSettings, value: any) => {
    setRestaurantSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateSocialLink = (platform: string, value: string) => {
    setRestaurantSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }))
  }

  const updateDeliverySetting = (key: keyof DeliverySettings, value: any) => {
    setDeliverySettings((prev) => ({ ...prev, [key]: value }))
  }

  const testNotificationSound = () => {
    const audio = new Audio("/notification-sound.mp3")
    audio.volume = deliverySettings.soundVolume / 100
    audio.play().catch(() => {
      toast({
        title: "Sound Test",
        description: "Could not play notification sound. Please check your browser settings.",
        variant: "destructive",
      })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Settings & Configuration</h1>
            <p className="text-gray-400 mt-1">Manage your restaurant settings and preferences</p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="bg-gold text-black hover:bg-gold/80">
            {saving ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Settings */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Website Content */}
              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Store size={20} />
                    Website Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="homePageHeadline" className="text-gray-300">
                      Homepage Headline
                    </Label>
                    <Input
                      id="homePageHeadline"
                      value={restaurantSettings.homePageHeadline}
                      onChange={(e) => updateRestaurantSetting("homePageHeadline", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homePageSubtext" className="text-gray-300">
                      Homepage Subtext
                    </Label>
                    <Textarea
                      id="homePageSubtext"
                      value={restaurantSettings.homePageSubtext}
                      onChange={(e) => updateRestaurantSetting("homePageSubtext", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Restaurant Description
                    </Label>
                    <Textarea
                      id="description"
                      value={restaurantSettings.description}
                      onChange={(e) => updateRestaurantSetting("description", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone size={20} />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={restaurantSettings.phone}
                      onChange={(e) => updateRestaurantSetting("phone", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantSettings.email}
                      onChange={(e) => updateRestaurantSetting("email", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-300">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={restaurantSettings.address}
                      onChange={(e) => updateRestaurantSetting("address", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liveChatLink" className="text-gray-300">
                      Live Chat Link
                    </Label>
                    <Input
                      id="liveChatLink"
                      value={restaurantSettings.liveChatLink}
                      onChange={(e) => updateRestaurantSetting("liveChatLink", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="https://tawk.to/your-chat-link"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Links */}
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail size={20} />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-gray-300">
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={restaurantSettings.socialLinks.facebook}
                      onChange={(e) => updateSocialLink("facebook", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-gray-300">
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={restaurantSettings.socialLinks.instagram}
                      onChange={(e) => updateSocialLink("instagram", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-gray-300">
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      value={restaurantSettings.socialLinks.twitter}
                      onChange={(e) => updateSocialLink("twitter", e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="https://wa.me/yourphonenumber"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours & Delivery Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings size={20} />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Opening Hours</Label>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-white font-medium">{restaurantSettings.openingHours}</p>
                      <p className="text-sm text-gray-400 mt-1">Fixed schedule - always open these hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck size={20} />
                    Delivery Area
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Delivery Coverage</Label>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-white font-medium">{restaurantSettings.deliveryArea}</p>
                      <p className="text-sm text-gray-400 mt-1">Fixed delivery area coverage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Settings */}
          <TabsContent value="delivery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VAT Management */}
              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt size={20} />
                    VAT Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Enable VAT</Label>
                      <p className="text-sm text-gray-400">Apply VAT to all orders</p>
                    </div>
                    <Switch
                      checked={deliverySettings.vatEnabled}
                      onCheckedChange={(checked) => updateDeliverySetting("vatEnabled", checked)}
                    />
                  </div>
                  {deliverySettings.vatEnabled && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div className="space-y-2">
                        <Label htmlFor="vatRate" className="text-gray-300">
                          VAT Rate (%)
                        </Label>
                        <Input
                          id="vatRate"
                          type="number"
                          value={deliverySettings.vatRate}
                          onChange={(e) => updateDeliverySetting("vatRate", Number.parseFloat(e.target.value))}
                          className="bg-gray-800/50 border-gray-700 text-white"
                          min="0"
                          max="100"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Discount Management */}
              <Card className="bg-black/30 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Percent size={20} />
                    Discount Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Enable Discount</Label>
                      <p className="text-sm text-gray-400">Show discount on cart section</p>
                    </div>
                    <Switch
                      checked={deliverySettings.discountEnabled}
                      onCheckedChange={(checked) => updateDeliverySetting("discountEnabled", checked)}
                    />
                  </div>
                  {deliverySettings.discountEnabled && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage" className="text-gray-300">
                          Discount Percentage (%)
                        </Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          value={deliverySettings.discountPercentage}
                          onChange={(e) =>
                            updateDeliverySetting("discountPercentage", Number.parseFloat(e.target.value))
                          }
                          className="bg-gray-800/50 border-gray-700 text-white"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountHeadline" className="text-gray-300">
                          Discount Headline
                        </Label>
                        <Input
                          id="discountHeadline"
                          value={deliverySettings.discountHeadline}
                          onChange={(e) => updateDeliverySetting("discountHeadline", e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white"
                          placeholder="Enter discount headline for cart section"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notification Sound Settings */}
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 size={20} />
                  Notification Sounds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-300">New Order Sound</Label>
                        <p className="text-sm text-gray-400">Play sound for new orders</p>
                      </div>
                      <Switch
                        checked={deliverySettings.newOrderSound}
                        onCheckedChange={(checked) => updateDeliverySetting("newOrderSound", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-300">New Reservation Sound</Label>
                        <p className="text-sm text-gray-400">Play sound for new reservations</p>
                      </div>
                      <Switch
                        checked={deliverySettings.newReservationSound}
                        onCheckedChange={(checked) => updateDeliverySetting("newReservationSound", checked)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="soundVolume" className="text-gray-300">
                        Sound Volume ({deliverySettings.soundVolume}%)
                      </Label>
                      <Input
                        id="soundVolume"
                        type="range"
                        min="0"
                        max="100"
                        value={deliverySettings.soundVolume}
                        onChange={(e) => updateDeliverySetting("soundVolume", Number.parseInt(e.target.value))}
                        className="bg-gray-800/50 border-gray-700"
                      />
                    </div>
                    <Button
                      onClick={testNotificationSound}
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={!deliverySettings.newOrderSound && !deliverySettings.newReservationSound}
                    >
                      <Bell size={16} className="mr-2" />
                      Test Sound
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
