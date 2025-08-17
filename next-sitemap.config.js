/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://sushiyaki.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/api/*", "/dashboard/*", "/admin/*", "/account/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/", "/account/"],
      },
    ],
    additionalSitemaps: ["https://sushiyaki.vercel.app/sitemap.xml"],
  },
  transform: async (config, path) => {
    // Custom priority and changefreq for different pages
    const customConfig = {
      "/": { priority: 1.0, changefreq: "weekly" },
      "/menu": { priority: 0.9, changefreq: "daily" },
      "/reservations": { priority: 0.8, changefreq: "weekly" },
      "/gallery": { priority: 0.7, changefreq: "monthly" },
      "/contact": { priority: 0.6, changefreq: "monthly" },
      "/cart": { priority: 0.5, changefreq: "weekly" },
    }

    const custom = customConfig[path] || {}

    return {
      loc: path,
      changefreq: custom.changefreq || "monthly",
      priority: custom.priority || 0.5,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
}
