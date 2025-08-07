interface StructuredDataProps {
  type: "Restaurant" | "MenuItem" | "Review"
  data: Record<string, any>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": type,
    }

    switch (type) {
      case "Restaurant":
        return {
          ...baseSchema,
          name: data.name,
          description: data.description,
          url: data.url,
          telephone: data.telephone,
          servesCuisine: data.cuisine,
          priceRange: data.priceRange,
          address: {
            "@type": "PostalAddress",
            streetAddress: data.address?.street,
            addressLocality: data.address?.city,
            addressRegion: data.address?.region,
            addressCountry: data.address?.country,
          },
          openingHours: data.openingHours,
          aggregateRating: data.rating && {
            "@type": "AggregateRating",
            ratingValue: data.rating.value,
            reviewCount: data.rating.count,
          },
        }
      case "MenuItem":
        return {
          ...baseSchema,
          name: data.name,
          description: data.description,
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: data.currency || "BDT",
          },
          nutrition: data.nutrition,
        }
      default:
        return { ...baseSchema, ...data }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateSchema()),
      }}
    />
  )
}
