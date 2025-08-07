"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Expand } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/optimized-image"

interface GalleryImage {
  src: string
  alt: string
}

interface GallerySectionProps {
  title?: string
  subtitle?: string
  images: GalleryImage[]
  className?: string
  variant?: "grid" | "carousel" | "masonry"
}

export default function GallerySection({
  title = "Our Gallery",
  subtitle = "Explore our delicious creations and restaurant ambiance",
  images,
  className,
  variant = "grid",
}: GallerySectionProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Intersection observer to trigger animations when gallery comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Carousel navigation
  const scrollToNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: carouselRef.current.offsetWidth * 0.8, behavior: "smooth" })
    }
  }

  const scrollToPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -carouselRef.current.offsetWidth * 0.8, behavior: "smooth" })
    }
  }

  // Render different gallery variants
  const renderGallery = () => {
    switch (variant) {
      case "carousel":
        return (
          <div className="relative mt-8">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {images.map((image, index) => (
                <motion.div
                  key={`carousel-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="min-w-[280px] sm:min-w-[320px] md:min-w-[400px] h-[300px] relative rounded-xl overflow-hidden snap-center mr-4 group"
                  onClick={() => setSelectedImage(index)}
                >
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <Expand className="w-8 h-8 text-white" />
                  </div>
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 400px"
                    quality={75}
                  />
                </motion.div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-lg z-10"
              onClick={scrollToPrev}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-lg z-10"
              onClick={scrollToNext}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        )

      case "grid":
      default:
        return (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <motion.div
                key={`grid-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => setSelectedImage(index)}
              >
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <Expand className="w-8 h-8 text-white" />
                </div>
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={75}
                />
              </motion.div>
            ))}
          </div>
        )
    }
  }

  return (
    <section ref={sectionRef} className={cn("py-12 px-4 md:py-16 bg-black", className)}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-serif mb-4">{title}</h2>
          <div className="h-1 w-24 red-accent mx-auto mb-4" />
          <p className="text-gray-300">{subtitle}</p>
        </motion.div>

        {renderGallery()}

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-4xl w-full h-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full"
                  onClick={() => setSelectedImage(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span className="sr-only">Close</span>
                </Button>

                <div className="relative">
                  <OptimizedImage
                    src={images[selectedImage].src}
                    alt={images[selectedImage].alt}
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                    priority
                    quality={90}
                  />
                </div>

                <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-lg">{images[selectedImage].alt}</p>
                </div>

                {selectedImage > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage(selectedImage - 1)
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                    <span className="sr-only">Previous image</span>
                  </Button>
                )}

                {selectedImage < images.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage(selectedImage + 1)
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                    <span className="sr-only">Next image</span>
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
