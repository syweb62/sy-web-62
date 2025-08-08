"use client"

import { useState } from "react"
import { useOrderHistory } from "@/hooks/use-order-history"
import { OrderCard } from "@/components/order-card"
import { OrderFilters } from "@/components/order-filters"
import { OrderPagination } from "@/components/order-pagination"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { ShoppingBag, RefreshCw } from 'lucide-react'
import Link from "next/link"

export default function OrdersPage() {
  const {
    orders,
    filteredOrders,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    clearFilters,
    hasActiveFilters,
    reorderItems,
  } = useOrderHistory()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Force a page reload to refresh data
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-darkBg text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gold">Order History</h1>
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
              <span className="ml-3 text-gray-400">Loading your orders...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-darkBg text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gold">Order History</h1>
            <div className="text-center py-20">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                <p className="text-red-400 mb-4">Failed to load orders: {error}</p>
                <Button onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? <LoadingSpinner /> : <RefreshCw size={16} />}
                  <span className="ml-2">Try Again</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-darkBg text-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gold">Order History</h1>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                {isRefreshing ? <LoadingSpinner /> : <RefreshCw size={16} />}
                <span className="ml-2">Refresh</span>
              </Button>
              <Link href="/menu">
                <Button size="sm">
                  <ShoppingBag size={16} />
                  <span className="ml-2">Order Now</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <OrderFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalOrders={filteredOrders.length}
          />

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={80} className="mx-auto text-gray-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-4">No orders found</h2>
              <p className="text-gray-400 mb-8">
                {hasActiveFilters
                  ? "No orders match your current filters. Try adjusting your search criteria."
                  : "You haven't placed any orders yet. Start by browsing our menu!"}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Link href="/menu">
                  <Button>
                    Browse Menu <ShoppingBag size={16} className="ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Orders */}
              <div className="space-y-6 mb-8">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onReorder={reorderItems}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <OrderPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
