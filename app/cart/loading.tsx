import { LoadingSpinner } from "@/components/loading-spinner"

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 text-sm">Loading your cart...</p>
        </div>
      </div>
    </div>
  )
}
