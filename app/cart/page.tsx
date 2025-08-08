"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, MapPin, User, Mail, Phone, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
}

export default function CartPage() {
  const router = useRouter()
  const { state: cartState, updateQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Auto-fill customer info if user is logged in
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.user_metadata?.full_name || user.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || user.phone || '',
        address: user.user_metadata?.address || (user as any).address || ''
      })
    }
  }, [user])

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
    } else {
      updateQuantity(id, newQuantity)
    }
  }

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateOrderId = () => {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `ORD-${timestamp}-${randomStr}`.toUpperCase()
  }

  const handleCheckout = async () => {
    if (!cartState.items || cartState.items.length === 0) {
      alert('Your cart is empty!')
      return
    }

    if (!customerInfo.name || !customerInfo.email) {
      alert('Please fill in your name and email address.')
      return
    }

    setIsCheckingOut(true)
    console.log('Starting checkout process...')

    try {
      const orderId = generateOrderId()
      console.log('Generated order ID:', orderId)

      // Prepare order data
      const orderData = {
        id: orderId,
        user_id: user?.id || null,
        total_amount: cartState.total,
        status: 'pending',
        customer_name: customerInfo.name.trim(),
        customer_email: customerInfo.email.trim().toLowerCase(),
        customer_phone: customerInfo.phone.trim() || null,
        delivery_address: customerInfo.address.trim() || null,
        created_at: new Date().toISOString()
      }

      console.log('Order data to insert:', orderData)

      // Insert order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log('Order created successfully:', orderResult)

      // Prepare order items
      const orderItems = cartState.items.map(item => ({
        order_id: orderId,
        menu_item_id: null, // We're not linking to menu items directly
        item_name: item.name,
        item_price: item.price,
        item_image: item.image || null,
        item_description: item.description || null,
        quantity: item.quantity,
        price: item.price * item.quantity
      }))

      console.log('Order items to insert:', orderItems)

      // Insert order items
      const { data: itemsResult, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      console.log('Order items created successfully:', itemsResult)

      // Clear cart and redirect
      clearCart()
      alert(`Order placed successfully! Order ID: ${orderId}`)
      router.push('/account/orders')

    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Show loading state
  if (cartState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-16 h-16 mx-auto mb-4"
            onError={(e) => {
              // Fallback to spinner if video fails to load
              e.currentTarget.style.display = 'none'
              const spinner = document.createElement('div')
              spinner.className = 'animate-spin rounded-full h-16 w-16 border-b-2 border-gold mx-auto mb-4'
              e.currentTarget.parentNode?.insertBefore(spinner, e.currentTarget)
            }}
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-HxnXJNGysz6oO66rH7dYCdfUjUidS9.webm" type="video/webm" />
          </video>
          <p className="text-gray-400">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/menu')}
              className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Menu</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-gold" size={24} />
              <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
              {cartState.itemCount > 0 && (
                <span className="bg-gold text-gray-900 px-2 py-1 rounded-full text-sm font-medium">
                  {cartState.itemCount} {cartState.itemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!cartState.items || cartState.items.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto text-gray-600 mb-6" size={80} />
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Looks like you haven't added any delicious items to your cart yet. 
              Browse our menu and discover amazing dishes!
            </p>
            <button
              onClick={() => router.push('/menu')}
              className="bg-gold text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gold/90 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-6">Cart Items</h2>
              
              {cartState.items.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-xl p-6 flex gap-4">
                  {/* Item Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="text-gray-500" size={24} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gold font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                            disabled={isCheckingOut}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3 py-1 min-w-[40px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                            disabled={isCheckingOut}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          disabled={isCheckingOut}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-6">Checkout</h2>
                
                {/* Order Summary */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-700">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({cartState.itemCount} items)</span>
                    <span>${cartState.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span className="text-gold">${(cartState.total + 2.99).toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Information Form */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-white">Customer Information</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <User size={16} className="text-gold" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                      placeholder="Enter your full name"
                      disabled={isCheckingOut}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Mail size={16} className="text-gold" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                      placeholder="Enter your email"
                      disabled={isCheckingOut}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Phone size={16} className="text-gold" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                      placeholder="Enter your phone number"
                      disabled={isCheckingOut}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <MapPin size={16} className="text-gold" />
                      Delivery Address
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
                      placeholder="Enter your delivery address"
                      rows={3}
                      disabled={isCheckingOut}
                    />
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !customerInfo.name || !customerInfo.email}
                  className="w-full bg-gold text-gray-900 py-4 rounded-lg font-bold text-lg hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-6 h-6"
                        onError={(e) => {
                          // Fallback to spinner if video fails to load
                          e.currentTarget.style.display = 'none'
                          const spinner = document.createElement('div')
                          spinner.className = 'animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'
                          e.currentTarget.parentNode?.insertBefore(spinner, e.currentTarget)
                        }}
                      >
                        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-HxnXJNGysz6oO66rH7dYCdfUjUidS9.webm" type="video/webm" />
                      </video>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  By placing your order, you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
