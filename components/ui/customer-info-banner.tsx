"use client"

import { User, ShoppingBag, Calendar, X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomerInfoBannerProps {
  customerName: string
  orderCount: number
  lastOrder: string
  onEdit: () => void
  onClear: () => void
}

export function CustomerInfoBanner({ customerName, orderCount, lastOrder, onEdit, onClear }: CustomerInfoBannerProps) {
  return (
    <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-gold" />
          </div>
          <div className="flex-grow">
            <h3 className="font-medium text-white mb-1">Welcome back, {customerName}!</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <ShoppingBag size={14} />
                <span>
                  {orderCount} previous order{orderCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Last order: {lastOrder}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-gold hover:text-gold hover:bg-gold/10 p-2"
            title="Edit information"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 p-2"
            title="Clear saved data"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
