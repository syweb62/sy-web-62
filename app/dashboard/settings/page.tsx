"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Store,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Shield,
  Bell,
  Database,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Truck,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface RestaurantSettings {
  name: string
  description: string
  phone: string
  email: string
  address: string
  website: string
  openingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  currency: string
  timezone: string
  taxRate: number
  deliveryFee: number
  minimumOrder: number
  maxDeliveryDistance: number
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  newOrderAlerts: boolean
  lowStockAlerts: boolean
  customerFeedbackAlerts: boolean
  dailyReports: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

interface SystemSettings {
  maintenanceMode: boolean
  allowOnlineOrders: boolean
  allowReservations: boolean
  allowGuestOrders: boolean
  autoAcceptOrders: boolean
  requireOrderConfirmation: boolean
  enableLoyaltyProgram: boolean
  enableReviews: boolean
}

const defaultRestaurantSettings: RestaurantSettings = {
  name: "Sushi Yaki",
  description: "Authentic Japanese Restaurant serving fresh sushi and traditional dishes",
  phone: "+880 1712-345678",
  email: "info@sushiyaki.com",
  address: "123 Main Street, Dhaka, Bangladesh",
  website: "https://sushiyaki.com",
  openingHours: {
    monday: { open: "11:00", close: "22:00", closed: false },
    tuesday: { open: "11:00", close: "22:00", closed: false },
    wednesday: { open: "11:00", close: "22:00", closed: false },
    thursday: { open: "11:00", close: "22:00", closed: false },
    friday: { open: "11:00", close: "23:00", closed: false },
    saturday: { open: "11:00", close: "23:00", closed: false },
    sunday: { open: "12:00", close: "21:00", closed: false },
  },
  currency: "BDT",
  timezone: "Asia/Dhaka",
  taxRate: 15,
  deliveryFee: 50,
  minimumOrder: 200,
  maxDeliveryDistance: 10,
}

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  newOrderAlerts: true,
  lowStockAlerts: true,
  customerFeedbackAlerts: true,
  dailyReports: true,
  weeklyReports: true,
  monthlyReports: false,
}

const defaultSystemSettings: SystemSettings = {
  maintenanceMode: false,
  allowOnlineOrders: true,
  allowReservations: true,
  allowGuestOrders: true,
  autoAcceptOrders: false,
  requireOrderConfirmation: true,
  enableLoyaltyProgram: false,
  enableReviews: true,
}

