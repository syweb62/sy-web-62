import Link from "next/link"
import { Calendar, User, ArrowRight } from 'lucide-react'
import ImageWithFallback from "@/components/image-fallback"

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "The Art of Sushi Making: Traditions and Techniques",
      excerpt:
        "Discover the ancient traditions and meticulous techniques behind the art of sushi making, from rice preparation to fish selection.",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=800&h=450&auto=format&fit=crop",
      date: "May 15, 2023",
      author: "Chef Hiroshi Tanaka",
      category: "Culinary Arts",
    },
    {
      id: 2,
      title: "Exploring Regional Japanese Cuisines",
      excerpt:
        "Japan's diverse regional cuisines offer a fascinating glimpse into the country's culinary heritage. From Hokkaido's seafood to Osaka's street food.",
      image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=800&h=450&auto=format&fit=crop",
      date: "April 22, 2023",
      author: "Akira Sato",
      category: "Food Culture",
    },
    {
      id: 3,
      title: "Sake Pairing Guide: Enhancing Your Japanese Dining Experience",
      excerpt:
        "Learn how to pair different types of sake with Japanese dishes to elevate your dining experience and appreciate the nuanced flavors.",
      image: "https://images.unsplash.com/photo-1627042633145-b780d842ba0a?q=80&w=800&h=450&auto=format&fit=crop",
      date: "March 10, 2023",
      author: "Mei Lin",
      category: "Beverages",
    },
    {
      id: 4,
      title: "The Health Benefits of Japanese Cuisine",
      excerpt:
        "Japanese cuisine is renowned for its health benefits. Explore how ingredients like fish, seaweed, and fermented foods contribute to longevity.",
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&h=450&auto=format&fit=crop",
      date: "February 28, 2023",
      author: "Dr. Tanaka Yamamoto",
      category: "Nutrition",
    },
    {
      id: 5,
      title: "Seasonal Ingredients in Japanese Cooking",
      excerpt:
        "The Japanese concept of 'shun' celebrates ingredients at their peak. Discover how seasonal eating influences Japanese culinary traditions.",
      image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=800&h=450&auto=format&fit=crop",
      date: "January 15, 2023",
      author: "Chef Hiroshi Tanaka",
      category: "Ingredients",
    },
    {
      id: 6,
      title: "The Evolution of Ramen: From Street Food to Gourmet Dish",
      excerpt:
        "Trace the fascinating journey of ramen from its humble beginnings as Chinese-inspired street food to its status as a beloved global phenomenon.",
      image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=800&h=450&auto=format&fit=crop",
      date: "December 5, 2022",
      author: "Kenji Nakamura",
      category: "Food History",
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-[60vh] flex items-center justify-center relative">
        <div className="container mx-auto px-4 text-center z-10 pt-20">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Blog</h1>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-200">
            Explore articles about Japanese cuisine, cooking techniques, and food culture.
          </p>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-20 bg-darkBg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-black/30 rounded-lg overflow-hidden border border-gray-800 transition-transform hover:-translate-y-2 duration-300"
              >
                <div className="h-56 relative">
                  <ImageWithFallback
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    width={800}
                    height={450}
                    className="object-cover"
                    fill
                  />
                  <div className="absolute top-4 right-4 bg-gold text-black text-xs font-medium px-2 py-1 rounded">
                    {post.category}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-serif mb-3 line-clamp-2">
                    <Link href={`/blog/${post.id}`} className="hover:text-gold transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

                  <Link href={`/blog/${post.id}`} className="inline-flex items-center text-gold hover:underline">
                    Read More <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-md bg-gold text-black font-medium">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-md bg-black/30 text-white hover:bg-black/50">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-md bg-black/30 text-white hover:bg-black/50">
                3
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-md bg-black/30 text-white hover:bg-black/50">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
