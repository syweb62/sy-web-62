"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { ImageShimmer } from "@/components/ui/image-shimmer"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

interface GalleryImage {
  src: string
  alt: string
  width: number
  height: number
}

interface GalleryGridProps {
  images: GalleryImage[]
  columns?: number
  gap?: number
  className?: string
  onImageClick?: (index: number) => void
}

export function GalleryGrid({ images, columns = 3, gap = 16, className = "", onImageClick }: GalleryGridProps) {
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleImages, setVisibleImages] = useState<number[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            controls.start("visible")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [controls])

  // Staggered image reveal
  useEffect(() => {
    if (prefersReducedMotion) {
      // If user prefers reduced motion, show all images at once
      setVisibleImages(images.map((_, i) => i))
      return
    }

    // Otherwise, stagger the reveal
    const timer = setTimeout(() => {
      const revealInterval = setInterval(() => {
        setVisibleImages((prev) => {
          const nextIndex = prev.length
          if (nextIndex >= images.length) {
            clearInterval(revealInterval)
            return prev
          }
          return [...prev, nextIndex]
        })
      }, 100)

      return () => clearInterval(revealInterval)
    }, 300)

    return () => clearTimeout(timer)
  }, [images.length, prefersReducedMotion])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      ref={containerRef}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-${gap / 4} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      <AnimatePresence>
        {images.map((image, index) => (
          <motion.div
            key={`gallery-${index}`}
            variants={itemVariants}
            className={`relative overflow-hidden rounded-lg cursor-pointer ${
              visibleImages.includes(index) ? "" : "opacity-0"
            }`}
            onClick={() => onImageClick && onImageClick(index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            <div className="overflow-hidden rounded-lg">
              <ImageShimmer
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="w-full h-auto transform transition-transform duration-700 hover:scale-110"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