export default function SettingsPage() {
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(defaultRestaurantSettings)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("restaurant")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real app, you would load settings from your database
      // For now, we'll use the default settings
      setLoading(false)
    } catch (error) {
      console.error("Error loading settings:", error)
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
      // In a real app, you would save settings to your database
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
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

  const updateOpeningHours = (day: string, field: string, value: any) => {
    setRestaurantSettings((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value,
        },
      },
    }))
  }

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateSystemSetting = (key: keyof SystemSettings, value: boolean) => {
    setSystemSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Restaurant Settings */}
        <TabsContent value="restaurant" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store size={20} />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Restaurant Name
                  </Label>
                  <Input
                    id="name"
                    value={restaurantSettings.name}
                    onChange={(e) => updateRestaurantSetting("name", e.target.value)}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={restaurantSettings.description}
                    onChange={(e) => updateRestaurantSetting("description", e.target.value)}
                    className="bg-gray-800/50 border-gray-700"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={restaurantSettings.website}
                    onChange={(e) => updateRestaurantSetting("website", e.target.value)}
                    className="bg-gray-800/50 border-gray-700"
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
                    className="bg-gray-800/50 border-gray-700"
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
                    className="bg-gray-800/50 border-gray-700"
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
                    className="bg-gray-800/50 border-gray-700"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opening Hours */}
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock size={20} />
                Opening Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(restaurantSettings.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="text-gray-300 capitalize">{day}</Label>
                    </div>
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateOpeningHours(day, "closed", !checked)}
                    />
                    {!hours.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOpeningHours(day, "open", e.target.value)}
                          className="w-32 bg-gray-800/50 border-gray-700"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOpeningHours(day, "close", e.target.value)}
                          className="w-32 bg-gray-800/50 border-gray-700"
                        />
                      </>
                    )}
                    {hours.closed && <Badge variant="secondary">Closed</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Delivery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign size={20} />
                  Pricing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-gray-300">
                    Currency
                  </Label>
                  <Select
                    value={restaurantSettings.currency}
                    onValueChange={(value) => updateRestaurantSetting("currency", value)}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-gray-300">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={restaurantSettings.taxRate}
                    onChange={(e) => updateRestaurantSetting("taxRate", Number.parseFloat(e.target.value))}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck size={20} />
                  Delivery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee" className="text-gray-300">
                    Delivery Fee (৳)
                  </Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={restaurantSettings.deliveryFee}
                    onChange={(e) => updateRestaurantSetting("deliveryFee", Number.parseFloat(e.target.value))}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrder" className="text-gray-300">
                    Minimum Order (৳)
                  </Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    value={restaurantSettings.minimumOrder}
                    onChange={(e) => updateRestaurantSetting("minimumOrder", Number.parseFloat(e.target.value))}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDeliveryDistance" className="text-gray-300">
                    Max Delivery Distance (km)
                  </Label>
                  <Input
                    id="maxDeliveryDistance"
                    type="number"
                    value={restaurantSettings.maxDeliveryDistance}
                    onChange={(e) => updateRestaurantSetting("maxDeliveryDistance", Number.parseFloat(e.target.value))}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings size={20} />
                  General System Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Maintenance Mode</Label>
                    <p className="text-sm text-gray-400">Temporarily disable the website</p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => updateSystemSetting("maintenanceMode", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Allow Online Orders</Label>
                    <p className="text-sm text-gray-400">Enable online ordering system</p>
                  </div>
                  <Switch
                    checked={systemSettings.allowOnlineOrders}
                    onCheckedChange={(checked) => updateSystemSetting("allowOnlineOrders", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Allow Reservations</Label>
                    <p className="text-sm text-gray-400">Enable table reservation system</p>
                  </div>
                  <Switch
                    checked={systemSettings.allowReservations}
                    onCheckedChange={(checked) => updateSystemSetting("allowReservations", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Allow Guest Orders</Label>
                    <p className="text-sm text-gray-400">Allow orders without registration</p>
                  </div>
                  <Switch
                    checked={systemSettings.allowGuestOrders}
                    onCheckedChange={(checked) => updateSystemSetting("allowGuestOrders", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield size={20} />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Auto Accept Orders</Label>
                    <p className="text-sm text-gray-400">Automatically accept new orders</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoAcceptOrders}
                    onCheckedChange={(checked) => updateSystemSetting("autoAcceptOrders", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Require Order Confirmation</Label>
                    <p className="text-sm text-gray-400">Send confirmation emails for orders</p>
                  </div>
                  <Switch
                    checked={systemSettings.requireOrderConfirmation}
                    onCheckedChange={(checked) => updateSystemSetting("requireOrderConfirmation", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Enable Loyalty Program</Label>
                    <p className="text-sm text-gray-400">Reward returning customers</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableLoyaltyProgram}
                    onCheckedChange={(checked) => updateSystemSetting("enableLoyaltyProgram", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Enable Reviews</Label>
                    <p className="text-sm text-gray-400">Allow customers to leave reviews</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableReviews}
                    onCheckedChange={(checked) => updateSystemSetting("enableReviews", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell size={20} />
                  Alert Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Email Notifications</Label>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => updateNotificationSetting("emailNotifications", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">SMS Notifications</Label>
                    <p className="text-sm text-gray-400">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => updateNotificationSetting("smsNotifications", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">New Order Alerts</Label>
                    <p className="text-sm text-gray-400">Get notified of new orders</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newOrderAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("newOrderAlerts", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Low Stock Alerts</Label>
                    <p className="text-sm text-gray-400">Get notified when items are low in stock</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("lowStockAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail size={20} />
                  Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Daily Reports</Label>
                    <p className="text-sm text-gray-400">Receive daily sales reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReports}
                    onCheckedChange={(checked) => updateNotificationSetting("dailyReports", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Weekly Reports</Label>
                    <p className="text-sm text-gray-400">Receive weekly performance reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => updateNotificationSetting("weeklyReports", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Monthly Reports</Label>
                    <p className="text-sm text-gray-400">Receive monthly business reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={(checked) => updateNotificationSetting("monthlyReports", checked)}
                  />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Customer Feedback Alerts</Label>
                    <p className="text-sm text-gray-400">Get notified of new reviews and feedback</p>
                  </div>
                  <Switch
                    checked={notificationSettings.customerFeedbackAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("customerFeedbackAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database size={20} />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">System Version</Label>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <Badge variant="outline">v2.1.0</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Database Status</Label>
                  <div className="p-3 bg-gray-800/50 rounded-lg flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Connected</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Last Backup</Label>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Storage Used</Label>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">2.4 GB / 10 GB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle size={20} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-800 bg-red-900/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Reset All Settings</h4>
                <p className="text-sm text-gray-400 mb-4">
                  This will reset all settings to their default values. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm">
                  Reset Settings
                </Button>
              </div>
              <div className="p-4 border border-red-800 bg-red-900/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Export Data</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Download a backup of all your restaurant data including orders, customers, and settings.
                </p>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
