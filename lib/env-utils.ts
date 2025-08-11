export const isDevelopment = () => {
  // Use Next.js built-in development detection
  return process.env.NODE_ENV === "development"
}

export const isProduction = () => {
  return process.env.NODE_ENV === "production"
}

// For client-side usage, we'll use a different approach
export const getClientEnv = () => {
  if (typeof window === "undefined") {
    // Server-side: safe to use NODE_ENV
    return {
      isDev: process.env.NODE_ENV === "development",
      isProd: process.env.NODE_ENV === "production",
    }
  }

  // Client-side: use build-time constants or other indicators
  return {
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
  }
}
