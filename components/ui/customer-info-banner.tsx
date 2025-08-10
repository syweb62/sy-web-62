"use client"

interface CustomerInfoBannerProps {
  customerName: string
  orderCount: number
  lastOrder: string
  onEdit: () => void
  onClear: () => void
}

/**
 * Intentionally renders nothing.
 * This preserves the component API without affecting other visuals or functionality.
 */
export function CustomerInfoBanner(_props: CustomerInfoBannerProps) {
  return null
}
