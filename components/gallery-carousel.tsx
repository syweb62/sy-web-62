"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

interface GalleryImage {
  src: string
  alt: string
  width: number
  height: number
}

interface GalleryCarouselProps {
  images: GalleryImage[]
  autoPlay?: boolean
  interval?: number
  className?: string
  onImageClick?: (index: number) => void
}

export function GalleryCarousel({
  images,
  autoPlay = true,
  interval = 5000,
  className = "",
  onImageClick,
}: GalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Handle auto-play
  useEffect(() => {
    if (!autoPlay || isPaused) return

    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        setDirection(1)
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      }, interval)
    }

    startTimer()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [autoPlay, currentIndex, interval, isPaused, images.length])

  const goToPrevious = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const handleDotClick = (index: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  }

  // Reduced motion variants
  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  }

  // Use appropriate animation based on user preference
  const variants = prefersReducedMotion ? fadeVariants : slideVariants

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 },
            }}
            className="absolute inset-0"
            onClick={() => onImageClick && onImageClick(currentIndex)}
          >
            <img
              src={images[currentIndex].src || "/placeholder.svg"}
              alt={images[currentIndex].alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-lg font-medium">{images[currentIndex].alt}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full z-10"
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full z-10"
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-gray-800 w-6" : "bg-gray-400"
            }`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
