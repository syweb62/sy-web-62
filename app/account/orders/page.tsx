"use client"
import { useAuth } from "@/hooks/use-auth"
import { useOrderHistory } from "@/hooks/use-order-history"
import { OrderFilters } from "@/components/order-filters"
import { OrderCard } from "@/components/order-card"
import { OrderPagination } from "@/components/order-pagination"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Card, CardContent } from "@/components/ui/card"

export default function OrdersPage() {
  const { user } = useAuth()
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

  if (!user) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your orders</h1>
          <p className="text-gray-400">You need to be logged in to access your order history.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-darkBg text-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gold mb-2">Order History</h1>
            <p className="text-gray-400">Track and manage your past orders</p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Filters */}
            <OrderFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              totalOrders={filteredOrders.length}
            />

            {/* Orders List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <Card className="bg-red-900/20 border-red-800">
                <CardContent className="p-6 text-center">
                  <p className="text-red-400">Error loading orders: {error}</p>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="bg-black/30 border-gray-800">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                  <p className="text-gray-400 mb-4">
                    {hasActiveFilters
                      ? "Try adjusting your search or filter criteria."
                      : "You haven't placed any orders yet."}
                  </p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-gold hover:text-gold/80 transition-colors">
                      Clear all filters
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onReorder={reorderItems} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <OrderPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
