export default function ImageGuide() {
  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto my-12 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Image Replacement Guide for Sushi Yaki Website</h2>

      <p className="mb-6">
        This guide will help you replace the placeholder images with actual restaurant photos. All images should be
        placed in the <code>public/images/</code> directory with the same filenames to maintain compatibility with the
        existing code.
      </p>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Brand Images</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>logo.png</strong> - Restaurant logo (transparent background recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Hero Section</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>hero-bg.jpg</strong> - Dark, atmospheric image of Japanese food or restaurant interior
              (1920×1080px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">About Section</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>about-img.jpg</strong> - Image showcasing the restaurant or chef (600×700px recommended)
            </li>
            <li>
              <strong>about-story.jpg</strong> - Image related to the restaurant's history (600×700px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Menu Items</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>menu-1.jpg</strong> - Sushi Platter (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-2.jpg</strong> - Teriyaki Salmon (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-3.jpg</strong> - Ramen Bowl (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-4.jpg</strong> - Gyoza (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-5.jpg</strong> - Dragon Roll (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-6.jpg</strong> - Miso Soup (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-7.jpg</strong> - Chicken Katsu Bento (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-8.jpg</strong> - Matcha Green Tea Ice Cream (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-9.jpg</strong> - Sake (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-10.jpg</strong> - Mochi Ice Cream (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-11.jpg</strong> - Spicy Tuna Roll (square format, 600×600px recommended)
            </li>
            <li>
              <strong>menu-12.jpg</strong> - Japanese Green Tea (square format, 600×600px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Gallery Images</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>gallery-1.jpg through gallery-8.jpg</strong> - High-quality images of food, restaurant interior,
              and dining experiences (square format, 600×600px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Testimonials</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>testimonial-1.jpg through testimonial-3.jpg</strong> - Customer portraits (square format,
              200×200px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Team/Chef Images</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>chef-1.jpg through chef-3.jpg</strong> - Professional photos of chefs (portrait orientation,
              600×800px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Restaurant Spaces</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>restaurant-interior.jpg</strong> - Main dining area (600×700px recommended)
            </li>
            <li>
              <strong>private-dining.jpg</strong> - Private dining space (600×700px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Branch Images</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>branch-1.jpg through branch-3.jpg</strong> - Exterior or interior shots of different restaurant
              locations (16:9 ratio, 600×338px recommended)
            </li>
          </ul>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Special Offers</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>special-1.jpg and special-2.jpg</strong> - Images showcasing special menu items or promotions
              (16:9 ratio, 600×338px recommended)
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Blog Images</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>blog-1.jpg through blog-6.jpg</strong> - Images related to blog post topics (16:9 ratio, 800×450px
              recommended)
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Image Optimization Tips:</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use JPG format for photos and PNG for graphics with transparency</li>
          <li>Optimize images for web to keep file sizes small (aim for under 200KB per image)</li>
          <li>Maintain consistent aspect ratios within each category</li>
          <li>Use high-quality, well-lit images that showcase the food and atmosphere</li>
          <li>Consider using a consistent color treatment across images for brand cohesion</li>
        </ul>
      </div>
    </div>
  )
}
