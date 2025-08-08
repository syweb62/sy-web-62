"use client"

import { Search, Filter } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrderFiltersProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  totalOrders: number
}

export function OrderFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  onClearFilters, 
  hasActiveFilters, 
  totalOrders 
}: OrderFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by order ID or item name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-black/30 border-gray-700 text-white placeholder:text-gray-400 focus:border-gold focus:ring-gold"
          />
        </div>

        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => onStatusChange(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-48 bg-black/30 border-gray-700 text-white focus:border-gold focus:ring-gold">
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent className="bg-black border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-800">All Orders</SelectItem>
            <SelectItem value="delivered" className="text-white hover:bg-gray-800">Delivered</SelectItem>
            <SelectItem value="preparing" className="text-white hover:bg-gray-800">Preparing</SelectItem>
            <SelectItem value="ready" className="text-white hover:bg-gray-800">Ready</SelectItem>
            <SelectItem value="confirmed" className="text-white hover:bg-gray-800">Confirmed</SelectItem>
            <SelectItem value="pending" className="text-white hover:bg-gray-800">Pending</SelectItem>
            <SelectItem value="cancelled" className="text-white hover:bg-gray-800">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results and Clear */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {totalOrders} order{totalOrders !== 1 ? "s" : ""} found
        </div>

        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Filter size={16} className="mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
