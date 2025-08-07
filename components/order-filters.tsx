"use client"

import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface OrderFilters {
  status?: string
  search?: string
  sortBy: "date" | "total" | "status"
  sortOrder: "asc" | "desc"
}

interface OrderFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: Partial<OrderFilters>) => void
  totalOrders: number
}

export function OrderFilters({ filters, onFiltersChange, totalOrders }: OrderFiltersProps) {
  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      search: undefined,
      sortBy: "date",
      sortOrder: "desc",
    })
  }

  const hasActiveFilters = filters.status || filters.search

  return (
    <div className="space-y-4">
      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by order ID or item name..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFiltersChange({ status: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results and Clear */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {totalOrders} order{totalOrders !== 1 ? "s" : ""} found
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <Filter size={16} className="mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
