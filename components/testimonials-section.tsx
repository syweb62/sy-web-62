"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { OptimizedImage } from "@/components/optimized-image"

interface Testimonial {
  id: number
  name: string
  avatar: string
  rating: number
  text: string
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
  title?: string
  subtitle?: string
}

export default function TestimonialsSection({
  testimonials,
  title = "What Our Customers Say",
  subtitle,
}: TestimonialsSectionProps) {
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-black to-darkBg"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-serif mb-2">
            {title}
          </h2>
          <div className="h-1 w-24 red-accent mx-auto" aria-hidden="true" />
          {subtitle && <p className="text-gray-300 max-w-2xl mx-auto mt-6">{subtitle}</p>}
        </motion.header>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          role="list"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-darkBg/50 p-8 rounded-lg border border-gray-800"
            >
              <div className="flex items-center gap-4 mb-4">
                <OptimizedImage
                  src={testimonial.avatar}
                  alt={`${testimonial.name} profile picture`}
                  width={60}
                  height={60}
                  className="rounded-full object-cover w-14 h-14"
                  quality={80}
                />
                <div>
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <div className="flex text-gold" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <span key={i} aria-hidden="true">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-gray-300">"{testimonial.text}"</blockquote>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
