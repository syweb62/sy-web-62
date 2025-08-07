import GallerySection from "@/components/gallery-section"

// Gallery images data
const galleryImages = [
  {
    src: "/placeholder.svg?height=600&width=600",
    alt: "Signature Sushi Platter",
    width: 600,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Restaurant Interior",
    width: 800,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=800&width=600",
    alt: "Chef Preparing Sushi",
    width: 600,
    height: 800,
  },
  {
    src: "/placeholder.svg?height=600&width=600",
    alt: "Sake Selection",
    width: 600,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=600&width=900",
    alt: "Private Dining Room",
    width: 900,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=600&width=600",
    alt: "Matcha Dessert",
    width: 600,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=800&width=600",
    alt: "Traditional Japanese Garden View",
    width: 600,
    height: 800,
  },
  {
    src: "/placeholder.svg?height=600&width=600",
    alt: "Seasonal Special Roll",
    width: 600,
    height: 600,
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Teppanyaki Grill",
    width: 800,
    height: 600,
  },
]

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
            opacity: 0.6,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>
        <div className="relative container mx-auto h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">Our Gallery</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Explore the visual journey of our culinary creations and restaurant ambiance
          </p>
        </div>
      </section>

      {/* Grid Gallery */}
      <GallerySection
        title="Featured Gallery"
        subtitle="Explore our most popular dishes and restaurant highlights"
        images={galleryImages}
        variant="grid"
      />

      {/* Carousel Gallery */}
      <GallerySection
        title="Seasonal Specials"
        subtitle="Our latest seasonal menu items and limited-time offerings"
        images={galleryImages.slice(3, 8)}
        variant="carousel"
        className="bg-gray-50 dark:bg-gray-900"
      />

      {/* Masonry Gallery */}
      <GallerySection
        title="Restaurant Experience"
        subtitle="Take a peek inside our restaurant and the dining experience"
        images={galleryImages.slice(1, 7)}
        variant="masonry"
      />
    </main>
  )
}
