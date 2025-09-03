export interface OrderCalculationInput {
  items: Array<{
    price: number
    quantity: number
  }>
  discountRate?: number
  vatRate?: number
  deliveryFee?: number
  freeDeliveryThreshold?: number
  paymentMethod?: "pickup" | "delivery" | "cash" | "bkash"
}

export interface OrderCalculationResult {
  subtotal: number
  discountAmount: number
  discountedSubtotal: number
  vatAmount: number
  deliveryAmount: number
  finalTotal: number
  isFreeDelivery: boolean
  breakdown: {
    itemsTotal: number
    discountApplied: number
    vatApplied: number
    deliveryApplied: number
  }
}

export function calculateOrderTotals(input: OrderCalculationInput): OrderCalculationResult {
  const {
    items,
    discountRate = 0,
    vatRate = 0.05, // 5% VAT
    deliveryFee = 5,
    freeDeliveryThreshold = 875,
    paymentMethod = "delivery",
  } = input

  // Calculate subtotal from items
  const subtotal = items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity
    return total + itemTotal
  }, 0)

  // Calculate discount amount
  const discountAmount = subtotal * discountRate

  // Calculate discounted subtotal
  const discountedSubtotal = subtotal - discountAmount

  // Calculate VAT on discounted amount
  const vatAmount = discountedSubtotal * vatRate

  // Determine delivery amount
  const isPickup = paymentMethod === "pickup"
  const isFreeDelivery = !isPickup && discountedSubtotal >= freeDeliveryThreshold
  const deliveryAmount = isPickup ? 0 : isFreeDelivery ? 0 : deliveryFee

  // Calculate final total
  const finalTotal = discountedSubtotal + vatAmount + deliveryAmount

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    vatAmount,
    deliveryAmount,
    finalTotal,
    isFreeDelivery,
    breakdown: {
      itemsTotal: subtotal,
      discountApplied: discountAmount,
      vatApplied: vatAmount,
      deliveryApplied: deliveryAmount,
    },
  }
}

export function validateOrderCalculation(
  storedOrder: any,
  recalculatedOrder: OrderCalculationResult,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const tolerance = 0.01 // Allow 1 cent tolerance for floating point precision

  // Check subtotal
  if (Math.abs(storedOrder.subtotal - recalculatedOrder.subtotal) > tolerance) {
    errors.push(`Subtotal mismatch: stored ${storedOrder.subtotal}, calculated ${recalculatedOrder.subtotal}`)
  }

  // Check total
  if (Math.abs(storedOrder.total - recalculatedOrder.finalTotal) > tolerance) {
    errors.push(`Total mismatch: stored ${storedOrder.total}, calculated ${recalculatedOrder.finalTotal}`)
  }

  // Check discount
  if (
    storedOrder.discount !== undefined &&
    Math.abs(storedOrder.discount - recalculatedOrder.discountAmount) > tolerance
  ) {
    errors.push(`Discount mismatch: stored ${storedOrder.discount}, calculated ${recalculatedOrder.discountAmount}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
