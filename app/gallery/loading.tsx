import { Skeleton } from "@/components/ui/skeleton"

export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section Skeleton */}
      <div className="relative h-[40vh] min-h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse">
        <div className="container mx-auto h-full flex flex-col justify-center items-center text-center px-4">
          <div className="mb-4">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-16 w-16 mx-auto"
              aria-label="Loading animation"
            >
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-HxnXJNGysz6oO66rH7dYCdfUjUidS9.webm" type="video/webm" />
              <Skeleton className="h-16 w-16 rounded-full" />
            </video>
          </div>
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 max-w-full" />
        </div>
      </div>

      {/* Gallery Section Skeletons */}
      <div className="py-12 px-4 md:py-16 container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 max-w-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="aspect-square relative rounded-lg overflow-hidden">
                <Skeleton className="absolute inset-0" />
              </div>
            ))}
        </div>
      </div>

      {/* Second Gallery Section */}
      <div className="py-12 px-4 md:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 max-w-full mx-auto" />
          </div>

          <div className="flex overflow-x-hidden gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="min-w-[280px] h-[300px] rounded-xl" />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
