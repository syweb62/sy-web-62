import Head from "next/head"

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
}

export function SEOHead({
  title = "Sushi Yaki - Authentic Japanese Restaurant",
  description = "Experience the finest Japanese cuisine at Sushi Yaki. Fresh sushi, traditional dishes, and exceptional service in an elegant atmosphere.",
  keywords = "sushi, japanese restaurant, authentic japanese food, fresh sushi, ramen, teriyaki, japanese cuisine",
  image = "/images/sushiyaki-og-image.jpg",
  url = "https://sushiyaki.com",
  type = "website",
}: SEOHeadProps) {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Sushi Yaki" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="author" content="Sushi Yaki Restaurant" />
      <meta name="theme-color" content="#ffd700" />

      {/* Structured Data for Restaurant */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: "Sushi Yaki",
            description: description,
            url: url,
            image: image,
            servesCuisine: "Japanese",
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: "123 Sushi Street",
              addressLocality: "Gulshan",
              addressRegion: "Dhaka",
              addressCountry: "Bangladesh",
            },
            telephone: "+880 1234 567890",
            openingHours: ["Mo-Fr 11:00-22:00", "Sa 11:00-23:00", "Su 12:00-22:00"],
          }),
        }}
      />
    </Head>
  )
}
