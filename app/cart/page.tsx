"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  User,
  Phone,
  MapPin,
  RefreshCw,
  Check,
  Smartphone,
  Banknote,
  Store,
} from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { QuantityControls } from "@/components/ui/quantity-controls"
import { Input } from "@/components/ui/input"
import { CustomerInfoBanner } from "@/components/ui/customer-info-banner"
import { validation } from "@/lib/validation"
import { customerStorage } from "@/lib/customer-storage"

const radioAccentStyle: React.CSSProperties = { accentColor: "#3b82f6" }

interface CheckoutFormData {
  name: string
  phone: string
  address: string
  notes?: string
}

interface FormErrors {
  name?: string
  phone?: string
  address?: string
}

export default function Cart() {
  const { cartItems, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string>("")
  const [isFormAutoFilled, setIsFormAutoFilled] = useState(false)
  const [customerSummary, setCustomerSummary] = useState<{
    name: string
    orderCount: number
    lastOrder: string
  } | null>(null)

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "cash" | "pickup">("cash")
  const [discountApplied, setDiscountApplied] = useState(false)

  const paymentMethodLabel = paymentMethod === "bkash" ? "bKash" : paymentMethod === "cash" ? "Cash" : "Pickup"

  // Calculate pricing
  const vatRate = 0.05 // 5% VAT
  const discountRate = 0.15 // 15% discount
  const deliveryFee = 5

  const subtotal = totalPrice
  const discountAmount = discountApplied ? subtotal * discountRate : 0
  const discountedSubtotal = subtotal - discountAmount
  const vatAmount = discountedSubtotal * vatRate
  const deliveryAmount = paymentMethod === "pickup" ? 0 : deliveryFee
  const finalTotal = discountedSubtotal + vatAmount + deliveryAmount

  // Check if eligible for free delivery (orders over BDT 875)
  const isFreeDelivery = discountedSubtotal >= 875 && paymentMethod !== "pickup"

  // Load customer data on component mount
  useEffect(() => {
    const savedCustomerData = customerStorage.getCustomerData()
    const summary = customerStorage.getCustomerSummary()

    if (savedCustomerData) {
      setFormData({
        name: savedCustomerData.name,
        phone: savedCustomerData.phone,
        address: savedCustomerData.address,
        notes: savedCustomerData.notes || "",
      })
      setIsFormAutoFilled(true)
      setCustomerSummary(summary)
    }

    // If user is logged in, try to get their profile data
    if (user && !savedCustomerData) {
      setFormData((prev) => ({
        ...prev,
        name: (user as any)?.name || (user as any)?.full_name || "",
        phone: (user as any)?.phone || "",
        address: (user as any)?.address || "",
      }))
    }
  }, [user])

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity)
    }
  }

  const handleRemoveItem = (id: string) => {
    removeItem(id)
  }

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDiscountToggle = () => {
    setDiscountApplied(!discountApplied)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!validation.bangladeshiPhone(formData.phone)) {
      newErrors.phone = "Please enter a valid Bangladeshi phone number"
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Please provide a complete address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCheckout = async () => {
    if (!validateForm()) {
      return
    }

    setIsCheckingOut(true)

    try {
      const orderData = {
        customer_name: validation.sanitizeInput(formData.name),
        phone: formData.phone.replace(/\D/g, ""),
        address: validation.sanitizeInput(formData.address),
        payment_method: paymentMethod,
        status: "pending" as const,
        total_price: isFreeDelivery ? finalTotal - deliveryFee : finalTotal,
        subtotal: subtotal,
        discount: discountAmount,
        vat: vatAmount,
        delivery_charge: isFreeDelivery ? 0 : deliveryAmount,
        message: formData.notes ? validation.sanitizeInput(formData.notes) : null,
        items: cartItems.map((item) => ({
          menu_item_id: null, // Cart items don't have menu_item_id
          name: item.name,
          description: (item as any).description || null,
          image: item.image || null,
          price: item.price,
          quantity: item.quantity,
        })),
      }

      console.log("[v0] Sending order data to API:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Order API error:", errorData)
        throw new Error(errorData.error || "Failed to place order")
      }

      const result = await response.json()
      console.log("[v0] Order created successfully:", result)

      setOrderId(result.order.order_id)

      // Save customer data for future orders
      customerStorage.saveCustomerData({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        notes: formData.notes?.trim(),
      })

      setOrderPlaced(true)
      clearCart()
    } catch (error) {
      console.error("[v0] Order failed:", error)
      alert(`Failed to place order: ${error instanceof Error ? error.message : "Please try again."}`)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const proceedToCheckout = () => {
    setShowCheckoutForm(true)
  }

  const backToCart = () => {
    setShowCheckoutForm(false)
  }

  const handleClearCustomerData = () => {
    customerStorage.clearCustomerData()
    setFormData({
      name: "",
      phone: "",
      address: "",
      notes: "",
    })
    setIsFormAutoFilled(false)
    setCustomerSummary(null)
  }

  const handleRefreshData = () => {
    const savedCustomerData = customerStorage.getCustomerData()
    if (savedCustomerData) {
      setFormData({
        name: savedCustomerData.name,
        phone: savedCustomerData.phone,
        address: savedCustomerData.address,
        notes: savedCustomerData.notes || "",
      })
      setIsFormAutoFilled(true)
    }
  }

  // Order success view
  if (orderPlaced) {
    return (
      <>
        <section className="hero-section min-h-[40vh] flex items-center justify-center relative">
          <div className="container mx-auto px-4 text-center z-10 pt-20">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Order Confirmed!</h1>
            <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">Thank you for your order</p>
          </div>
        </section>

        <section className="py-20 bg-darkBg">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-serif mb-4">Order Successfully Placed!</h2>
              <p className="text-gray-300 mb-6">
                Your order ID is: <span className="text-gold font-mono">{orderId}</span>
              </p>
              <p className="text-gray-300 mb-4">
                {"We've received your order and will contact you shortly at "}
                <span className="text-gold">{formData.phone}</span>
                {" to confirm the details and delivery time."}
              </p>
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-300">
                  ✨ Your order has been saved to the database and you can view it in your order history!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/menu">
                  <Button>
                    Order Again <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <Link href="/account/orders">
                  <Button variant="outline">View Order History</Button>
                </Link>
              </div>
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            {showCheckoutForm ? "Checkout" : "Your Cart"}
          </h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            {showCheckoutForm ? "Complete your order details" : "Review your items and proceed to checkout"}
          </p>
        </div>
      </section>

      {/* Cart/Checkout Section */}
      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
            <p className="text-lg sm:text-xl font-semibold text-gold">
              Click the 15% discount option to claim your special discount! 🎉
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4">
          {cartItems.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8 flex justify-center">
                <ShoppingBag size={80} className="text-gray-500" />
              </div>
              <h2 className="text-2xl font-serif mb-4">Your cart is empty</h2>
              <p className="text-gray-300 mb-8">Looks like you haven't added any items to your cart yet.</p>
              <Link href="/menu">
                <Button>
                  Browse Menu <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          ) : showCheckoutForm ? (
            // Checkout Form View (read-only cart controls)
            <div className="max-w-4xl mx-auto">
              {/* Customer Info Banner */}
              {customerSummary && isFormAutoFilled && (
                <CustomerInfoBanner
                  customerName={customerSummary.name}
                  orderCount={customerSummary.orderCount}
                  lastOrder={customerSummary.lastOrder}
                  onEdit={handleRefreshData}
                  onClear={handleClearCustomerData}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Checkout Form */}
                <div className="bg-black/30 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <User size={20} className="text-gold" />
                      <h2 className="text-xl font-serif">Customer Information</h2>
                    </div>
                    {isFormAutoFilled && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshData}
                          className="text-gold hover:text-gold hover:bg-gold/10"
                        >
                          <RefreshCw size={14} className="mr-1" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>

                  {isFormAutoFilled && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                      <p className="text-sm text-blue-300">
                        ℹ️ Form auto-filled with your previous information. Please review and update if needed.
                      </p>
                    </div>
                  )}

                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <Input
                      label="Full Name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      error={errors.name}
                      required
                      icon={<User size={16} />}
                      placeholder="Enter your full name"
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      error={errors.phone}
                      required
                      icon={<Phone size={16} />}
                      placeholder="01XXXXXXXXX"
                      helperText="We'll call you to confirm your order"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 block">
                        Delivery Address <span className="text-red-400 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                          <MapPin size={16} />
                        </div>
                        <textarea
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className={`flex min-h-[80px] w-full rounded-md border border-gray-600 bg-gray-800/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                            errors.address && "border-red-500 focus:ring-red-500"
                          }`}
                          placeholder="Enter your complete delivery address including area, road, house number"
                          rows={3}
                        />
                      </div>
                      {errors.address && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 block">Special Instructions (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        className="flex min-h-[60px] w-full rounded-md border border-gray-600 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Any special requests or delivery instructions..."
                        rows={2}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button onClick={backToCart} variant="outline" className="flex-1 bg-transparent">
                        Back to Cart
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        loading={isCheckingOut}
                        loadingText="Placing Order..."
                        className="flex-1"
                      >
                        Place Order
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Order Summary (read-only cart controls) */}
                <div className="bg-black/30 rounded-lg border border-gray-800 p-6 h-fit sticky top-24">
                  <h2 className="text-xl font-serif mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-2">
                        <div className="w-12 h-12 relative flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm text-gold">BDT {(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6 border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Subtotal ({totalItems} items)</span>
                      <span>BDT {subtotal.toFixed(2)}</span>
                    </div>

                    {/* Discount Section (read-only) */}
                    <div className="flex justify-between items-center text-sm">
                      <button
                        type="button"
                        disabled
                        title="To change discount, go back to Cart"
                        className={`flex items-center gap-2 text-sm transition-all font-bold px-3 py-2 rounded-lg border-2 ${
                          discountApplied
                            ? "text-green-400 hover:text-green-300 bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20"
                            : "text-gray-400 hover:text-gray-300 bg-gray-800/50 border-gray-600/50 hover:bg-gray-700/50"
                        } pointer-events-none opacity-60`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            discountApplied ? "bg-green-500 border-green-500" : "border-gray-500"
                          }`}
                        >
                          {discountApplied && <Check size={12} className="text-white" />}
                        </div>
                        {"🎉 15% Off Special!"}
                      </button>
                      <span className={`text-sm font-medium ${discountApplied ? "text-green-400" : "text-gray-500"}`}>
                        {discountApplied ? `-BDT ${discountAmount.toFixed(2)}` : "BDT 0.00"}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">VAT (5%)</span>
                      <span>BDT {vatAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{paymentMethod === "pickup" ? "Pickup" : "Delivery"}</span>
                      <span className="flex items-center gap-2">
                        {paymentMethod === "pickup" ? (
                          "FREE"
                        ) : isFreeDelivery ? (
                          <>
                            <span className="line-through text-red-500">BDT {deliveryFee.toFixed(2)}</span>
                            <span>FREE</span>
                          </>
                        ) : (
                          `BDT ${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    {/* Minimum order message for free delivery */}
                    {paymentMethod !== "pickup" && !isFreeDelivery && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">
                          Get <span className="text-red-500">FREE</span> delivery
                        </span>
                        <span className="text-gray-400">
                          Add more <span className="text-green-400">BDT {(875 - discountedSubtotal).toFixed(2)}</span>
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between font-medium text-lg">
                        <span>Total</span>
                        <span className="text-gold">
                          BDT {(isFreeDelivery ? finalTotal - deliveryFee : finalTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method (read-only, shows selection like your screenshot) */}
                  <div className="mb-6 border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-white">Payment Method</h3>
                      <span className="text-xs text-gray-200 bg-gray-800/60 border border-gray-700 rounded px-2 py-1">
                        Selected: {paymentMethodLabel}
                      </span>
                    </div>
                    <div className="space-y-2 pointer-events-none" aria-disabled="true">
                      <label className="flex items-center space-x-3 cursor-not-allowed">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          checked={paymentMethod === "bkash"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          tabIndex={-1}
                          style={radioAccentStyle}
                          aria-label="bKash"
                        />
                        <Smartphone size={16} className="text-pink-500" />
                        <span className="text-sm text-gray-300">bKash</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-not-allowed">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          tabIndex={-1}
                          style={radioAccentStyle}
                          aria-label="Cash"
                        />
                        <Banknote size={16} className="text-green-500" />
                        <span className="text-sm text-gray-300">Cash</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-not-allowed">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pickup"
                          checked={paymentMethod === "pickup"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          tabIndex={-1}
                          style={radioAccentStyle}
                          aria-label="Pickup"
                        />
                        <Store size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-300">Pickup</span>
                      </label>
                    </div>
                  </div>

                  {/* No Proceed button on checkout step */}
                  <div className="text-xs text-gray-400">
                    <p>• No account required</p>
                    <p>• Multiple payment options available</p>
                    <p>
                      • {paymentMethod === "pickup" ? "Free pickup available" : "Free delivery on orders over BDT 875"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Cart View - full control with Proceed button
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-black/30 rounded-lg border border-gray-800 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-800">
                    <h2 className="text-xl font-serif">Cart Items ({totalItems})</h2>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Item Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>

                          {/* Item Details */}
                          <div className="flex-grow min-w-0">
                            <h3 className="font-medium text-base sm:text-lg truncate">{item.name}</h3>
                            <p className="text-gold text-sm sm:text-base">BDT {item.price.toFixed(2)}</p>
                            {(item as any).options && Object.keys((item as any).options).length > 0 && (
                              <div className="mt-1 text-xs sm:text-sm text-gray-400">
                                {Object.entries((item as any).options).map(([key, value]) => (
                                  <span key={key} className="mr-2 sm:mr-3">
                                    {key}: {value as any}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quantity + Remove */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <QuantityControls
                                quantity={item.quantity}
                                onQuantityChange={(newQuantity) => handleQuantityChange(item.id, newQuantity)}
                                size="sm"
                              />
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 hover:text-red-400 p-2 rounded-md hover:bg-red-500/10 transition-colors touch-manipulation"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="text-sm font-medium text-gold">
                              BDT {(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 sm:p-6 border-t border-gray-800 flex justify-between items-center">
                    <button onClick={clearCart} className="text-xs text-gray-400 hover:text-white">
                      Clear Cart
                    </button>
                    <Link href="/menu">
                      <Button variant="outline" size="xs" className="text-xs px-3 py-1 bg-transparent">
                        Add More Items
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-black/30 rounded-lg border border-gray-800 p-4 sm:p-6 sticky top-24">
                  <h2 className="text-xl font-serif mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtotal</span>
                      <span>BDT {subtotal.toFixed(2)}</span>
                    </div>

                    {/* Discount (editable in Cart) */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={handleDiscountToggle}
                        className={`flex items-center gap-2 text-sm transition-all font-bold px-3 py-2 rounded-lg border-2 ${
                          discountApplied
                            ? "text-green-400 hover:text-green-300 bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20"
                            : "text-gray-400 hover:text-gray-300 bg-gray-800/50 border-gray-600/50 hover:bg-gray-700/50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            discountApplied ? "bg-green-500 border-green-500" : "border-gray-500"
                          }`}
                        >
                          {discountApplied && <Check size={12} className="text-white" />}
                        </div>
                        🎉 15% Off Special!
                      </button>
                      <span className={`text-sm font-medium ${discountApplied ? "text-green-400" : "text-gray-500"}`}>
                        {discountApplied ? `-BDT ${discountAmount.toFixed(2)}` : "BDT 0.00"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300">VAT (5%)</span>
                      <span>BDT {vatAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300">{paymentMethod === "pickup" ? "Pickup" : "Delivery"}</span>
                      <span className="flex items-center gap-2">
                        {paymentMethod === "pickup" ? (
                          "FREE"
                        ) : isFreeDelivery ? (
                          <>
                            <span className="line-through text-red-500">BDT {deliveryFee.toFixed(2)}</span>
                            <span>FREE</span>
                          </>
                        ) : (
                          `BDT ${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    {paymentMethod !== "pickup" && !isFreeDelivery && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">
                          Get <span className="text-red-500">FREE</span> delivery
                        </span>
                        <span className="text-gray-400">
                          Add more <span className="text-green-400">BDT {(875 - discountedSubtotal).toFixed(2)}</span>
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-gold">
                          BDT {(isFreeDelivery ? finalTotal - deliveryFee : finalTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method (editable in Cart) */}
                  <div className="mb-6 border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-white mb-3">Payment Method</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          checked={paymentMethod === "bkash"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          style={radioAccentStyle}
                        />
                        <Smartphone size={16} className="text-pink-500" />
                        <span className="text-sm text-gray-300">bKash</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          style={radioAccentStyle}
                        />
                        <Banknote size={16} className="text-green-500" />
                        <span className="text-sm text-gray-300">Cash</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pickup"
                          checked={paymentMethod === "pickup"}
                          onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "cash" | "pickup")}
                          className="w-4 h-4 text-gold bg-gray-800 border-gray-600 focus:ring-gold focus:ring-2"
                          style={radioAccentStyle}
                        />
                        <Store size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-300">Pickup</span>
                      </label>
                    </div>
                  </div>

                  <Button onClick={proceedToCheckout} className="w-full mb-4 touch-manipulation">
                    Proceed to Checkout
                  </Button>

                  <div className="text-xs text-gray-400">
                    <p>• No account required</p>
                    <p>• Multiple payment options available</p>
                    <p>
                      • {paymentMethod === "pickup" ? "Free pickup available" : "Free delivery on orders over BDT 875"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
