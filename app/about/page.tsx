import ImageWithFallback from "@/components/image-fallback"

export default function About() {
  return (
    <>
      {/* Our Story Section */}
      <section className="py-20 bg-darkBg full-width-section px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="section-container">
          <div className="responsive-grid grid-cols-1 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <h2 className="text-3xl md:text-4xl font-serif mb-2">Our Story</h2>
                <div className="h-1 w-24 red-accent"></div>
              </div>

              <p className="text-gray-300">
                Sushi Yaki was founded in 2010 by Chef Hiroshi Tanaka, who brought his culinary expertise from Tokyo to
                Bangladesh with a vision to introduce authentic Japanese cuisine to food enthusiasts.
              </p>

              <p className="text-gray-300">
                What began as a small sushi bar has now evolved into a renowned restaurant chain, serving a variety of
                Japanese dishes prepared with the finest ingredients and traditional techniques.
              </p>

              <p className="text-gray-300">
                Our commitment to quality, authenticity, and exceptional service has earned us a loyal customer base and
                numerous accolades in the culinary world.
              </p>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1607301406259-dfb186e15de8?q=80&w=600&h=700&auto=format&fit=crop"
                alt="Our Story"
                width={600}
                height={700}
                className="rounded-lg object-cover w-full h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
