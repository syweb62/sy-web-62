// Application constants
export const APP_CONFIG = {
  name: "Sushi Yaki",
  description: "Authentic Japanese Restaurant",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.sushiyakiresto.com",
  supportEmail: "support@sushiyaki.com",

  // File upload limits
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],

  // Rate limiting
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Session
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,
}

export const ROUTES = {
  home: "/",
  menu: "/menu",
  gallery: "/gallery",
  about: "/about",
  contact: "/contact",
  book: "/book",
  signin: "/signin",
  signup: "/signup",
  profile: "/account/profile",
  orders: "/account/orders",
  security: "/account/security",
  dashboard: "/dashboard",
  cart: "/cart",
} as const

export const API_ROUTES = {
  auth: {
    signin: "/api/auth/signin",
    signup: "/api/auth/signup",
    signout: "/api/auth/signout",
    session: "/api/auth/session",
    update: "/api/auth/update",
    changePassword: "/api/auth/change-password",
    resetPassword: "/api/auth/reset-password",
  },
  csrf: "/api/csrf-token",
} as const
