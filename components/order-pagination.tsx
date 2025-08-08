"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface OrderPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function OrderPagination({ currentPage, totalPages, onPageChange }: OrderPaginationProps) {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show current page and 2 on each side
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }
    
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={
              currentPage === page
                ? "bg-gold text-black hover:bg-gold/90"
                : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            }
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
